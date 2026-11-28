import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

test('health reports instance and X-Served-By header', async () => {
  const res = await request(app).get('/api/health');
  // Dependencies are not connected in unit tests, so the service reports "degraded".
  assert.equal(res.status, 503);
  assert.equal(res.body.status, 'degraded');
  assert.ok(res.body.instance);
  assert.equal(res.headers['x-served-by'], res.body.instance);
});

test('unknown api route returns the shared error format', async () => {
  const res = await request(app).get('/api/v1/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'ROUTE_NOT_FOUND');
  assert.ok(res.body.error.message);
  assert.ok('details' in res.body.error);
});

test('mongo operator keys are rejected', async () => {
  const res = await request(app).get('/api/v1/health?email[$ne]=x');
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'UNSAFE_INPUT');
});
