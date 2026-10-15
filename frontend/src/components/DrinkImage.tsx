import { useState } from 'react'
import { drinkStyle } from '../drinkStyle'
import { DEFAULT_IMAGE_URL, type Size } from '../types'
import Vessel from './Vessel'

interface DrinkImageProps {
  src: string
  name: string
  category: string
  size: Size
  className?: string
}

// Ảnh mặc định của backend chỉ là ô xám 100x100, nên vẽ ly minh họa theo danh mục thay thế.
// Ảnh thật (URL tùy chỉnh) vẫn được ưu tiên, lỗi tải thì quay về ly minh họa.
export default function DrinkImage({ src, name, category, size, className = '' }: DrinkImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const useVessel = !src || src === DEFAULT_IMAGE_URL || failedSrc === src

  if (useVessel) {
    const style = drinkStyle(category)
    return (
      <Vessel
        className={`drink-img drink-img--vessel ${className}`}
        kind={style.vessel}
        topping={style.topping}
        color={style.color}
        size={size}
      />
    )
  }

  return (
    <img
      className={`drink-img drink-img--photo ${className}`}
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  )
}
