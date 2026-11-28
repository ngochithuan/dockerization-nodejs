import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useTitle } from '../../lib/hooks.js';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import AuthShell from './AuthShell.jsx';

export default function ForgotPasswordPage() {
  useTitle('Quên mật khẩu');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Email không hợp lệ');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Quên mật khẩu"
      subtitle="Nhập email tài khoản, chúng tôi sẽ gửi liên kết đặt lại mật khẩu (hiệu lực 30 phút)."
    >
      {sent ? (
        <div className="auth__done">
          <MailCheck size={48} />
          <p>{sent}</p>
          <Button to="/login" variant="primary">
            Về trang đăng nhập
          </Button>
        </div>
      ) : (
        <form className="stack" onSubmit={submit} noValidate>
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <Button type="submit" variant="primary" size="lg" block loading={loading}>
            Gửi liên kết
          </Button>
        </form>
      )}
      <p className="auth__alt">
        Nhớ mật khẩu? <Link to="/login">Đăng nhập</Link>
      </p>
    </AuthShell>
  );
}
