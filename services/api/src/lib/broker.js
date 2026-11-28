import amqp from 'amqplib';
import env from '../config/env.js';

// Event bus client. The api publishes domain events to a durable topic exchange and
// consumes only `search.reindex_requested` (sent by search-service when its index is empty).
export const EXCHANGE = 'pcshop.events';

let connection;
let channel;
let connecting;
const consumers = [];

async function connect() {
  connection = await amqp.connect(env.rabbitUrl);
  connection.on('error', (err) => console.error('[api] rabbitmq error:', err.message));
  connection.on('close', () => {
    channel = undefined;
    connection = undefined;
    console.warn('[api] rabbitmq connection closed, reconnecting…');
    setTimeout(() => ensureChannel().catch(() => {}), 3000);
  });
  channel = await connection.createConfirmChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  for (const c of consumers) await startConsumer(c);
  console.log('[api] RabbitMQ connected');
}

export async function connectBroker(retries = 30) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await connect();
      return;
    } catch (err) {
      if (attempt >= retries) throw err;
      console.warn(`[api] RabbitMQ not ready (${err.message}), retry ${attempt}/${retries}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function ensureChannel() {
  if (channel) return channel;
  connecting ??= connect().finally(() => {
    connecting = undefined;
  });
  await connecting;
  return channel;
}

/** Publish a persistent JSON event and wait for the broker's confirmation. */
export async function publish(routingKey, payload) {
  const ch = await ensureChannel();
  const body = Buffer.from(JSON.stringify({ event: routingKey, at: new Date().toISOString(), data: payload }));
  ch.publish(EXCHANGE, routingKey, body, { persistent: true, contentType: 'application/json' });
  await ch.waitForConfirms();
}

async function startConsumer({ queue, bindings, handler }) {
  await channel.assertQueue(queue, { durable: true });
  for (const key of bindings) await channel.bindQueue(queue, EXCHANGE, key);
  await channel.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      await handler(JSON.parse(msg.content.toString()));
      channel.ack(msg);
    } catch (err) {
      console.error(`[api] consumer ${queue} failed:`, err.message);
      channel.nack(msg, false, false);
    }
  });
}

/** Competing consumer: all replicas share one queue, so each message is handled once. */
export async function consume(queue, bindings, handler) {
  const c = { queue, bindings, handler };
  consumers.push(c);
  if (channel) await startConsumer(c);
}

export function brokerReady() {
  return Boolean(channel);
}

export async function closeBroker() {
  if (connection) await connection.close();
}
