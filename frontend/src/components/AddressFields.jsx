import Field from './ui/Field.jsx';

export const emptyAddress = { recipientName: '', phone: '', street: '', ward: '', district: '', city: '' };

const PHONE_RE = /^(0|\+84)\d{9,10}$/;

/** Client-side validation mirroring the server's zod schema. */
export function validateAddress(a, { requirePhone = false, requireRecipient = true } = {}) {
  const e = {};
  if (requireRecipient && a.recipientName.trim().length < 1) e.recipientName = 'Vui lòng nhập tên người nhận';
  if (requirePhone && !a.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại';
  else if (a.phone.trim() && !PHONE_RE.test(a.phone.trim())) e.phone = 'Số điện thoại không hợp lệ';
  if (!a.street.trim()) e.street = 'Vui lòng nhập số nhà, tên đường';
  if (!a.district.trim()) e.district = 'Vui lòng nhập quận/huyện';
  if (!a.city.trim()) e.city = 'Vui lòng nhập tỉnh/thành phố';
  return e;
}

export default function AddressFields({
  value,
  onChange,
  errors = {},
  prefix = '',
  requirePhone,
  hideRecipient,
}) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  const err = (k) => errors[`${prefix}${k}`] || errors[k];
  return (
    <div className="form-grid">
      {!hideRecipient && (
        <Field
          label="Tên người nhận"
          required
          value={value.recipientName}
          onChange={set('recipientName')}
          error={err('recipientName')}
          autoComplete="name"
        />
      )}
      <Field
        label="Số điện thoại"
        required={requirePhone}
        type="tel"
        value={value.phone}
        onChange={set('phone')}
        error={err('phone')}
        placeholder="09xxxxxxxx"
        autoComplete="tel"
      />
      <Field
        className="span-2"
        label="Số nhà, tên đường"
        required
        value={value.street}
        onChange={set('street')}
        error={err('street')}
        autoComplete="address-line1"
      />
      <Field label="Phường/Xã" value={value.ward} onChange={set('ward')} error={err('ward')} />
      <Field
        label="Quận/Huyện"
        required
        value={value.district}
        onChange={set('district')}
        error={err('district')}
      />
      <Field
        label="Tỉnh/Thành phố"
        required
        value={value.city}
        onChange={set('city')}
        error={err('city')}
        autoComplete="address-level1"
      />
    </div>
  );
}
