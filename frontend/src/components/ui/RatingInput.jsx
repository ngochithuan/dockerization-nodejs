import { useState } from 'react';
import { Star } from 'lucide-react';

const LABELS = ['', 'Rất tệ', 'Chưa tốt', 'Bình thường', 'Tốt', 'Tuyệt vời'];

export default function RatingInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="rating-input" role="radiogroup" aria-label="Chọn số sao" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} sao`}
          className={n <= shown ? 'on' : ''}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
        >
          <Star size={26} fill="currentColor" strokeWidth={0} />
        </button>
      ))}
      <span className="rating-input__label">{shown ? LABELS[shown] : 'Chọn số sao'}</span>
    </div>
  );
}
