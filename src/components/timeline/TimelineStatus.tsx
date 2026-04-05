import { Timeline, Typography } from 'antd';
import type { TimelineEntry } from '../../types/models';
import { formatDateTimeVi } from '../../utils/datetime';
import { getStatusMeta } from '../../utils/status';

interface TimelineStatusProps {
  items: TimelineEntry[];
}

export function TimelineStatus({ items }: TimelineStatusProps) {
  return (
    <Timeline
      items={items.map((item) => ({
        color: getStatusMeta(item.status).color,
        children: (
          <div>
            <Typography.Text strong>
              {item.label ?? getStatusMeta(item.status).label}
            </Typography.Text>
            <div>{item.description}</div>
            {item.createdAt ? (
              <Typography.Text type="secondary">
                {formatDateTimeVi(item.createdAt)}
              </Typography.Text>
            ) : null}
          </div>
        ),
      }))}
    />
  );
}
