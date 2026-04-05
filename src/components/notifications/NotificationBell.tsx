import { BellOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Dropdown, List, Space, Typography, message } from 'antd';
import { useEffect } from 'react';
import { getMyNotifications, markNotificationRead } from '../../services/notifications.api';
import { useNotificationStore } from '../../store/notification.store';
import { formatDateTimeVi } from '../../utils/datetime';
import { getErrorMessage } from '../../utils/errors';
import { queryKeys } from '../../utils/query-keys';

export function NotificationBell() {
  const queryClient = useQueryClient();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications({ scope: 'bell' }),
    queryFn: () => getMyNotifications(),
  });

  const unreadCount =
    notificationsQuery.data?.filter((notification) => !notification.isRead).length ?? 0;

  useEffect(() => {
    setUnreadCount(unreadCount);
  }, [setUnreadCount, unreadCount]);

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications({ scope: 'bell' }) });
    },
    onError: (error) => {
      message.error(getErrorMessage(error));
    },
  });

  return (
    <Dropdown
      placement="bottomRight"
      trigger={['click']}
      dropdownRender={() => (
        <div className="glass-panel" style={{ width: 360, padding: 12, borderRadius: 20 }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Thông báo mới
            </Typography.Title>
            <List
              locale={{ emptyText: 'Không có thông báo mới.' }}
              dataSource={notificationsQuery.data ?? []}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    !item.isRead ? (
                      <Button
                        key="read"
                        type="link"
                        size="small"
                        loading={markReadMutation.isPending}
                        onClick={() => markReadMutation.mutate(item.id)}
                      >
                        Đánh dấu đã đọc
                      </Button>
                    ) : null,
                  ]}
                >
                  <List.Item.Meta
                    title={item.title}
                    description={
                      <div>
                        <div>{item.content}</div>
                        <Typography.Text type="secondary">
                          {formatDateTimeVi(item.createdAt, 'Vừa xong')}
                        </Typography.Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Space>
        </div>
      )}
    >
      <Badge count={unreadCount} size="small">
        <Button shape="circle" icon={<BellOutlined />} />
      </Badge>
    </Dropdown>
  );
}
