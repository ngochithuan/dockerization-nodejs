import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Lock,
  TicketPercent,
  Wallet,
  XCircle,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { formatNumber, formatPrice } from '../lib/format.js';
import { useTitle } from '../lib/hooks.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import Button from '../components/ui/Button.jsx';
import Field from '../components/ui/Field.jsx';
import { PageLoader } from '../components/ui/States.jsx';
import OrderSummary from '../components/order/OrderSummary.jsx';
import AddressFields, { emptyAddress, validateAddress } from '../components/AddressFields.jsx';
import { formatAddress } from '../components/order/OrderView.jsx';

const STEPS = ['Giao hàng', 'Thanh toán', 'Xác nhận'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function luhn(num) {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i -= 1) {
    let d = Number(num[i]);
    if (dbl) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function validateCard(c) {
  const e = {};
  const num = c.number.replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(num) || !luhn(num)) e.number = 'Số thẻ không hợp lệ';
  if (c.holder.trim().length < 2) e.holder = 'Vui lòng nhập tên chủ thẻ';
  const m = c.expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!m) e.expiry = 'Định dạng MM/YY';
  else if (new Date(2000 + Number(m[2]), Number(m[1]), 1) <= new Date()) e.expiry = 'Thẻ đã hết hạn';
  if (!/^\d{3,4}$/.test(c.cvc)) e.cvc = 'CVC gồm 3–4 chữ số';
  return e;
}

function Stepper({ step }) {
  return (
    <ol className="stepper">
      {STEPS.map((label, i) => (
        <li key={label} className={i < step ? 'done' : i === step ? 'current' : ''}>
          <span className="stepper__dot">{i < step ? <Check size={14} /> : i + 1}</span>
          <span className="stepper__label">{label}</span>
        </li>
      ))}
    </ol>
  );
}

