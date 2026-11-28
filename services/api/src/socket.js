import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import mongoose from 'mongoose';
import env from './config/env.js';

// Socket.io with the Redis adapter: an event emitted by any api replica reaches clients
// connected to every other replica. Clients use the websocket transport only, so no
// sticky sessions are needed at the load balancer.
let io;

export function initSocket(server) {
  const pub = new Redis(env.redisUrl);
  const sub = pub.duplicate();
  io = new Server(server, {
    path: '/socket.io',
    transports: ['websocket'],
    adapter: createAdapter(pub, sub),
    serveClient: false,
  });

  io.on('connection', (socket) => {
    socket.on('product:join', (productId) => {
      if (typeof productId === 'string' && mongoose.isValidObjectId(productId)) socket.join(`product:${productId}`);
    });
    socket.on('product:leave', (productId) => {
      if (typeof productId === 'string') socket.leave(`product:${productId}`);
    });
  });
  return io;
}

export function emitToProduct(productId, event, payload) {
  io?.to(`product:${productId}`).emit(event, payload);
}
