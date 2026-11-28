import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useTitle } from '../../lib/hooks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import AddressFields, { emptyAddress, validateAddress } from '../../components/AddressFields.jsx';
import AuthShell from './AuthShell.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Registration collects ONLY e-mail, full name and a shipping address.
// The password is chosen afterwards through the link sent by e-mail.
export default function RegisterPage() {
  useTitle('Đăng ký');
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState(emptyAddress);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  if (user) return <Navigate to="/account" replace />;

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateAddress(address, { requireRecipient: false });
    if (!EMAIL_RE.test(email.trim())) errs.email = 'Email không hợp lệ';
    if (fullName.trim().length < 2) errs.fullName = 'Họ tên tối thiểu 2 ký tự';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        email: email.trim(),
        fullName: fullName.trim(),
        address: { ...address, recipientName: fullName.trim() },
      });
      setDone(res.message);
    } catch (err) {
      const fe = err.fieldErrors();
      const mapped = Object.fromEntries(Object.entries(fe).map(([k, v]) => [k.replace('address.', ''), v]));
      setErrors({
        ...mapped,
        ...(err.code === 'EMAIL_TAKEN' ? { email: err.message } : { form: err.message }),
      });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell title="Kiểm tra email của bạn">
        <div className="auth__done">
          <MailCheck size={48} />
          <p>{done}</p>
          <p className="muted">
            Chúng tôi đã gửi liên kết đặt mật khẩu tới <b>{email}</b>. Liên kết có hiệu lực trong 7 ngày.
          </p>
          <Button to="/login" variant="primary">
            Về trang đăng nhập
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Chỉ cần email, họ tên và địa chỉ giao hàng. Mật khẩu sẽ được đặt qua email."
    >
      <form className="stack" onSubmit={submit} noValidate>
        {errors.form && <div className="alert alert--error">{errors.form}</div>}
        <Field
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Field
          label="Họ và tên"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
        />
        <fieldset className="fieldset">
          <legend>Địa chỉ giao hàng</legend>
          <AddressFields value={address} onChange={setAddress} errors={errors} hideRecipient />
        </fieldset>
        <Button type="submit" variant="primary" size="lg" block loading={loading}>
          Đăng ký
        </Button>
      </form>
      <p className="auth__alt">
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </p>
    </AuthShell>
  );
}
