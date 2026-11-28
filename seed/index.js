// One-shot, idempotent seeder (run by the `seed` service before the api replicas start).
// Seeds only when the database is empty; always (re)writes missing product images into the
// shared uploads volume.
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import User from '../services/api/src/models/User.js';
import Category from '../services/api/src/models/Category.js';
import Product from '../services/api/src/models/Product.js';
import Order from '../services/api/src/models/Order.js';
import Review from '../services/api/src/models/Review.js';
import Rating from '../services/api/src/models/Rating.js';
import DiscountCode from '../services/api/src/models/DiscountCode.js';
import Counter from '../services/api/src/models/Counter.js';
import Cart from '../services/api/src/models/Cart.js';
import { computeTotals } from '../services/api/src/lib/pricing.js';
import { slugify } from '../services/api/src/lib/util.js';

import { CATEGORIES, PRODUCTS, describe, variantsFor } from './catalog.js';
import { productImages } from './images.js';
import { COMMENTS, FIRST, GUEST_COMMENTS, LAST, MIDDLE, PLACES } from './data.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pcshop?replicaSet=rs0';
const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';
const IMG_DIR = path.join(UPLOADS_DIR, 'products', 'seed');

export const CREDENTIALS = {
  admin: { email: 'admin@circuit.local', password: 'Admin@123' },
  customer: { email: 'customer@circuit.local', password: 'Customer@123' },
};

// ---- deterministic PRNG so every fresh install gets the same data ----
let seed = 20261128;
function rand() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function address(recipientName, isDefault = false) {
  const p = pick(PLACES);
  return {
    recipientName,
    phone: `09${int(10_000_000, 99_999_999)}`,
    street: `${int(1, 299)} ${pick(p.streets)}`,
    ward: p.ward,
    district: p.district,
    city: p.city,
    isDefault,
  };
}

const plainEmail = (name, i) => `${slugify(name).replace(/-/g, '.')}${i}@circuit.local`;

async function writeImages(products) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  let written = 0;
  for (const { category, def, slug } of products) {
    const files = productImages(category, def);
    for (let i = 0; i < files.length; i += 1) {
      const file = path.join(IMG_DIR, `${slug}-${i + 1}.svg`);
      try {
        await fs.access(file);
      } catch {
        await fs.writeFile(file, files[i]);
        written += 1;
      }
    }
  }
  // The seeder runs as root; hand the shared volume to the api's unprivileged `node` user
  // (uid 1000) so admin image uploads can be written.
  for (const dir of [UPLOADS_DIR, path.join(UPLOADS_DIR, 'products'), IMG_DIR]) {
    await fs.chown(dir, 1000, 1000).catch(() => {});
  }
  return written;
}

function catalogueDefs() {
  const out = [];
  for (const c of CATEGORIES)
    for (const def of PRODUCTS[c.slug]) out.push({ category: c.slug, def, slug: slugify(def.name) });
  return out;
}

