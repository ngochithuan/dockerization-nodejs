// Khớp với backend/src/models/Drink.js
export const SIZES = ['S', 'M', 'L'] as const
export type Size = (typeof SIZES)[number]

export const STATUSES = ['Còn', 'Không khả dụng'] as const
export type Status = (typeof STATUSES)[number]

export const DEFAULT_IMAGE_URL = 'https://dummyimage.com/100x100/8f8f8f/000000.jpg'

export interface Drink {
  _id: string
  name: string
  category: string
  description: string
  price: number
  size: Size
  image_url: string
  status: Status
  created_at: string
  updated_at: string | null
}

// Các field backend nhận khi tạo / cập nhật (xem FIELDS trong drinkController)
export type DrinkInput = Pick<
  Drink,
  'name' | 'category' | 'description' | 'price' | 'size' | 'image_url' | 'status'
>
