import type { TaskStatus } from '../../types';

interface StatusDotProps {
  status: TaskStatus;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  REVIEW: 'На проверке',
  COMPLETED: 'Выполнена',
  ON_HOLD: 'Пауза',
  CANCELED: 'Отменена',
};

export default function StatusDot({ status }: StatusDotProps) {
  return (
    <span className={`status-dot dot-${status}`} title={STATUS_LABELS[status]} />
  );
}

export { STATUS_LABELS };