async function seedAll() {
  const now = Date.now();
  const start = now - 760 * DAY; // ~2 years + 1 month of history

  // ---------------- categories & products ----------------
  const cats = await Category.insertMany(CATEGORIES.map((c, i) => ({ ...c, sortOrder: i })));
  const catId = Object.fromEntries(cats.map((c) => [c.slug, c._id]));
  const defs = catalogueDefs();

  const productDocs = defs.map(({ category, def, slug }, i) => {
    const variants = variantsFor(category, def).map((vt, k) => {
      const stockRoll = rand();
      return {
        sku: `${slug.slice(0, 18).toUpperCase()}-${k + 1}`,
        name: vt.name,
        price: vt.price,
        costPrice: Math.round((vt.price * (0.76 + rand() * 0.12)) / 10_000) * 10_000,
        stock: stockRoll < 0.06 ? 0 : stockRoll < 0.16 ? int(1, 4) : int(8, 60),
      };
    });
    const prices = variants.map((x) => x.price);
    // Spread creation dates so "New products" is meaningful; the last ones are the newest.
    const createdAt = new Date(start + ((i * 37) % 100) * 7 * DAY + int(0, 5) * DAY);
    return {
      name: def.name,
      slug,
      brand: def.brand,
      category: catId[category],
      tags: def.tags,
      shortDescription: describe(category, def),
      specs: Object.entries(def.specs).map(([label, value]) => ({ label, value })),
      images: [1, 2, 3].map((n) => `/uploads/products/seed/${slug}-${n}.svg`),
      variants,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      isActive: true,
      createdAt,
      updatedAt: createdAt,
    };
  });
  const products = await Product.insertMany(productDocs);

  // ---------------- users ----------------
  const adminHash = await bcrypt.hash(CREDENTIALS.admin.password, 12);
  const customerHash = await bcrypt.hash(CREDENTIALS.customer.password, 12);
  const sharedHash = await bcrypt.hash('Password@123', 12);

  const users = [];
  users.push({
    email: CREDENTIALS.admin.email,
    fullName: 'Quản trị viên Circuit',
    passwordHash: adminHash,
    role: 'admin',
    createdAt: new Date(start - 10 * DAY),
  });
  users.push({
    email: CREDENTIALS.customer.email,
    fullName: 'Nguyễn Minh Khang',
    passwordHash: customerHash,
    addresses: [
      address('Nguyễn Minh Khang', true),
      address('Nguyễn Minh Khang (công ty)'),
      address('Trần Thu Hà'),
    ],
    createdAt: new Date(start),
  });
  users.push({
    email: 'google.user@circuit.local',
    fullName: 'Lê Hoàng Nam',
    googleId: 'seed-google-0001',
    passwordHash: null,
    addresses: [address('Lê Hoàng Nam', true)],
    createdAt: new Date(start + 200 * DAY),
  });
  const usedNames = new Set();
  for (let i = 0; users.length < 33; i += 1) {
    const name = `${pick(LAST)} ${pick(MIDDLE)} ${pick(FIRST)}`;
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    const isGuestCreated = i % 6 === 5; // auto-created by guest checkout, no password yet
    const recent = i % 9 === 0; // some sign-ups this month
    const createdAt = recent
      ? new Date(now - int(1, 20) * DAY)
      : new Date(start + rand() * (now - start - 30 * DAY));
    const addrs = [address(name, true)];
    if (chance(0.35)) addrs.push(address(name));
    users.push({
      email: plainEmail(name, i),
      fullName: name,
      passwordHash: isGuestCreated ? null : sharedHash,
      addresses: addrs,
      isBanned: i === 7,
      createdAt,
    });
  }
  const userDocs = await User.insertMany(users.map((u) => ({ ...u, updatedAt: u.createdAt })));
  const customers = userDocs.filter((u) => u.role === 'customer');

  // ---------------- discount codes ----------------
  const codes = [
    { code: 'NEW10', percent: 10, usageLimit: 10, target: 0 }, // unused
    { code: 'XMAS6', percent: 6, usageLimit: 3, target: 0 }, // unused
    { code: 'TECH5', percent: 5, usageLimit: 10, target: 3 }, // partially used
    { code: 'BUILD', percent: 12, usageLimit: 10, target: 4 }, // partially used
    { code: 'PCVIP', percent: 15, usageLimit: 5, target: 5 }, // fully used
    { code: 'SUMMR', percent: 20, usageLimit: 2, target: 2 }, // fully used
  ];

  // ---------------- orders ----------------
  const ORDER_COUNT = 620;
  const orders = [];
  const daySeq = new Map();
  const soldByProduct = new Map();
  const pointsByUser = new Map();
  const codeQueue = codes.flatMap((c) => Array(c.target).fill(c));

  // weights: growth over time + Nov/Dec peak
  const times = Array.from({ length: ORDER_COUNT }, () => {
    for (;;) {
      const t = start + rand() * (now - start - HOUR);
      const growth = 0.45 + 0.55 * ((t - start) / (now - start));
      const month = new Date(t).getUTCMonth();
      const season = month === 10 || month === 11 ? 1.35 : month === 0 ? 1.15 : 1;
      if (rand() < (growth * season) / 1.35) return t;
    }
  }).sort((a, b) => a - b);
  // guarantee a handful of orders today/yesterday for the admin filters
  for (let k = 0; k < 6; k += 1) times.push(now - int(10, 60 * 30) * 60_000);
  times.sort((a, b) => a - b);

  const vnDay = (t) => {
    const d = new Date(t + 7 * HOUR);
    return `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  };

  const demoCustomer = customers.find((u) => u.email === CREDENTIALS.customer.email);
  for (const [idx, t] of times.entries()) {
    const user = idx % 14 === 0 ? demoCustomer : pick(customers);
    if (user.createdAt.getTime() > t) user.createdAt = new Date(t - DAY);
    const lineCount = chance(0.6) ? 1 : chance(0.7) ? 2 : 3;
    const items = [];
    for (let k = 0; k < lineCount; k += 1) {
      const p = pick(products);
      if (items.some((i) => String(i.product) === String(p._id))) continue;
      const vr = pick(p.variants);
      items.push({
        product: p._id,
        variant: vr._id,
        productName: p.name,
        variantName: vr.name,
        category: p.category,
        image: p.images[0],
        unitPrice: vr.price,
        unitCost: vr.costPrice,
        qty: chance(0.85) ? 1 : 2,
      });
    }
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    const age = now - t;

    let status;
    if (age > 14 * DAY) status = chance(0.92) ? 'delivered' : 'cancelled';
    else if (age > 5 * DAY) status = pick(['delivered', 'delivered', 'shipping', 'cancelled']);
    else if (age > 2 * DAY) status = pick(['confirmed', 'shipping', 'shipping', 'delivered']);
    else status = pick(['pending', 'pending', 'confirmed']);

    const discount = status !== 'cancelled' && codeQueue.length && chance(0.05) ? codeQueue.shift() : null;
    const totals = computeTotals(subtotal, { discountPercent: discount?.percent || 0 });

    const history = [{ status: 'pending', at: new Date(t), note: 'Đơn hàng đã được tạo' }];
    let cursor = t;
    const step = (s, minH, maxH, note) => {
      cursor = Math.min(cursor + int(minH, maxH) * HOUR, now - 60_000);
      history.push({ status: s, at: new Date(cursor), note });
    };
    if (status === 'cancelled') {
      if (chance(0.5)) step('confirmed', 1, 10);
      step(
        'cancelled',
        2,
        30,
        pick(['Khách hàng yêu cầu hủy', 'Không liên lạc được với khách hàng', 'Khách đổi ý']),
      );
    } else {
      if (['confirmed', 'shipping', 'delivered'].includes(status)) step('confirmed', 1, 12);
      if (['shipping', 'delivered'].includes(status))
        step('shipping', 12, 30, 'Đã bàn giao cho đơn vị vận chuyển');
      if (status === 'delivered') step('delivered', 24, 72, 'Giao hàng thành công');
    }

    const key = vnDay(t);
    const seq = (daySeq.get(key) || 0) + 1;
    daySeq.set(key, seq);
    const paymentMethod = chance(0.55) ? 'cod' : 'card';
    const addr = user.addresses.find((a) => a.isDefault) || user.addresses[0] || address(user.fullName);

    orders.push({
      orderNumber: `PC${key}${String(seq).padStart(4, '0')}`,
      user: user._id,
      email: user.email,
      customerName: user.fullName,
      items,
      shippingAddress: {
        recipientName: addr.recipientName,
        phone: addr.phone || `09${int(10_000_000, 99_999_999)}`,
        street: addr.street,
        ward: addr.ward,
        district: addr.district,
        city: addr.city,
      },
      subtotal: totals.subtotal,
      tax: totals.tax,
      shippingFee: totals.shippingFee,
      discountCode: discount?.code || null,
      discountPercent: discount?.percent || 0,
      discountAmount: totals.discountAmount,
      pointsUsed: 0,
      pointsEarned: totals.pointsEarned,
      total: totals.total,
      paymentMethod,
      paymentStatus:
        status === 'cancelled'
          ? paymentMethod === 'card'
            ? 'refunded'
            : 'unpaid'
          : paymentMethod === 'card' || status === 'delivered'
            ? 'paid'
            : 'unpaid',
      status,
      statusHistory: history,
      createdAt: new Date(t),
      updatedAt: new Date(cursor),
    });

    if (status !== 'cancelled') {
      for (const i of items)
        soldByProduct.set(String(i.product), (soldByProduct.get(String(i.product)) || 0) + i.qty);
      pointsByUser.set(String(user._id), (pointsByUser.get(String(user._id)) || 0) + totals.pointsEarned);
    }
  }
  // Codes that did not get attached randomly are attached to the newest delivered orders.
  for (const c of codeQueue) {
    const o = orders.find(
      (x) => x.status === 'delivered' && !x.discountCode && x.createdAt > new Date(now - 200 * DAY),
    );
    const totals = computeTotals(o.subtotal, { discountPercent: c.percent });
    pointsByUser.set(
      String(o.user),
      (pointsByUser.get(String(o.user)) || 0) - o.pointsEarned + totals.pointsEarned,
    );
    Object.assign(o, {
      discountCode: c.code,
      discountPercent: c.percent,
      discountAmount: totals.discountAmount,
      tax: totals.tax,
      shippingFee: totals.shippingFee,
      total: totals.total,
      pointsEarned: totals.pointsEarned,
    });
  }
  await Order.insertMany(orders);
  await DiscountCode.insertMany(
    codes.map((c, i) => ({
      code: c.code,
      percent: c.percent,
      usageLimit: c.usageLimit,
      usedCount: orders.filter((o) => o.discountCode === c.code).length,
      createdAt: new Date(start + (i + 1) * 60 * DAY),
    })),
  );
  await Counter.insertMany([...daySeq].map(([day, seqN]) => ({ _id: `order-${day}`, seq: seqN })));

  // ---------------- users: points + first-seen dates ----------------
  await User.bulkWrite(
    customers.map((u) => ({
      updateOne: {
        filter: { _id: u._id },
        update: {
          $set: {
            // Customers have spent most historic points; keep a realistic remaining balance.
            loyaltyPoints:
              u === demoCustomer ? 1_500 : Math.min(pointsByUser.get(String(u._id)) || 0, int(0, 2_500)),
            createdAt: u.createdAt,
          },
        },
        timestamps: false,
      },
    })),
  );

  // ---------------- ratings & reviews ----------------
  const ratingDocs = [];
  const reviewDocs = [];
  const ratedProducts = products.filter((_, i) => i % 10 !== 9); // most products have reviews
  for (const p of ratedProducts) {
    const raters = [...customers].sort(() => rand() - 0.5).slice(0, int(2, 9));
    for (const u of raters) {
      const value = pick([5, 5, 5, 4, 4, 4, 3, 5, 4, 2]);
      const at = new Date(Math.max(p.createdAt.getTime(), now - int(1, 500) * DAY));
      ratingDocs.push({ product: p._id, user: u._id, value, createdAt: at, updatedAt: at });
      if (chance(0.7)) {
        reviewDocs.push({
          product: p._id,
          user: u._id,
          authorName: u.fullName,
          comment: pick(COMMENTS[value] || COMMENTS[3]),
          rating: value,
          createdAt: at,
          updatedAt: at,
        });
      }
    }
    if (chance(0.5)) {
      const [guestName, comment] = pick(GUEST_COMMENTS);
      const at = new Date(now - int(1, 200) * DAY);
      reviewDocs.push({
        product: p._id,
        user: null,
        guestName,
        authorName: guestName,
        comment,
        rating: null,
        createdAt: at,
        updatedAt: at,
      });
    }
  }
  await Rating.insertMany(ratingDocs);
  await Review.insertMany(reviewDocs);

  // ---------------- denormalised product stats ----------------
  const ratingAgg = new Map();
  for (const r of ratingDocs) {
    const k = String(r.product);
    const cur = ratingAgg.get(k) || { sum: 0, n: 0 };
    cur.sum += r.value;
    cur.n += 1;
    ratingAgg.set(k, cur);
  }
  await Product.bulkWrite(
    products.map((p) => {
      const r = ratingAgg.get(String(p._id));
      return {
        updateOne: {
          filter: { _id: p._id },
          update: {
            $set: {
              soldCount: soldByProduct.get(String(p._id)) || 0,
              avgRating: r ? Math.round((r.sum / r.n) * 10) / 10 : 0,
              ratingCount: r?.n || 0,
            },
          },
          timestamps: false,
        },
      };
    }),
  );

  return {
    products: products.length,
    users: userDocs.length,
    orders: orders.length,
    reviews: reviewDocs.length,
    ratings: ratingDocs.length,
  };
}

async function main() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 30000 });
  for (const m of [User, Category, Product, Order, Review, Rating, DiscountCode, Counter, Cart])
    await m.syncIndexes();

  const alreadySeeded = await User.exists({ role: 'admin' });
  if (alreadySeeded) {
    console.log('[seed] database already seeded — skipping data');
  } else {
    const stats = await seedAll();
    console.log('[seed] inserted', stats);
  }

  const written = await writeImages(catalogueDefs());
  console.log(`[seed] product images ready (${written} written)`);

  console.log('\n================ DEMO ACCOUNTS ================');
  console.log(`Admin    : ${CREDENTIALS.admin.email} / ${CREDENTIALS.admin.password}`);
  console.log(`Customer : ${CREDENTIALS.customer.email} / ${CREDENTIALS.customer.password}`);
  console.log('Other seeded customers use password: Password@123');
  console.log('Discount codes available: NEW10, XMAS6, TECH5, BUILD (PCVIP, SUMMR are used up)');
  console.log('===============================================\n');
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('[seed] failed', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
