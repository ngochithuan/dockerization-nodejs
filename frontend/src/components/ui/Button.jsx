import { Link } from 'react-router-dom';

export default function Button({
  variant = 'default',
  size,
  block,
  icon,
  loading,
  to,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}) {
  const cls = [
    'btn',
    variant !== 'default' && `btn--${variant}`,
    size && `btn--${size}`,
    block && 'btn--block',
    icon && !children && 'btn--icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading ? <span className="spinner" aria-hidden="true" /> : icon}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
}
