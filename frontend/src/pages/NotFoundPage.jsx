import { SearchX } from 'lucide-react';
import { EmptyState } from '../components/ui/States.jsx';
import Button from '../components/ui/Button.jsx';

export default function NotFoundPage() {
  return (
    <div className="container">
      <EmptyState
        icon={SearchX}
        title="Không tìm thấy trang"
        text="Trang bạn tìm không tồn tại hoặc đã được di chuyển."
        action={
          <Button to="/" variant="primary">
            Về trang chủ
          </Button>
        }
      />
    </div>
  );
}
