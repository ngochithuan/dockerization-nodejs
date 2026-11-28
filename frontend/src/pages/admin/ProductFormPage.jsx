import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, ImagePlus, Plus, Star, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useTitle } from '../../lib/hooks.js';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import { ErrorState, PageLoader } from '../../components/ui/States.jsx';

const newVariant = () => ({
  key: crypto.randomUUID(),
  sku: '',
  name: '',
  price: '',
  costPrice: '',
  stock: '',
});
const EMPTY = {
  name: '',
  brand: '',
  category: '',
  tags: '',
  shortDescription: '',
  specs: [{ key: 'spec-0', label: '', value: '' }],
  images: [],
  variants: [newVariant(), newVariant()],
  isActive: true,
};

function validate(f) {
  const e = {};
  if (f.name.trim().length < 3) e.name = 'Tên sản phẩm tối thiểu 3 ký tự';
  if (!f.brand.trim()) e.brand = 'Nhập thương hiệu';
  if (!f.category) e.category = 'Chọn danh mục';
  if (f.shortDescription.split('\n').filter((l) => l.trim()).length < 5)
    e.shortDescription = 'Mô tả cần tối thiểu 5 dòng';
  if (f.images.length < 3) e.images = 'Cần tối thiểu 3 ảnh';
  if (f.variants.length < 2) e.variants = 'Mỗi sản phẩm cần tối thiểu 2 phiên bản';
  f.variants.forEach((v, i) => {
    if (!v.sku.trim()) e[`variants.${i}.sku`] = 'Nhập SKU';
    if (!v.name.trim()) e[`variants.${i}.name`] = 'Nhập tên';
    if (v.price === '' || Number(v.price) < 0) e[`variants.${i}.price`] = 'Giá không hợp lệ';
    if (v.costPrice === '' || Number(v.costPrice) < 0) e[`variants.${i}.costPrice`] = 'Giá vốn không hợp lệ';
    if (v.stock === '' || Number(v.stock) < 0 || !Number.isInteger(Number(v.stock)))
      e[`variants.${i}.stock`] = 'Tồn kho không hợp lệ';
  });
  return e;
}

