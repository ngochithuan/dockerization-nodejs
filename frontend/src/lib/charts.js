import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { formatPrice } from './format.js';

Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);
Chart.defaults.font.family = "'Be Vietnam Pro', system-ui, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#56627a';
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.boxWidth = 8;

// Categorical palette (colour-blind friendly ordering).
export const PALETTE = [
  '#2457f5',
  '#12805c',
  '#e2382f',
  '#f5a524',
  '#6b3fd4',
  '#0c6ba8',
  '#d6409f',
  '#7d879b',
  '#0f9fa8',
  '#a16207',
];
export const C = { revenue: '#2457f5', profit: '#12805c', orders: '#f5a524', products: '#6b3fd4' };

export const compactVnd = (v) => {
  const n = Number(v);
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1).replace('.0', '').replace('.', ',')} tỷ`;
  if (Math.abs(n) >= 1e6) return `${Math.round(n / 1e6)} tr`;
  return new Intl.NumberFormat('vi-VN').format(n);
};

export const moneyAxis = {
  beginAtZero: true,
  ticks: { callback: compactVnd },
  grid: { color: '#eef1f6' },
  border: { display: false },
};

export const countAxis = {
  beginAtZero: true,
  ticks: { precision: 0 },
  grid: { color: '#eef1f6' },
  border: { display: false },
};

export const moneyTooltip = {
  callbacks: {
    label: (ctx) => `${ctx.dataset.label}: ${formatPrice(ctx.parsed.y ?? ctx.parsed.x ?? ctx.parsed)}`,
  },
};
