import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useTitle } from '../../lib/hooks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { EmptyState } from '../../components/ui/States.jsx';
import AddressFields, { emptyAddress, validateAddress } from '../../components/AddressFields.jsx';
import { formatAddress } from '../../components/order/OrderView.jsx';

export default function AddressesPage() {
  useTitle('Sổ địa chỉ');
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null | 'new' | address
  const [form, setForm] = useState(emptyAddress);
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const addresses = user.addresses;
  const applyItems = (items) => qc.setQueryData(['me'], (u) => ({ ...u, addresses: items }));

  const open = (addr) => {
    setEditing(addr || 'new');
    setForm(addr ? { ...emptyAddress, ...addr } : { ...emptyAddress, recipientName: user.fullName });
    setIsDefault(addr ? addr.isDefault : addresses.length === 0);
    setErrors({});
  };

  const save = async (e) => {
    e.preventDefault();
    const errs = validateAddress(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    const body = {
      recipientName: form.recipientName,
      phone: form.phone,
      street: form.street,
      ward: form.ward,
      district: form.district,
      city: form.city,
      isDefault,
    };
    try {
      const res =
        editing === 'new'
          ? await api.post('/account/addresses', body)
          : await api.put(`/account/addresses/${editing._id}`, body);
      applyItems(res.items);
      toast.success(editing === 'new' ? 'Đã thêm địa chỉ' : 'Đã cập nhật địa chỉ');
      setEditing(null);
    } catch (err) {
      setErrors(err.fieldErrors());
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const act = async (fn, msg) => {
    try {
      applyItems((await fn()).items);
      toast.success(msg);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <h1 className="page-title">Sổ địa chỉ</h1>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => open(null)}>
          Thêm địa chỉ
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState icon={MapPin} title="Chưa có địa chỉ" text="Thêm địa chỉ để thanh toán nhanh hơn." />
      ) : (
        <div className="addr-grid">
          {addresses.map((a) => (
            <article
              key={a._id}
              className={`card card__body addr-card ${a.isDefault ? 'addr-card--default' : ''}`}
            >
              <div className="addr-card__head">
                <strong>{a.recipientName}</strong>
                {a.isDefault && <span className="badge badge--brand badge--plain">Mặc định</span>}
              </div>
              {a.phone && <p className="muted">{a.phone}</p>}
              <p>{formatAddress(a)}</p>
              <div className="addr-card__actions">
                <Button size="sm" icon={<Pencil size={14} />} onClick={() => open(a)}>
                  Sửa
                </Button>
                {!a.isDefault && (
                  <Button
                    size="sm"
                    icon={<Star size={14} />}
                    onClick={() =>
                      act(() => api.post(`/account/addresses/${a._id}/default`), 'Đã đặt làm mặc định')
                    }
                  >
                    Đặt mặc định
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  icon={<Trash2 size={14} />}
                  onClick={() =>
                    window.confirm('Xóa địa chỉ này?') &&
                    act(() => api.delete(`/account/addresses/${a._id}`), 'Đã xóa địa chỉ')
                  }
                >
                  Xóa
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Thêm địa chỉ mới' : 'Sửa địa chỉ'}
        width={640}
      >
        <form className="stack" onSubmit={save} noValidate>
          <AddressFields value={form} onChange={setForm} errors={errors} />
          <label className="check">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            Đặt làm địa chỉ mặc định
          </label>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Lưu địa chỉ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
