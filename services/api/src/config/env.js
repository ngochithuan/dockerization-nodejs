// Centralised runtime configuration. Every value comes from the environment
// (set in docker-compose.yml) with safe local-development defaults.
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/pcshop?replicaSet=rs0',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  rabbitUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  searchServiceUrl: process.env.SEARCH_SERVICE_URL || 'http://localhost:4000',
  baseUrl: process.env.BASE_URL || 'http://localhost:8080',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadsDir: process.env.UPLOADS_DIR || './uploads',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8080/api/auth/google/callback',
  },
};

export const isProd = env.nodeEnv === 'production';
export const googleEnabled = Boolean(env.google.clientId && env.google.clientSecret);
export default env;
