import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api.js';
import { useTitle } from '../../lib/hooks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import AuthShell, { GoogleIcon } from './AuthShell.jsx';

const OAUTH_ERRORS = {
  banned: 'Tài khoản của bạn đã bị khóa.',
  google_disabled: 'Đăng nhập Google chưa được cấu hình.',
  google_state: 'Phiên đăng nhập Google không hợp lệ, vui lòng thử lại.',
  google_email: 'Tài khoản Google chưa xác minh email.',
};

export default function LoginPage() {
  useTitle('Đăng nhập');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { data: config } = useQuery({ queryKey: ['auth-config'], queryFn: () => api.get('/auth/config') });

  useEffect(() => {
    const err = params.get('error');
    if (err) toast.error(OAUTH_ERRORS[err] || 'Đăng nhập Google thất bại, vui lòng thử lại.');
  }, [params]);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : location.state?.from || '/'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim()) errs.email = 'Vui lòng nhập email';
    if (!form.password) errs.password = 'Vui lòng nhập mật khẩu';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const u = await login(form.email.trim(), form.password);
      toast.success(`Xin chào ${u.fullName}!`);
      navigate(u.role === 'admin' ? '/admin' : location.state?.from || '/', { replace: true });
    } catch (err) {
      setErrors({ ...err.fieldErrors(), form: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Đăng nhập" subtitle="Theo dõi đơn hàng, dùng điểm tích lũy và quản lý sổ địa chỉ.">
      {config?.googleEnabled && (
        <>
          <a href="/api/auth/google" className="btn btn--lg btn--block google-btn">
            <GoogleIcon /> Tiếp tục với Google
          </a>
          <div className="divider">hoặc</div>
        </>
      )}
      <form className="stack" onSubmit={submit} noValidate>
        {errors.form && <div className="alert alert--error">{errors.form}</div>}
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
        />
        <Field
          label="Mật khẩu"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
        />
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <Link to="/forgot-password" className="link">
            Quên mật khẩu?
          </Link>
        </div>
        <Button type="submit" variant="primary" size="lg" block loading={loading}>
          Đăng nhập
        </Button>
      </form>
      <p className="auth__alt">
        Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
      </p>
    </AuthShell>
  );
}
