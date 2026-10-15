import { hueFor } from './utils'

export type VesselKind = 'phin' | 'tall' | 'dome' | 'mug' | 'jar'
export type Topping = 'ice' | 'pearls' | 'cream' | 'none'

export interface DrinkStyle {
  color: string
  vessel: VesselKind
  topping: Topping
}

// Mỗi danh mục có màu đồ uống riêng và kiểu ly riêng; màu này dùng chung cho ly minh họa và thanh đo
const STYLES: Record<string, DrinkStyle> = {
  'cà phê': { color: '#5a3422', vessel: 'phin', topping: 'ice' },
  trà: { color: '#c98a2b', vessel: 'tall', topping: 'ice' },
  'trà sữa': { color: '#b88a62', vessel: 'dome', topping: 'pearls' },
  'sinh tố': { color: '#e3a83b', vessel: 'tall', topping: 'none' },
  'nước ép': { color: '#ec7a2c', vessel: 'tall', topping: 'ice' },
  'nước giải khát': { color: '#76a24a', vessel: 'tall', topping: 'ice' },
  'sữa chua': { color: '#cf6a93', vessel: 'jar', topping: 'none' },
  'đá xay': { color: '#8a5d45', vessel: 'dome', topping: 'cream' },
  'đồ uống nóng': { color: '#6b3a26', vessel: 'mug', topping: 'none' },
}

export function drinkStyle(category: string): DrinkStyle {
  const key = category.normalize('NFC').trim().toLowerCase()
  return (
    STYLES[key] ?? {
      color: `hsl(${hueFor(key || '?')} 42% 48%)`,
      vessel: 'tall',
      topping: 'ice',
    }
  )
}
