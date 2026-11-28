import { Minus, Plus } from 'lucide-react';

export default function QuantityInput({ value, onChange, min = 1, max = 99, disabled, size }) {
  const clamp = (n) => Math.max(min, Math.min(max, n));
  return (
    <div className={`qty ${size === 'sm' ? 'qty--sm' : ''}`}>
      <button
        type="button"
        className="qty__btn"
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= min}
        aria-label="Giảm số lượng"
      >
        <Minus size={14} />
      </button>
      <input
        className="qty__input"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        aria-label="Số lượng"
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(clamp(n));
        }}
      />
      <button
        type="button"
        className="qty__btn"
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
        aria-label="Tăng số lượng"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
