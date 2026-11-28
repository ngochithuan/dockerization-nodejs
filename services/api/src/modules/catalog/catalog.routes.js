import { Router } from 'express';
import { z } from 'zod';
import validate from '../../middlewares/validate.js';
import { pageQuery, trimmedSearch } from '../../lib/schemas.js';
import * as catalog from './catalog.service.js';

const router = Router();

const toArray = (v) => (v === undefined ? [] : Array.isArray(v) ? v : String(v).split(','));

const listQuery = z.object({
  ...pageQuery,
  q: trimmedSearch,
  category: z.string().trim().max(60).optional(),
  tag: z.string().trim().max(40).optional(),
  brand: z.preprocess(toArray, z.array(z.string().trim().min(1).max(60)).max(30)).optional(),
  minPrice: z.coerce.number().min(0).max(1e10).optional(),
  maxPrice: z.coerce.number().min(0).max(1e10).optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  sort: z.enum(Object.keys(catalog.SORTS)).optional(),
});

router.get('/categories', async (_req, res) => {
  res.json({ items: await catalog.listCategories() });
});

router.get('/home', async (_req, res) => {
  res.json(await catalog.homeSections());
});

router.get('/products', validate({ query: listQuery }), async (req, res) => {
  res.json(await catalog.listProducts(req.valid.query));
});

router.get(
  '/products/:slug',
  validate({ params: z.object({ slug: z.string().max(120) }) }),
  async (req, res) => {
    res.json(await catalog.getProductBySlug(req.valid.params.slug));
  },
);

export default router;
