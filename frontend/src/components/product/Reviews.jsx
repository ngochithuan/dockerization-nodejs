import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MessageSquare, Radio, Star } from 'lucide-react';
import { api } from '../../lib/api.js';
import { formatDateTime } from '../../lib/format.js';
import { getSocket } from '../../lib/socket.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Stars from '../ui/Stars.jsx';
import RatingInput from '../ui/RatingInput.jsx';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';
import Pagination from '../ui/Pagination.jsx';
import { EmptyState, ErrorState } from '../ui/States.jsx';

const PAGE_SIZE = 5;

function Summary({ summary }) {
  const max = Math.max(1, ...Object.values(summary.distribution));
  return (
    <div className="rsummary">
      <div className="rsummary__score">
        <strong>{summary.avgRating.toFixed(1)}</strong>
        <Stars value={summary.avgRating} size={18} />
        <span className="muted">{summary.ratingCount} lượt đánh giá</span>
      </div>
      <div className="rsummary__bars">
        {[5, 4, 3, 2, 1].map((n) => (
          <div key={n} className="rbar">
            <span className="row" style={{ gap: 3 }}>
              {n} <Star size={12} fill="var(--star)" strokeWidth={0} />
            </span>
            <div className="rbar__track">
              <div className="rbar__fill" style={{ width: `${(summary.distribution[n] / max) * 100}%` }} />
            </div>
            <span className="rbar__n">{summary.distribution[n]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewForm({ productId, myRating, onPosted }) {
  const { user } = useAuth();
  const location = useLocation();
  const [rating, setRating] = useState(myRating || 0);
  const [comment, setComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setRating(myRating || 0);
  }, [myRating]);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!user && guestName.trim().length < 2) errs.guestName = 'Vui lòng nhập tên hiển thị';
    if (!comment.trim() && !(user && rating)) errs.comment = 'Vui lòng nhập bình luận';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSending(true);
    try {
      const body = { comment: comment.trim() };
      if (user && rating) body.rating = rating;
      if (!user) body.guestName = guestName.trim();
      const res = await api.post(`/products/${productId}/reviews`, body);
      setComment('');
      onPosted(res);
      toast.success(body.rating && !body.comment ? 'Đã cập nhật đánh giá' : 'Cảm ơn bạn đã đánh giá!');
    } catch (err) {
      setErrors(err.fieldErrors());
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="rform" onSubmit={submit} noValidate>
      <h3 className="rform__title">Viết đánh giá</h3>
      {user ? (
        <div className="field">
          <span className="field__label">
            Đánh giá của bạn{' '}
            {myRating ? <span className="muted">(bạn đã chấm {myRating} sao — có thể sửa)</span> : null}
          </span>
          <RatingInput value={rating} onChange={setRating} />
        </div>
      ) : (
        <>
          <p className="rform__login">
            <Star size={15} />{' '}
            <Link to="/login" state={{ from: location.pathname }}>
              Đăng nhập
            </Link>{' '}
            để đánh giá sao. Bạn vẫn có thể bình luận mà không cần đăng nhập.
          </p>
          <Field
            label="Tên hiển thị"
            required
            value={guestName}
            maxLength={60}
            onChange={(e) => setGuestName(e.target.value)}
            error={errors.guestName}
            placeholder="VD: Minh Anh"
          />
        </>
      )}
      <Field
        as="textarea"
        label="Bình luận"
        value={comment}
        maxLength={2000}
        onChange={(e) => setComment(e.target.value)}
        error={errors.comment}
        placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm…"
        hint={user ? 'Có thể chỉ chấm sao mà không cần bình luận' : undefined}
      />
      <Button type="submit" variant="primary" loading={sending}>
        Gửi đánh giá
      </Button>
    </form>
  );
}

export default function Reviews({ productId, slug }) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [live, setLive] = useState(false);
  const key = ['reviews', productId, page];
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: key,
    queryFn: () => api.get(`/products/${productId}/reviews`, { params: { page, limit: PAGE_SIZE } }),
  });

  // Real-time updates: join the product room; new comments and rating changes from any
  // tab / any api replica are pushed here without reloading.
  useEffect(() => {
    const socket = getSocket();
    const join = () => {
      socket.emit('product:join', productId);
      setLive(true);
    };
    const onDisconnect = () => setLive(false);
    const onReview = (review) => {
      qc.setQueryData(['reviews', productId, 1], (old) => {
        if (!old || old.items.some((r) => r.id === review.id)) return old;
        const total = old.total + 1;
        return {
          ...old,
          items: [review, ...old.items].slice(0, PAGE_SIZE),
          total,
          totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        };
      });
      qc.invalidateQueries({ queryKey: ['reviews', productId], predicate: (q) => q.queryKey[2] !== 1 });
    };
    const onRating = (summary) => {
      qc.setQueriesData({ queryKey: ['reviews', productId] }, (old) => (old ? { ...old, summary } : old));
      qc.setQueryData(['product', slug], (old) =>
        old ? { ...old, avgRating: summary.avgRating, ratingCount: summary.ratingCount } : old,
      );
    };
    if (socket.connected) join();
    socket.on('connect', join);
    socket.on('disconnect', onDisconnect);
    socket.on('review:created', onReview);
    socket.on('rating:updated', onRating);
    return () => {
      socket.emit('product:leave', productId);
      socket.off('connect', join);
      socket.off('disconnect', onDisconnect);
      socket.off('review:created', onReview);
      socket.off('rating:updated', onRating);
    };
  }, [productId, slug, qc]);

  const onPosted = (res) => {
    qc.setQueriesData({ queryKey: ['reviews', productId] }, (old) =>
      old ? { ...old, myRating: res.myRating ?? old.myRating, summary: res.summary ?? old.summary } : old,
    );
    if (res.review) {
      setPage(1);
      qc.setQueryData(['reviews', productId, 1], (old) => {
        if (!old || old.items.some((r) => r.id === res.review.id)) return old;
        return { ...old, items: [res.review, ...old.items].slice(0, PAGE_SIZE), total: old.total + 1 };
      });
    }
  };

  return (
    <section id="reviews" className="card card__body reviews">
      <div className="reviews__head">
        <h2 className="pdp__section-title">Đánh giá & bình luận</h2>
        <span className={`live ${live ? 'live--on' : ''}`} title="Cập nhật thời gian thực qua WebSocket">
          <Radio size={14} /> {live ? 'Trực tiếp' : 'Đang kết nối…'}
        </span>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="reviews__grid">
          <div>
            {data ? <Summary summary={data.summary} /> : <div className="skeleton" style={{ height: 160 }} />}
            <ReviewForm productId={productId} myRating={data?.myRating} onPosted={onPosted} />
          </div>
          <div>
            {isLoading ? (
              <div className="skeleton" style={{ height: 240 }} />
            ) : data.items.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Chưa có bình luận"
                text="Hãy là người đầu tiên chia sẻ cảm nhận."
              />
            ) : (
              <ul className="rlist">
                {data.items.map((r) => (
                  <li key={r.id} className="ritem">
                    <span className="avatar avatar--light">{r.authorName[0]}</span>
                    <div className="ritem__body">
                      <div className="ritem__head">
                        <strong>{r.authorName}</strong>
                        {r.isGuest ? (
                          <span className="badge badge--plain">Khách</span>
                        ) : (
                          <span className="badge badge--success badge--plain">Thành viên</span>
                        )}
                        <time className="muted">{formatDateTime(r.createdAt)}</time>
                      </div>
                      {r.rating && <Stars value={r.rating} size={13} />}
                      <p>{r.comment}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {data && data.total > 0 && (
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                pageSize={data.pageSize}
                onChange={setPage}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
