import { startConsumer } from './broker.js';
import { sendMail, verifyMailer } from './mailer.js';
import { orderCreatedEmail, orderStatusEmail, resetEmail, welcomeEmail } from './templates.js';

// notification-service: the only component that sends e-mail. It reacts to domain events
// published by the api on RabbitMQ — fully asynchronous, no direct calls between services.
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

const handlers = {
  'user.registered': (d) => sendMail({ to: d.email, ...welcomeEmail(d) }),
  'password.reset_requested': (d) => sendMail({ to: d.email, ...resetEmail(d) }),
  'order.created': (d) => sendMail({ to: d.order.email, ...orderCreatedEmail(d, BASE_URL) }),
  'order.status_changed': (d) => sendMail({ to: d.order.email, ...orderStatusEmail(d, BASE_URL) }),
};

async function main() {
  await verifyMailer();
  await startConsumer({
    url: RABBITMQ_URL,
    queue: 'notification.events',
    bindings: Object.keys(handlers),
    handler: async (routingKey, data) => {
      const handle = handlers[routingKey];
      if (handle) await handle(data);
    },
  });
}

main().catch((err) => {
  console.error('[notification] fatal', err);
  process.exit(1);
});
