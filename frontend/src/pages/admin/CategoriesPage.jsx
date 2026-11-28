import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useTitle } from '../../lib/hooks.js';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import { ErrorState, PageLoader } from '../../components/ui/States.jsx';

export default function CategoriesPage() {
  useTitle('Quản lý danh mục');
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.get('/admin/categories'),
  });
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
    qc.invalidateQueries({ queryKey: ['home'] });
  };

  const create = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setErrors({ name: 'Tên danh mục tối thiểu 2 ký tự' });
      return;
    }
    try {
      await api.post('/admin/categories', { name: name.trim() });
      setName('');
      setErrors({});
      toast.success('Đã thêm danh mục');
      refresh();
    } catch (err) {
      setErrors({ name: err.fieldErrors().name || err.message });
    }
  };

  const rename = async (c) => {
    try {
      await api.put(`/admin/categories/${c.id}`, { name: editName.trim(), slug: c.slug });
      setEditing(null);
      toast.success('Đã đổi tên danh mục');
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Xóa danh mục "${c.name}"?`)) return;
    try {
      await api.delete(`/admin/categories/${c.id}`);
      toast.success('Đã xóa danh mục');
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="stack-lg">
      <h1 className="page-title">Danh mục sản phẩm</h1>
      <form className="card card__body inline-form" onSubmit={create} noValidate>
        <Field
          label="Tên danh mục mới"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="VD: Tản nhiệt"
        />
        <Button type="submit" variant="primary" icon={<Plus size={16} />}>
          Thêm
        </Button>
      </form>
      <section className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tên danh mục</th>
                <th>Slug</th>
                <th className="num">Số sản phẩm</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id}>
                  <td>
                    {editing === c.id ? (
                      <input
                        className="input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        aria-label="Tên mới"
                      />
                    ) : (
                      <strong>{c.name}</strong>
                    )}
                  </td>
                  <td className="muted">{c.slug}</td>
                  <td className="num">{c.productCount}</td>
                  <td>
                    <div className="row-actions">
                      {editing === c.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            icon={<Check size={14} />}
                            aria-label="Lưu"
                            onClick={() => rename(c)}
                          />
                          <Button
                            size="sm"
                            icon={<X size={14} />}
                            aria-label="Hủy"
                            onClick={() => setEditing(null)}
                          />
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            icon={<Pencil size={14} />}
                            aria-label="Đổi tên"
                            onClick={() => {
                              setEditing(c.id);
                              setEditName(c.name);
                            }}
                          />
                          <Button
                            size="sm"
                            variant="danger"
                            icon={<Trash2 size={14} />}
                            aria-label="Xóa"
                            disabled={c.productCount > 0}
                            title={c.productCount > 0 ? 'Danh mục còn sản phẩm' : 'Xóa'}
                            onClick={() => remove(c)}
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
