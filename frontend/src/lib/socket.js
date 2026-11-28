import { io } from 'socket.io-client';

// Single shared connection. Websocket-only transport → works behind the round-robin load
// balancer without sticky sessions (events fan out across replicas via the Redis adapter).
let socket;

export function getSocket() {
  socket ??= io({ path: '/socket.io', transports: ['websocket'], reconnectionDelayMax: 5000 });
  return socket;
}
