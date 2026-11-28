import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orderCreatedEmail, orderStatusEmail, resetEmail, welcomeEmail } from '../src/templates.js';

const order = {
  orderNumber: 'PC2611280001',
  email: 'a@example.com',
  customerName: 'Nguyễn <b>An</b>',
  createdAt: '2026-11-28T05:00:00.000Z',
  status: 'pending',
  paymentMethod: 'cod',
  items: [
    {
      productName: 'Samsung 990 Pro',
      variantName: '1TB',
      qty: 2,
      unitPrice: 2_890_000,
      lineTotal: 5_780_000,
    },
  ],
  subtotal: 5_780_000,
  discountCode: 'NEW10',
  discountPercent: 10,
  discountAmount: 578_000,
  tax: 520_200,
  shippingFee: 0,
  pointsUsed: 0,
  pointsEarned: 572,
  total: 5_722_200,
  shippingAddress: {
    recipientName: 'An',
    phone: '0901234567',
    street: '1 Lê Lợi',
    district: 'Quận 1',
    city: 'HCM',
  },
};

test('order confirmation contains full order details with formatted prices', () => {
  const { subject, html } = orderCreatedEmail({ order, setPasswordUrl: null }, 'http://localhost:8080');
  assert.match(subject, /PC2611280001/);
  assert.match(html, /5\.722\.200đ/);
  assert.match(html, /NEW10/);
  assert.match(html, /572 điểm/);
  assert.match(html, /account\/orders\/PC2611280001/);
});

test('guest confirmation includes the set-password link', () => {
  const { html } = orderCreatedEmail(
    { order, setPasswordUrl: 'http://x/reset-password?token=abc' },
    'http://x',
  );
  assert.match(html, /reset-password\?token=abc/);
});

test('user-supplied text is HTML-escaped', () => {
  const { html } = orderStatusEmail({ order, status: 'confirmed', note: '<script>x</script>' }, 'http://x');
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test('account e-mails carry their links', () => {
  assert.match(welcomeEmail({ fullName: 'A', setPasswordUrl: 'http://x/s' }).html, /http:\/\/x\/s/);
  assert.match(resetEmail({ fullName: 'A', resetUrl: 'http://x/r' }).html, /30 phút/);
});
