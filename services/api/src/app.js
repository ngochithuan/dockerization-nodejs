import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import servedBy from './middlewares/servedBy.js';
import sanitize from './middlewares/sanitize.js';
import { loadUser } from './middlewares/auth.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import healthRoutes from './modules/health/health.routes.js';
import catalogRoutes from './modules/catalog/catalog.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import googleRoutes from './modules/auth/google.routes.js';
import accountRoutes from './modules/account/account.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import orderRoutes from './modules/orders/orders.routes.js';
import reviewRoutes from './modules/reviews/reviews.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

// Builds the Express app without opening any connection, so tests can mount it directly.
export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind the nginx load balancer
  app.set('query parser', 'extended');

  app.use(servedBy);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  app.use(sanitize);

  app.use('/api/health', healthRoutes);

  const v1 = express.Router();
  v1.use('/health', healthRoutes);
  v1.use(loadUser);
  v1.use(catalogRoutes);
  v1.use('/auth', authRoutes);
  v1.use('/account', accountRoutes);
  v1.use('/cart', cartRoutes);
  v1.use('/products/:productId/reviews', reviewRoutes);
  v1.use(orderRoutes);
  v1.use('/admin', adminRoutes);
  app.use('/api/v1', v1);

  // OAuth redirect URI registered with Google: http://localhost:8080/api/auth/google/callback
  app.use('/api/auth/google', loadUser, googleRoutes);

  app.use('/api', notFound);
  app.use(errorHandler);
  return app;
}