export default function ProductFormPage() {
  const { id } = useParams();
  const isNew = !id;
  useTitle(isNew ? 'Thêm sản phẩm' : 'Sửa sản phẩm');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: cats } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.get('/admin/categories'),
  });
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => api.get(`/admin/products/${id}`),
    enabled: !isNew,
  });

  useEffect(() => {
    if (!data) return;
    const p = data.product;
    setForm({
      name: p.name,
      brand: p.brand,
      category: p.category,
      tags: p.tags.join(', '),
      shortDescription: p.shortDescription,
      specs: p.specs.length ? p.specs.map((s, i) => ({ ...s, key: `spec-${i}` })) : EMPTY.specs,
      images: p.images,
      variants: p.variants.map((v) => ({ ...v, key: v._id })),
      isActive: p.isActive,
    });
  }, [data]);

  if (!isNew && isLoading) return <PageLoader />;
  if (isError) return <ErrorState error={error} />;

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const setVariant = (i, k, v) =>
    setForm({ ...form, variants: form.variants.map((x, j) => (j === i ? { ...x, [k]: v } : x)) });
  const setSpec = (i, k, v) =>
    setForm({ ...form, specs: form.specs.map((x, j) => (j === i ? { ...x, [k]: v } : x)) });

  const upload = async (files) => {
    if (!files.length) return;
    const fd = new FormData();
    [...files].forEach((f) => fd.append('images', f));
    setUploading(true);
    try {
      const { urls } = await api.post('/admin/uploads', fd);
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Vui lòng kiểm tra lại các trường được đánh dấu');
      return;
    }
    setSaving(true);
    const body = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      shortDescription: form.shortDescription.trim(),
      specs: form.specs
        .filter((s) => s.label.trim() && s.value.trim())
        .map(({ label, value }) => ({ label, value })),
      images: form.images,
      variants: form.variants.map((v) => ({
        ...(v._id ? { _id: v._id } : {}),
        sku: v.sku.trim(),
        name: v.name.trim(),
        price: Number(v.price),
        costPrice: Number(v.costPrice),
        stock: Number(v.stock),
      })),
      isActive: form.isActive,
    };
    try {
      if (isNew) await api.post('/admin/products', body);
      else await api.put(`/admin/products/${id}`, body);
      toast.success(isNew ? 'Đã tạo sản phẩm' : 'Đã lưu sản phẩm');
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['admin', 'product', id] });
      navigate('/admin/products');
    } catch (err) {
      setErrors(err.fieldErrors());
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const lineCount = form.shortDescription.split('\n').filter((l) => l.trim()).length;

  return (
    <form className="stack-lg" onSubmit={save} noValidate>
      <div className="page-head">
        <div>
          <Link to="/admin/products" className="link-arrow">
            <ArrowLeft size={16} /> Danh sách sản phẩm
          </Link>
          <h1 className="page-title">{isNew ? 'Thêm sản phẩm' : `Sửa: ${data?.product.name}`}</h1>
        </div>
        <Button type="submit" variant="primary" loading={saving}>
          {isNew ? 'Tạo sản phẩm' : 'Lưu thay đổi'}
        </Button>
      </div>

      <div className="form-cols">
        <div className="stack-lg">
          <section className="card card__body stack">
            <h2 className="card__title">Thông tin chung</h2>
            <Field
              label="Tên sản phẩm"
              required
              value={form.name}
              onChange={set('name')}
              error={errors.name}
            />
            <div className="form-grid">
              <Field
                label="Thương hiệu"
                required
                value={form.brand}
                onChange={set('brand')}
                error={errors.brand}
              />
              <Field
                as="select"
                label="Danh mục"
                required
                value={form.category}
                onChange={set('category')}
                error={errors.category}
              >
                <option value="">— Chọn danh mục —</option>
                {cats?.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Field>
            </div>
            <Field
              label="Tags"
              value={form.tags}
              onChange={set('tags')}
              hint="Phân cách bằng dấu phẩy, VD: gaming, rgb"
              error={errors.tags}
            />
            <Field
              as="textarea"
              label="Mô tả ngắn (tối thiểu 5 dòng)"
              required
              rows={8}
              value={form.shortDescription}
              onChange={set('shortDescription')}
              error={errors.shortDescription}
              hint={`${lineCount} dòng`}
            />
          </section>

          <section className="card card__body stack">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2 className="card__title">Phiên bản, giá & tồn kho</h2>
              <Button
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setForm({ ...form, variants: [...form.variants, newVariant()] })}
              >
                Thêm phiên bản
              </Button>
            </div>
            {errors.variants && <span className="field__error">{errors.variants}</span>}
            <div className="table-wrap">
              <table className="table variant-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Tên phiên bản</th>
                    <th>Giá bán (đ)</th>
                    <th>Giá vốn (đ)</th>
                    <th>Tồn kho</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {form.variants.map((v, i) => (
                    <tr key={v.key}>
                      {['sku', 'name', 'price', 'costPrice', 'stock'].map((k) => (
                        <td key={k}>
                          <input
                            className={`input ${errors[`variants.${i}.${k}`] ? 'input--error' : ''}`}
                            type={['price', 'costPrice', 'stock'].includes(k) ? 'number' : 'text'}
                            min="0"
                            value={v[k]}
                            onChange={(e) => setVariant(i, k, e.target.value)}
                            aria-label={k}
                            title={errors[`variants.${i}.${k}`]}
                          />
                        </td>
                      ))}
                      <td>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Trash2 size={14} />}
                          aria-label="Xóa phiên bản"
                          disabled={form.variants.length <= 2}
                          onClick={() =>
                            setForm({ ...form, variants: form.variants.filter((_, j) => j !== i) })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted small">
              Mỗi phiên bản có tồn kho độc lập. Giá vốn dùng để tính lợi nhuận trong thống kê.
            </p>
          </section>

          <section className="card card__body stack">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2 className="card__title">Thông số kỹ thuật</h2>
              <Button
                size="sm"
                icon={<Plus size={14} />}
                onClick={() =>
                  setForm({
                    ...form,
                    specs: [...form.specs, { key: crypto.randomUUID(), label: '', value: '' }],
                  })
                }
              >
                Thêm dòng
              </Button>
            </div>
            {form.specs.map((s, i) => (
              <div key={s.key} className="spec-row">
                <input
                  className="input"
                  placeholder="Tên (VD: CPU)"
                  value={s.label}
                  onChange={(e) => setSpec(i, 'label', e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Giá trị"
                  value={s.value}
                  onChange={(e) => setSpec(i, 'value', e.target.value)}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<X size={14} />}
                  aria-label="Xóa dòng"
                  onClick={() => setForm({ ...form, specs: form.specs.filter((_, j) => j !== i) })}
                />
              </div>
            ))}
          </section>
        </div>

        <div className="stack-lg">
          <section className="card card__body stack">
            <h2 className="card__title">Hình ảnh (tối thiểu 3)</h2>
            <div className="img-grid">
              {form.images.map((src, i) => (
                <div key={src} className={`img-tile ${i === 0 ? 'img-tile--main' : ''}`}>
                  <img src={src} alt="" />
                  {i === 0 ? (
                    <span className="img-tile__tag">Ảnh chính</span>
                  ) : (
                    <button
                      type="button"
                      className="img-tile__btn img-tile__btn--left"
                      title="Đặt làm ảnh chính"
                      onClick={() =>
                        setForm({ ...form, images: [src, ...form.images.filter((x) => x !== src)] })
                      }
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="img-tile__btn"
                    title="Xóa ảnh"
                    onClick={() => setForm({ ...form, images: form.images.filter((x) => x !== src) })}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="img-add"
                onClick={() => fileRef.current.click()}
                disabled={uploading}
              >
                {uploading ? <span className="spinner" /> : <ImagePlus size={22} />}
                <span>Tải ảnh lên</span>
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(e) => upload(e.target.files)}
            />
            {errors.images && <span className="field__error">{errors.images}</span>}
            <p className="muted small">JPG, PNG hoặc WEBP, tối đa 5MB mỗi ảnh.</p>
          </section>
          <section className="card card__body">
            <label className="check">
              <input type="checkbox" checked={form.isActive} onChange={set('isActive')} />
              Hiển thị sản phẩm trên cửa hàng
            </label>
          </section>
        </div>
      </div>
    </form>
  );
}
