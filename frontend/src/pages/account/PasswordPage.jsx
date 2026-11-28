import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api.js';
import { useTitle } from '../../lib/hooks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import { passwordErrors } from '../auth/ResetPasswordPage.jsx';

export default function PasswordPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isSet = user.hasPassword;
  useTitle(isSet ? 'Đổi mật khẩu' : 'Đặt mật khẩu');
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const { password, confirm } = passwordErrors(form.next, form.confirm);
    const errs = { ...(password && { next: password }), ...(confirm && { confirm }) };
    if (isSet && !form.current) errs.current = 'Vui lòng nhập mật khẩu hiện tại';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: isSet ? form.current : undefined,
        newPassword: form.next,
      });
      toast.success(isSet ? 'Đã đổi mật khẩu' : 'Đã đặt mật khẩu');
      setForm({ current: '', next: '', confirm: '' });
      qc.invalidateQueries({ queryKey: ['me'] });
    } catch (err) {
      const fe = err.fieldErrors();
      setErrors({ current: fe.currentPassword, next: fe.newPassword });
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack">
      <h1 className="page-title">{isSet ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}</h1>
      {!isSet && (
        <div className="notice">
          Tài khoản của bạn chưa có mật khẩu (tạo khi mua hàng không đăng nhập hoặc đăng nhập bằng Google).
          Đặt mật khẩu để có thể đăng nhập bằng email.
        </div>
      )}
      <form className="card card__body stack narrow" onSubmit={submit} noValidate>
        {isSet && (
          <Field
            label="Mật khẩu hiện tại"
            type="password"
            autoComplete="current-password"
            value={form.current}
            onChange={set('current')}
            error={errors.current}
          />
        )}
        <Field
          label="Mật khẩu mới"
          type="password"
          autoComplete="new-password"
          value={form.next}
          onChange={set('next')}
          error={errors.next}
          hint="Tối thiểu 8 ký tự, gồm chữ cái và chữ số"
        />
        <Field
          label="Nhập lại mật khẩu mới"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
        />
        <div>
          <Button type="submit" variant="primary" loading={saving}>
            {isSet ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}
          </Button>
        </div>
      </form>
    </div>
  );
}
