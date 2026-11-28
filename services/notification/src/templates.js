// HTML e-mail templates (inline styles for e-mail client compatibility).
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const money = (n) => `${new Intl.NumberFormat('vi-VN').format(Math.round(n || 0))}đ`;
const pad = (n) => String(n).padStart(2, '0');
function dateTime(iso) {
  // Vietnam time (UTC+7)
  const d = new Date(new Date(iso).getTime() + 7 * 3600 * 1000);
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

const STATUS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao hàng',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã hủy',
};

function layout(title, body) {
  return `<!doctype html><html lang="vi"><body style="margin:0;background:#f6f8fb;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#0b1220">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e9f0">
    <tr><td style="background:#0b1220;padding:20px 28px;color:#fff;font-size:20px;font-weight:800">Circuit<span style="color:#ff5a4e">.</span>
      <div style="font-size:11px;font-weight:500;color:#7d879b;letter-spacing:.06em;text-transform:uppercase">Máy tính &amp; Linh kiện</div></td></tr>
    <tr><td style="padding:28px">
      <h1 style="margin:0 0 16px;font-size:20px">${esc(title)}</h1>
      ${body}
    </td></tr>
    <tr><td style="padding:16px 28px;background:#f6f8fb;color:#7d879b;font-size:12px">Email tự động từ Circuit — vui lòng không trả lời email này.</td></tr>
  </table></td></tr></table></body></html>`;
}

const button = (href, text) =>
  `<p style="margin:24px 0"><a href="${esc(href)}" style="display:inline-block;background:#2457f5;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px">${esc(text)}</a></p>
   <p style="font-size:12px;color:#56627a">Nếu nút không hoạt động, hãy mở liên kết: <br><a href="${esc(href)}" style="color:#2457f5;word-break:break-all">${esc(href)}</a></p>`;

export function welcomeEmail({ fullName, setPasswordUrl }) {
  return {
    subject: 'Chào mừng bạn đến với Circuit — đặt mật khẩu cho tài khoản',
    html: layout(
      `Xin chào ${fullName},`,
      `<p>Cảm ơn bạn đã đăng ký tài khoản tại Circuit. Để hoàn tất, vui lòng đặt mật khẩu đăng nhập.</p>
       ${button(setPasswordUrl, 'Đặt mật khẩu')}
       <p style="font-size:13px;color:#56627a">Liên kết có hiệu lực trong 7 ngày và chỉ dùng được một lần.</p>`,
    ),
  };
}

