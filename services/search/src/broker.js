import amqp from 'amqplib';

// search-service's own RabbitMQ client: durable queue, delayed retry queue, dead-letter queue.
export const EXCHANGE = 'pcshop.events';
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5_000;

let channel;

async function connectWithRetry(url, retries = 60) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await amqp.connect(url);
    } catch (err) {
      if (attempt >= retries) throw err;
      console.warn(`[search] RabbitMQ not ready (${err.message}), retry ${attempt}/${retries}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

export async function startConsumer({ url, queue, bindings, handler }) {
  const conn = await connectWithRetry(url);
  conn.on('close', () => {
    console.error('[search] RabbitMQ connection closed, exiting so Docker restarts the service');
    process.exit(1);
  });
  channel = await conn.createChannel();
  const ch = channel;
  const retryQueue = `${queue}.retry`;
  const deadQueue = `${queue}.dead`;

  await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
  await ch.assertQueue(queue, {
    durable: true,
    arguments: { 'x-dead-letter-exchange': '', 'x-dead-letter-routing-key': retryQueue },
  });
  await ch.assertQueue(retryQueue, {
    durable: true,
    arguments: { 'x-message-ttl': RETRY_DELAY_MS, 'x-dead-letter-exchange': '', 'x-dead-letter-routing-key': queue },
  });
  await ch.assertQueue(deadQueue, { durable: true });
  for (const key of bindings) await ch.bindQueue(queue, EXCHANGE, key);
  await ch.prefetch(20);

  await ch.consume(queue, async (msg) => {
    if (!msg) return;
    const attempts = (msg.properties.headers?.['x-death'] || []).find((d) => d.queue === queue)?.count || 0;
    let event;
    try {
      event = JSON.parse(msg.content.toString());
      await handler(msg.fields.routingKey, event.data);
      ch.ack(msg);
    } catch (err) {
      console.error(`[search] ${msg.fields.routingKey} failed (attempt ${attempts + 1}): ${err.message}`);
      if (attempts + 1 >= MAX_ATTEMPTS || !event) {
        ch.sendToQueue(deadQueue, msg.content, { persistent: true, headers: { 'x-error': err.message } });
        ch.ack(msg);
      } else {
        ch.nack(msg, false, false);
      }
    }
  });
  console.log(`[search] consuming ${queue} (${bindings.join(', ')})`);
}

export function publish(routingKey, data) {
  if (!channel) throw new Error('RabbitMQ channel not ready');
  const body = Buffer.from(JSON.stringify({ event: routingKey, at: new Date().toISOString(), data }));
  channel.publish(EXCHANGE, routingKey, body, { persistent: true, contentType: 'application/json' });
}

export const brokerReady = () => Boolean(channel);
