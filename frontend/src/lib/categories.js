import {
  CircuitBoard,
  Cpu,
  Fan,
  HardDrive,
  Laptop,
  MemoryStick,
  Monitor,
  PcCase,
  Plug,
  Server,
} from 'lucide-react';

// The 10 product categories this store sells (computers & components only).
// Slugs match the seeded Category documents.
export const CATEGORIES = [
  { slug: 'laptop', name: 'Laptop', icon: Laptop },
  { slug: 'desktop-pc', name: 'PC để bàn', icon: Server },
  { slug: 'monitor', name: 'Màn hình', icon: Monitor },
  { slug: 'cpu', name: 'CPU', icon: Cpu },
  { slug: 'gpu', name: 'Card đồ họa', icon: Fan },
  { slug: 'ram', name: 'RAM', icon: MemoryStick },
  { slug: 'storage', name: 'Ổ cứng SSD/HDD', icon: HardDrive },
  { slug: 'mainboard', name: 'Mainboard', icon: CircuitBoard },
  { slug: 'psu', name: 'Nguồn PSU', icon: Plug },
  { slug: 'pc-case', name: 'Vỏ case', icon: PcCase },
];

export function categoryIcon(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.icon || CircuitBoard;
}
