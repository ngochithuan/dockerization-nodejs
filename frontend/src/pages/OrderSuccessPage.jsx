import { useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, MailCheck } from 'lucide-react';
import { useTitle } from '../lib/hooks.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/States.jsx';
import OrderView from '../components/order/OrderView.jsx';

export default function OrderSuccessPage() {
  useTitle('Đặt hàng thành công');
  const { orderNumber } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const stored = sessionStorage.getItem(`order:${orderNumber}`);
  const res = state || (stored ? JSON.parse(stored) : null);

  if (!res) {
    return (
      <div className="container">
        <EmptyState
          title="Không tìm thấy thông tin đơn hàng"
          text="Vui lòng đăng nhập để xem lịch sử đơn hàng."
          action={
            <Button to={user ? `/account/orders/${orderNumber}` : '/login'} variant="primary">
              Xem đơn hàng
            </Button>
          }
        />
      </div>
    );
  }

  const { order, accountCreated } = res;
  return (
    <div className="container">
      <div className="success-hero">
        <CheckCircle2 size={56} />
        <h1>Đặt hàng thành công!</h1>
        <p>
          Cảm ơn <b>{order.customerName}</b>. Đơn hàng <b>{order.orderNumber}</b> đã được ghi nhận, email xác
          nhận đã được gửi tới <b>{order.email}</b>.
        </p>
      </div>
      {accountCreated && (
        <div className="notice notice--brand">
          <MailCheck size={20} />
          <span>
            Chúng tôi đã tạo tài khoản cho email <b>{order.email}</b>. Hãy mở email xác nhận và bấm “Đặt mật
            khẩu” để đăng nhập, theo dõi đơn hàng và dùng <b>{order.pointsEarned} điểm</b> vừa tích lũy.
          </span>
        </div>
      )}
      {!accountCreated && !user && (
        <div className="notice">
          Đơn hàng đã được liên kết với tài khoản của email {order.email}. Đăng nhập để xem lịch sử và trạng
          thái đơn hàng.
        </div>
      )}
      <OrderView order={order} />
      <div className="success-actions">
        <Button to="/products" variant="primary">
          Tiếp tục mua sắm
        </Button>
        {user && <Button to={`/account/orders/${order.orderNumber}`}>Theo dõi đơn hàng</Button>}
      </div>
    </div>
  );
}
