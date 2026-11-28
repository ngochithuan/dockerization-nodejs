import Order from '../../models/Order.js';
import User from '../../models/User.js';
import Category from '../../models/Category.js';
import { POINT_VALUE } from '../../lib/pricing.js';
import { VN_TZ, vnDate, vnParts } from '../../lib/util.js';

const SOLD = { status: { $ne: 'cancelled' } };

// ---------- Simple dashboard ----------
export async function simpleDashboard() {
  const { y, m } = vnParts();
  const monthStart = vnDate(y, m, 1);
  const yearAgo = vnDate(y, m - 11, 1);

  const [totalUsers, newUsers, orderAgg, monthAgg, bestSellers, monthly, statusRows] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: monthStart } }),
    Order.aggregate([{ $match: SOLD }, { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$total' } } }]),
    Order.aggregate([
      { $match: { ...SOLD, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $match: SOLD },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.productName' },
          qty: { $sum: '$items.qty' },
          revenue: { $sum: { $multiply: ['$items.unitPrice', '$items.qty'] } },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate([
      { $match: { ...SOLD, createdAt: { $gte: yearAgo } } },
      {
        $group: {
          _id: { $dateTrunc: { date: '$createdAt', unit: 'month', timezone: VN_TZ } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);

  const months = [];
  for (let i = 0; i < 12; i += 1) {
    const start = vnDate(y, m - 11 + i, 1);
    const row = monthly.find((r) => r._id.getTime() === start.getTime());
    const p = vnParts(start);
    months.push({
      label: `${String(p.m + 1).padStart(2, '0')}/${p.y}`,
      revenue: row?.revenue || 0,
      orders: row?.orders || 0,
    });
  }

  return {
    totalUsers,
    newUsersThisMonth: newUsers,
    totalOrders: orderAgg[0]?.orders || 0,
    totalRevenue: orderAgg[0]?.revenue || 0,
    ordersThisMonth: monthAgg[0]?.orders || 0,
    revenueThisMonth: monthAgg[0]?.revenue || 0,
    bestSellers: bestSellers.map((b) => ({ productId: b._id, name: b.name, qty: b.qty, revenue: b.revenue })),
    revenueByMonth: months,
    ordersByStatus: Object.fromEntries(statusRows.map((r) => [r._id, r.n])),
  };
}

// ---------- Advanced dashboard ----------
const pad = (n) => String(n).padStart(2, '0');

/** Vietnam-local start of the bucket containing `date`. */
function truncate(date, unit) {
  const { y, m, d, dow } = vnParts(date);
  switch (unit) {
    case 'year':
      return vnDate(y, 0, 1);
    case 'quarter':
      return vnDate(y, Math.floor(m / 3) * 3, 1);
    case 'month':
      return vnDate(y, m, 1);
    case 'week':
      return vnDate(y, m, d - ((dow + 6) % 7)); // Monday
    default:
      return vnDate(y, m, d);
  }
}

function nextBucket(date, unit) {
  const { y, m, d } = vnParts(date);
  switch (unit) {
    case 'year':
      return vnDate(y + 1, 0, 1);
    case 'quarter':
      return vnDate(y, m + 3, 1);
    case 'month':
      return vnDate(y, m + 1, 1);
    case 'week':
      return vnDate(y, m, d + 7);
    default:
      return vnDate(y, m, d + 1);
  }
}

function label(date, unit) {
  const { y, m, d } = vnParts(date);
  switch (unit) {
    case 'year':
      return String(y);
    case 'quarter':
      return `Q${Math.floor(m / 3) + 1}/${y}`;
    case 'month':
      return `${pad(m + 1)}/${y}`;
    case 'week':
      return `Tuần ${pad(d)}/${pad(m + 1)}/${y}`;
    default:
      return `${pad(d)}/${pad(m + 1)}/${y}`;
  }
}

/** Resolves the requested period into a [from, to) range and bucket unit. */
export async function resolvePeriod({ period, from, to }) {
  const now = new Date();
  const { y, m } = vnParts(now);
  const end = nextBucket(truncate(now, 'day'), 'day');
  switch (period) {
    case 'quarter':
      return { unit: 'quarter', from: vnDate(y, Math.floor(m / 3) * 3 - 21, 1), to: end };
    case 'month':
      return { unit: 'month', from: vnDate(y, m - 11, 1), to: end };
    case 'week':
      return { unit: 'week', from: truncate(vnDate(y, m, vnParts(now).d - 7 * 11), 'week'), to: end };
    case 'custom': {
      const days = (to - from) / 86_400_000;
      const unit = days <= 31 ? 'day' : days <= 26 * 7 ? 'week' : days <= 3 * 366 ? 'month' : 'year';
      return { unit, from, to: nextBucket(to, 'day') };
    }
    default: {
      const first = await Order.findOne().sort({ createdAt: 1 }).select('createdAt').lean();
      const startYear = first ? vnParts(first.createdAt).y : y;
      return { unit: 'year', from: vnDate(startYear, 0, 1), to: end };
    }
  }
}

export async function advancedDashboard(query) {
  const { unit, from, to } = await resolvePeriod(query);
  const match = { ...SOLD, createdAt: { $gte: from, $lt: to } };
  const bucket = { $dateTrunc: { date: '$createdAt', unit, timezone: VN_TZ, startOfWeek: 'monday' } };

  const [result] = await Order.aggregate([
    { $match: match },
    {
      $facet: {
        orders: [
          {
            $group: {
              _id: bucket,
              orders: { $sum: 1 },
              revenue: { $sum: '$total' },
              discounts: { $sum: { $add: ['$discountAmount', { $multiply: ['$pointsUsed', POINT_VALUE] }] } },
            },
          },
        ],
        items: [
          { $unwind: '$items' },
          {
            $group: {
              _id: bucket,
              productsSold: { $sum: '$items.qty' },
              grossProfit: {
                $sum: { $multiply: [{ $subtract: ['$items.unitPrice', '$items.unitCost'] }, '$items.qty'] },
              },
            },
          },
        ],
        categories: [
          { $unwind: '$items' },
          {
            $group: {
              _id: { bucket, category: '$items.category' },
              qty: { $sum: '$items.qty' },
              revenue: { $sum: { $multiply: ['$items.unitPrice', '$items.qty'] } },
            },
          },
        ],
      },
    },
  ]);

  const cats = await Category.find().sort({ sortOrder: 1 }).lean();
  const catName = new Map(cats.map((c) => [String(c._id), c.name]));
  const key = (d) => new Date(d).getTime();
  const ordersBy = new Map(result.orders.map((r) => [key(r._id), r]));
  const itemsBy = new Map(result.items.map((r) => [key(r._id), r]));

  const buckets = [];
  for (let b = truncate(from, unit); b < to; b = nextBucket(b, unit)) {
    const o = ordersBy.get(key(b));
    const it = itemsBy.get(key(b));
    const byCategory = {};
    for (const c of result.categories) {
      if (key(c._id.bucket) === key(b)) byCategory[catName.get(String(c._id.category)) || 'Khác'] = c.qty;
    }
    buckets.push({
      key: b.toISOString(),
      label: label(b, unit),
      orders: o?.orders || 0,
      revenue: o?.revenue || 0,
      profit: (it?.grossProfit || 0) - (o?.discounts || 0),
      productsSold: it?.productsSold || 0,
      byCategory,
    });
    if (buckets.length > 400) break;
  }

  const categoryTotals = {};
  for (const c of result.categories) {
    const name = catName.get(String(c._id.category)) || 'Khác';
    categoryTotals[name] ??= { qty: 0, revenue: 0 };
    categoryTotals[name].qty += c.qty;
    categoryTotals[name].revenue += c.revenue;
  }

  const sum = (f) => buckets.reduce((s, b) => s + b[f], 0);
  return {
    unit,
    from: from.toISOString(),
    to: new Date(to.getTime() - 1).toISOString(),
    totals: { orders: sum('orders'), revenue: sum('revenue'), profit: sum('profit'), productsSold: sum('productsSold') },
    buckets,
    categories: cats.map((c) => c.name),
    categoryTotals: Object.entries(categoryTotals)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty),
  };
}