export default function CheckoutPage() {
  useTitle('Thanh toán');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const { cart, isLoading: cartLoading } = useCart();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  // Shipping
  const [guest, setGuest] = useState({ email: '', fullName: '' });
  const [addressId, setAddressId] = useState('new');
  const [address, setAddress] = useState(emptyAddress);
  const [saveAddress, setSaveAddress] = useState(true);
  // Payment
  const [method, setMethod] = useState('cod');
  const [card, setCard] = useState({ number: '', holder: '', expiry: '', cvc: '' });
  // Review
  const [codeInput, setCodeInput] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [points, setPoints] = useState(0);

  // Pre-fill the default address for logged-in customers.
  useEffect(() => {
    if (!user) return;
    const def = user.addresses.find((a) => a.isDefault) || user.addresses[0];
    if (def) {
      setAddressId(def._id);
      setAddress({ ...emptyAddress, ...def });
    } else {
      setAddress({ ...emptyAddress, recipientName: user.fullName });
    }
  }, [user]);

  const quoteBody = { discountCode: appliedCode || undefined, pointsToUse: usePoints ? points : 0 };
  const { data: quote, isFetching: quoting } = useQuery({
    queryKey: ['quote', quoteBody, cart?.itemCount, user?.id],
    queryFn: () => api.post('/checkout/quote', quoteBody),
    enabled: Boolean(cart?.items.length),
    placeholderData: (prev) => prev,
  });

  const placeMut = useMutation({
    mutationFn: (body) => api.post('/orders', body),
    onSuccess: (res) => {
      sessionStorage.setItem(`order:${res.order.orderNumber}`, JSON.stringify(res));
      navigate(`/order-success/${res.order.orderNumber}`, { replace: true, state: res });
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => {
      toast.error(err.message);
      if (err.code === 'DISCOUNT_INVALID') setAppliedCode('');
      if (['INSUFFICIENT_STOCK', 'ITEM_UNAVAILABLE', 'CART_EMPTY'].includes(err.code)) {
        qc.invalidateQueries({ queryKey: ['cart'] });
      }
    },
  });

  const savedAddresses = useMemo(() => user?.addresses || [], [user]);
  if (authLoading || cartLoading) return <PageLoader />;
  if (!cart?.items.length && !placeMut.isPending) return <Navigate to="/cart" replace />;

  const chooseSaved = (id) => {
    setAddressId(id);
    if (id === 'new') setAddress({ ...emptyAddress, recipientName: user?.fullName || '' });
    else setAddress({ ...emptyAddress, ...savedAddresses.find((a) => a._id === id) });
    setErrors({});
  };

  const validateShipping = () => {
    const e = validateAddress(address, { requirePhone: true });
    if (!user) {
      if (!EMAIL_RE.test(guest.email.trim())) e.email = 'Email không hợp lệ';
      if (guest.fullName.trim().length < 2) e.fullName = 'Vui lòng nhập họ tên';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 0 && !validateShipping()) return;
    if (step === 1 && method === 'card') {
      const e = validateCard(card);
      setErrors(e);
      if (Object.keys(e).length) return;
    }
    setErrors({});
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyCode = (e) => {
    e.preventDefault();
    const c = codeInput.trim().toUpperCase();
    if (!/^[A-Z0-9]{5}$/.test(c)) {
      setErrors({ code: 'Mã giảm giá gồm đúng 5 ký tự chữ hoặc số' });
      return;
    }
    setErrors({});
    setAppliedCode(c);
  };

  const place = () => {
    const shippingAddress = {
      recipientName: address.recipientName.trim() || guest.fullName.trim(),
      phone: address.phone.trim(),
      street: address.street.trim(),
      ward: address.ward.trim(),
      district: address.district.trim(),
      city: address.city.trim(),
    };
    placeMut.mutate({
      ...(user ? {} : { email: guest.email.trim(), fullName: guest.fullName.trim() }),
      shippingAddress,
      saveAddress: Boolean(user && addressId === 'new' && saveAddress),
      paymentMethod: method,
      ...(method === 'card' ? { card } : {}),
      discountCode: quote?.discount?.valid ? appliedCode : undefined,
      pointsToUse: usePoints ? quote?.summary.pointsUsed || 0 : 0,
    });
  };

  const summary = quote?.summary || cart.summary;
  const discount = quote?.discount;
  const setCardField = (k) => (e) => {
    let v = e.target.value;
    if (k === 'number')
      v = v
        .replace(/\D/g, '')
        .slice(0, 19)
        .replace(/(.{4})/g, '$1 ')
        .trim();
    if (k === 'expiry')
      v = v
        .replace(/\D/g, '')
        .slice(0, 4)
        .replace(/^(\d{2})(\d)/, '$1/$2');
    if (k === 'cvc') v = v.replace(/\D/g, '').slice(0, 4);
    if (k === 'holder') v = v.toUpperCase();
    setCard({ ...card, [k]: v });
  };

  return (
    <div className="container">
      <div className="checkout__top">
        <Link to="/cart" className="link-arrow">
          <ArrowLeft size={16} /> Quay lại giỏ hàng
        </Link>
        <h1 className="page-title">Thanh toán</h1>
        <Stepper step={step} />
      </div>

      <div className="checkout">
        <div className="checkout__main">
          {step === 0 && (
            <section className="card card__body stack">
              <h2 className="card__title">1. Thông tin giao hàng</h2>
              {!user && (
                <>
                  <div className="notice">
                    <span>
                      Bạn đang mua hàng không cần đăng nhập. Nếu email chưa có tài khoản, chúng tôi sẽ tự tạo
                      tài khoản và gửi liên kết đặt mật khẩu để bạn theo dõi đơn hàng sau này.{' '}
                      <Link to="/login" state={{ from: '/checkout' }}>
                        Đã có tài khoản? Đăng nhập
                      </Link>
                    </span>
                  </div>
                  <div className="form-grid">
                    <Field
                      label="Email"
                      type="email"
                      required
                      value={guest.email}
                      onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                      error={errors.email}
                      autoComplete="email"
                    />
                    <Field
                      label="Họ và tên"
                      required
                      value={guest.fullName}
                      onChange={(e) => {
                        setGuest({ ...guest, fullName: e.target.value });
                        setAddress((a) => ({ ...a, recipientName: e.target.value }));
                      }}
                      error={errors.fullName}
                      autoComplete="name"
                    />
                  </div>
                </>
              )}

              {user && savedAddresses.length > 0 && (
                <div className="addr-pick" role="radiogroup" aria-label="Chọn địa chỉ">
                  {savedAddresses.map((a) => (
                    <label key={a._id} className={`addr-option ${addressId === a._id ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="addr"
                        checked={addressId === a._id}
                        onChange={() => chooseSaved(a._id)}
                      />
                      <span>
                        <strong>
                          {a.recipientName} {a.phone && `· ${a.phone}`}
                        </strong>
                        {a.isDefault && <span className="badge badge--brand badge--plain">Mặc định</span>}
                        <span className="muted">{formatAddress(a)}</span>
                      </span>
                    </label>
                  ))}
                  <label className={`addr-option ${addressId === 'new' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="addr"
                      checked={addressId === 'new'}
                      onChange={() => chooseSaved('new')}
                    />
                    <span>
                      <strong>+ Giao đến địa chỉ khác</strong>
                    </span>
                  </label>
                </div>
              )}

              {(addressId === 'new' || !user) && (
                <>
                  <AddressFields
                    value={address}
                    onChange={setAddress}
                    errors={errors}
                    requirePhone
                    hideRecipient={!user}
                  />
                  {user && (
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                      />
                      Lưu địa chỉ này vào sổ địa chỉ
                    </label>
                  )}
                </>
              )}
              {user && addressId !== 'new' && !address.phone && (
                <Field
                  label="Số điện thoại nhận hàng"
                  required
                  type="tel"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  error={errors.phone}
                />
              )}
              {user && addressId !== 'new' && address.phone && errors.phone && (
                <span className="field__error">{errors.phone}</span>
              )}
            </section>
          )}

          {step === 1 && (
            <section className="card card__body stack">
              <h2 className="card__title">2. Phương thức thanh toán</h2>
              <div className="pay-options" role="radiogroup">
                <label className={`pay-option ${method === 'cod' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="pay"
                    checked={method === 'cod'}
                    onChange={() => setMethod('cod')}
                  />
                  <Wallet size={22} />
                  <span>
                    <strong>Thanh toán khi nhận hàng (COD)</strong>
                    <span className="muted">Trả tiền mặt cho nhân viên giao hàng</span>
                  </span>
                </label>
                <label className={`pay-option ${method === 'card' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="pay"
                    checked={method === 'card'}
                    onChange={() => setMethod('card')}
                  />
                  <CreditCard size={22} />
                  <span>
                    <strong>Thẻ tín dụng / ghi nợ (mô phỏng)</strong>
                    <span className="muted">Visa, Mastercard, JCB — thử với 4242 4242 4242 4242</span>
                  </span>
                </label>
              </div>
              {method === 'card' && (
                <div className="form-grid card-form">
                  <Field
                    className="span-2"
                    label="Số thẻ"
                    inputMode="numeric"
                    value={card.number}
                    onChange={setCardField('number')}
                    error={errors.number}
                    placeholder="4242 4242 4242 4242"
                    autoComplete="cc-number"
                  />
                  <Field
                    className="span-2"
                    label="Tên chủ thẻ"
                    value={card.holder}
                    onChange={setCardField('holder')}
                    error={errors.holder}
                    placeholder="NGUYEN VAN A"
                    autoComplete="cc-name"
                  />
                  <Field
                    label="Ngày hết hạn"
                    value={card.expiry}
                    onChange={setCardField('expiry')}
                    error={errors.expiry}
                    placeholder="MM/YY"
                    autoComplete="cc-exp"
                  />
                  <Field
                    label="CVC"
                    inputMode="numeric"
                    value={card.cvc}
                    onChange={setCardField('cvc')}
                    error={errors.cvc}
                    placeholder="123"
                    autoComplete="cc-csc"
                  />
                  <p className="muted small span-2 row">
                    <Lock size={14} /> Thanh toán mô phỏng — thông tin thẻ chỉ được kiểm tra định dạng và
                    không bao giờ được lưu.
                  </p>
                </div>
              )}
            </section>
          )}

          {step === 2 && (
            <section className="card card__body stack">
              <h2 className="card__title">3. Xác nhận đơn hàng</h2>
              <div className="review-grid">
                <div>
                  <h3 className="review-label">Giao đến</h3>
                  <p>
                    <strong>{address.recipientName || guest.fullName}</strong> · {address.phone}
                    <br />
                    {formatAddress(address)}
                  </p>
                  {!user && <p className="muted">Email: {guest.email}</p>}
                  <button type="button" className="link-btn" onClick={() => setStep(0)}>
                    Thay đổi
                  </button>
                </div>
                <div>
                  <h3 className="review-label">Thanh toán</h3>
                  <p>
                    {method === 'cod'
                      ? 'Thanh toán khi nhận hàng (COD)'
                      : `Thẻ •••• ${card.number.slice(-4)}`}
                  </p>
                  <button type="button" className="link-btn" onClick={() => setStep(1)}>
                    Thay đổi
                  </button>
                </div>
              </div>

              <ul className="oitems">
                {cart.items.map((i) => (
                  <li key={`${i.productId}-${i.variantId}`} className="oitem">
                    {i.image && <img src={i.image} alt="" width="64" height="64" />}
                    <div className="oitem__info">
                      <strong>{i.name}</strong>
                      <span className="muted">{i.variantName}</span>
                      <span className="muted tabular">
                        {formatPrice(i.price)} × {i.qty}
                      </span>
                    </div>
                    <span className="oitem__total tabular">{formatPrice(i.lineTotal)}</span>
                  </li>
                ))}
              </ul>

              <form className="promo" onSubmit={applyCode}>
                <label className="field__label" htmlFor="promo">
                  <TicketPercent size={16} /> Mã giảm giá
                </label>
                <div className="promo__row">
                  <input
                    id="promo"
                    className="input"
                    value={codeInput}
                    maxLength={5}
                    placeholder="VD: NEW10"
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  />
                  <Button type="submit" variant="dark" loading={quoting && Boolean(appliedCode)}>
                    Áp dụng
                  </Button>
                  {appliedCode && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setAppliedCode('');
                        setCodeInput('');
                      }}
                    >
                      Bỏ mã
                    </Button>
                  )}
                </div>
                {errors.code && <span className="field__error">{errors.code}</span>}
                {discount && appliedCode && (
                  <p className={`promo__result ${discount.valid ? 'ok' : 'bad'}`}>
                    {discount.valid ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    <span>
                      <b>{discount.code}</b>: {discount.message}
                      {discount.valid && ` → bạn tiết kiệm ${formatPrice(summary.discountAmount)}`}
                    </span>
                  </p>
                )}
              </form>

              {user && (
                <div className="points">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={usePoints}
                      onChange={(e) => setUsePoints(e.target.checked)}
                    />
                    Dùng điểm tích lũy (bạn có{' '}
                    <b>{formatNumber(quote?.pointsBalance ?? user.loyaltyPoints)}</b> điểm ={' '}
                    {formatPrice((quote?.pointsBalance ?? user.loyaltyPoints) * 1000)})
                  </label>
                  {usePoints && (
                    <div className="points__row">
                      <input
                        className="input"
                        type="number"
                        min="0"
                        max={quote?.summary.maxPoints ?? 0}
                        value={points}
                        onChange={(e) => setPoints(Math.max(0, Number(e.target.value) || 0))}
                        aria-label="Số điểm muốn dùng"
                      />
                      <Button size="sm" onClick={() => setPoints(quote?.summary.maxPoints ?? 0)}>
                        Dùng tối đa ({formatNumber(quote?.summary.maxPoints ?? 0)})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          <div className="checkout__nav">
            {step > 0 ? (
              <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => setStep(step - 1)}>
                Quay lại
              </Button>
            ) : (
              <span />
            )}
            {step < 2 ? (
              <Button variant="primary" size="lg" onClick={next}>
                Tiếp tục <ArrowRight size={18} />
              </Button>
            ) : (
              <Button variant="accent" size="lg" loading={placeMut.isPending} onClick={place}>
                Đặt hàng · {formatPrice(summary.total)}
              </Button>
            )}
          </div>
        </div>

        <aside className="card card__body checkout__summary">
          <h2 className="card__title">Đơn hàng ({cart.itemCount} sản phẩm)</h2>
          <OrderSummary s={summary} discountCode={discount?.valid ? discount.code : null} />
        </aside>
      </div>
    </div>
  );
}