export function resetEmail({ fullName, resetUrl }) {
  return {
    subject: 'Đặt lại mật khẩu tài khoản Circuit',
    html: layout(
      `Xin chào ${fullName},`,
      `<p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
       ${button(resetUrl, 'Đặt lại mật khẩu')}
       <p style="font-size:13px;color:#56627a">Liên kết có hiệu lực trong <b>30 phút</b> và chỉ dùng được một lần. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
    ),
  };
}

function orderTable(o) {
  const rows = o.items
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eef1f6"><b>${esc(i.productName)}</b><br><span style="color:#56627a;font-size:13px">${esc(i.variantName)}</span></td>
        <td style="padding:10px 8px;border-bottom:1px solid #eef1f6;text-align:center">${i.qty}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eef1f6;text-align:right;white-space:nowrap">${money(i.unitPrice)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eef1f6;text-align:right;white-space:nowrap">${money(i.lineTotal)}</td></tr>`,
    )
    .join('');
  const line = (label, value, strong) =>
    `<tr><td colspan="3" style="padding:4px 0;color:${strong ? '#0b1220' : '#56627a'};${strong ? 'font-weight:700;font-size:16px' : ''}">${label}</td><td style="padding:4px 0;text-align:right;white-space:nowrap;${strong ? 'font-weight:700;font-size:16px;color:#e2382f' : ''}">${value}</td></tr>`;
  const a = o.shippingAddress || {};
  return `
   <table role="presentation" width="100%" style="font-size:14px;margin:8px 0 16px">
     <tr><td style="color:#56627a">Mã đơn hàng</td><td style="text-align:right"><b>${esc(o.orderNumber)}</b></td></tr>
     <tr><td style="color:#56627a">Ngày đặt</td><td style="text-align:right">${dateTime(o.createdAt)}</td></tr>
     <tr><td style="color:#56627a">Thanh toán</td><td style="text-align:right">${o.paymentMethod === 'card' ? 'Thẻ (đã thanh toán)' : 'Thanh toán khi nhận hàng (COD)'}</td></tr>
     <tr><td style="color:#56627a">Trạng thái</td><td style="text-align:right">${esc(STATUS[o.status] || o.status)}</td></tr>
   </table>
   <table role="presentation" width="100%" style="font-size:14px;border-collapse:collapse">
     <tr style="color:#7d879b;font-size:12px;text-transform:uppercase"><td>Sản phẩm</td><td style="text-align:center">SL</td><td style="text-align:right">Đơn giá</td><td style="text-align:right">Thành tiền</td></tr>
     ${rows}
     ${line('Tạm tính', money(o.subtotal))}
     ${o.discountAmount ? line(`Mã giảm giá ${esc(o.discountCode)} (-${o.discountPercent}%)`, `-${money(o.discountAmount)}`) : ''}
     ${line('Thuế VAT (10%)', money(o.tax))}
     ${line('Phí vận chuyển', o.shippingFee ? money(o.shippingFee) : 'Miễn phí')}
     ${o.pointsUsed ? line(`Điểm tích lũy đã dùng (${o.pointsUsed} điểm)`, `-${money(o.pointsUsed * 1000)}`) : ''}
     ${line('Tổng thanh toán', money(o.total), true)}
   </table>
   <p style="margin:16px 0 4px;font-size:14px">🎁 Bạn nhận được <b>${o.pointsEarned} điểm</b> tích lũy (= ${money(o.pointsEarned * 1000)}) cho đơn hàng này.</p>
   <h3 style="font-size:15px;margin:20px 0 6px">Địa chỉ giao hàng</h3>
   <p style="font-size:14px;margin:0;color:#3b4760">${esc(a.recipientName)} · ${esc(a.phone)}<br>${esc([a.street, a.ward, a.district, a.city].filter(Boolean).join(', '))}</p>`;
}

export function orderCreatedEmail({ order, setPasswordUrl }, baseUrl) {
  const account = setPasswordUrl
    ? `<div style="margin-top:24px;padding:16px;border-radius:10px;background:#eef3ff">
         <b>Chúng tôi đã tạo tài khoản cho bạn với email ${esc(order.email)}.</b>
         <p style="margin:6px 0 0;font-size:14px">Đặt mật khẩu để theo dõi đơn hàng và dùng điểm tích lũy:</p>
         ${button(setPasswordUrl, 'Đặt mật khẩu')}
       </div>`
    : `<p style="margin-top:20px">${button(`${baseUrl}/account/orders/${order.orderNumber}`, 'Theo dõi đơn hàng')}</p>`;
  return {
    subject: `Xác nhận đơn hàng ${order.orderNumber} — Circuit`,
    html: layout(
      `Cảm ơn ${order.customerName} đã đặt hàng!`,
      `<p>Đơn hàng của bạn đã được ghi nhận. Chi tiết đơn hàng:</p>${orderTable(order)}${account}`,
    ),
  };
}

export function orderStatusEmail({ order, status, note }, baseUrl) {
  return {
    subject: `Đơn hàng ${order.orderNumber}: ${STATUS[status] || status}`,
    html: layout(
      `Đơn hàng ${order.orderNumber} — ${STATUS[status] || status}`,
      `<p>Xin chào ${esc(order.customerName)}, trạng thái đơn hàng của bạn vừa được cập nhật thành <b>${esc(STATUS[status] || status)}</b>.</p>
       ${note ? `<p style="padding:12px;background:#f6f8fb;border-radius:8px">Ghi chú: ${esc(note)}</p>` : ''}
       ${button(`${baseUrl}/account/orders/${order.orderNumber}`, 'Xem chi tiết đơn hàng')}`,
    ),
  };
}
