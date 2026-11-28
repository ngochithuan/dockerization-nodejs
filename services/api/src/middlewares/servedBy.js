import os from 'node:os';

const instance = os.hostname();

// Tags every response with the container that produced it — evidence of load balancing.
export default function servedBy(_req, res, next) {
  res.setHeader('X-Served-By', instance);
  next();
}

export { instance };
