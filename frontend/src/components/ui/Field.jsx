import { useId } from 'react';

/** Labelled form control with inline error/hint. `as` = 'input' | 'select' | 'textarea'. */
export default function Field({
  label,
  error,
  hint,
  required,
  as = 'input',
  className = '',
  children,
  ...props
}) {
  const id = useId();
  const Control = as;
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      <Control
        id={id}
        className={as}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        required={required}
        {...props}
      >
        {children}
      </Control>
      {error ? (
        <span id={`${id}-err`} className="field__error">
          {error}
        </span>
      ) : (
        hint && (
          <span id={`${id}-hint`} className="field__hint">
            {hint}
          </span>
        )
      )}
    </div>
  );
}
