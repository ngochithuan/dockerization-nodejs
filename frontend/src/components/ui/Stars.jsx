import { Star } from 'lucide-react';

export default function Stars({ value = 0, size = 14, label = true }) {
  const rounded = Math.round(value);
  return (
    <span className="stars" aria-label={label ? `${value.toFixed(1)} trên 5 sao` : undefined}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= rounded ? '' : 'empty'}
          fill="currentColor"
          strokeWidth={0}
        />
      ))}
    </span>
  );
}
