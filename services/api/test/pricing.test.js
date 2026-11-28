import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeTotals } from '../src/lib/pricing.js';

test('VAT 10% and flat shipping below the free-shipping threshold', () => {
  const t = computeTotals(1_000_000);
  assert.equal(t.tax, 100_000);
  assert.equal(t.shippingFee, 30_000);
  assert.equal(t.total, 1_130_000);
  assert.equal(t.pointsEarned, 113); // floor(1,130,000 × 10% / 1,000)
});

test('free shipping from 5,000,000đ subtotal', () => {
  assert.equal(computeTotals(5_000_000).shippingFee, 0);
});

test('percentage discount applies before VAT', () => {
  const t = computeTotals(10_000_000, { discountPercent: 10 });
  assert.equal(t.discountAmount, 1_000_000);
  assert.equal(t.tax, 900_000);
  assert.equal(t.total, 9_900_000);
});

test('points are capped by balance and order total; 1 point = 1,000đ', () => {
  const t = computeTotals(1_000_000, { pointsRequested: 5_000, pointsBalance: 300 });
  assert.equal(t.pointsUsed, 300);
  assert.equal(t.total, 1_130_000 - 300_000);
  const capped = computeTotals(100_000, { pointsRequested: 9_999, pointsBalance: 9_999 });
  assert.equal(capped.pointsUsed, 140); // 100,000 + 10,000 VAT + 30,000 shipping = 140,000đ
  assert.equal(capped.total, 0);
});
