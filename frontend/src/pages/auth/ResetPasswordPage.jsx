import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LinkIcon } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useTitle } from '../../lib/hooks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import { EmptyState, PageLoader } from '../../components/ui/States.jsx';
import AuthShell from './AuthShell.jsx';

export function passwordErrors(pw, confirm) {
  const e = {};
  if (pw.length < 8) e.password = 'Mật khẩu tối thiểu 8 ký tự';
  else if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) e.password = 'Mật khẩu phải có cả chữ cái và chữ số';
  if (confirm !== pw) e.confirm = 'Mật khẩu nhập lại không khớp';
  return e;
}

// Handles both "reset password" (forgot flow) and "set password" (new accounts) links.
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['reset-token', token],
    queryFn: () => api.get(`/auth/reset-password/${encodeURIComponent(token)}`),
    enabled: token.length >= 20,
    retry: false,
  });
  const isSetup = data?.valid && !data.hasPassword;
  useTitle(isSetup ? 'Đặt mật khẩu' : 'Đặt lại mật khẩu');

  if (token.length >= 20 && isLoading) return <PageLoader />;
  if (!data?.valid) {
    return (
      <div className="container">
        <EmptyState
          icon={LinkIcon}
          title="Liên kết không hợp lệ hoặc đã hết hạn"
          text="Liên kết chỉ dùng được một lần. Hãy yêu cầu liên kết mới."
          action={
            <Button to="/forgot-password" variant="primary">
              Gửi lại liên kết
            </Button>
          }
        />
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    const errs = passwordErrors(pw, confirm);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const { user } = await api.post('/auth/reset-password', { token, password: pw });
      setUser(user);
      toast.success(isSetup ? 'Đã đặt mật khẩu, chào mừng bạn!' : 'Đã đặt lại mật khẩu');
      navigate(user.role === 'admin' ? '/admin' : '/account', { replace: true });
    } catch (err) {
      setErrors({ ...err.fieldErrors(), form: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={isSetup ? 'Đặt mật khẩu cho tài khoản' : 'Đặt lại mật khẩu'}
      subtitle={`Tài khoản: ${data.email}`}
    >
      <form className="stack" onSubmit={submit} noValidate>
        {errors.form && <div className="alert alert--error">{errors.form}</div>}
        <Field
          label="Mật khẩu mới"
          type="password"
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          error={errors.password}
          hint="Tối thiểu 8 ký tự, gồm chữ cái và chữ số"
        />
        <Field
          label="Nhập lại mật khẩu"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <Button type="submit" variant="primary" size="lg" block loading={loading}>
          Lưu mật khẩu
        </Button>
      </form>
      <p className="auth__alt">
        <Link to="/login">Quay lại đăng nhập</Link>
      </p>
    </AuthShell>
  );
}
