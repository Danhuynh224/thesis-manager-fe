import { useQuery } from '@tanstack/react-query';
import { List, Space, Typography } from 'antd';
import { MetricCard } from '../../components/common/MetricCard';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { StatusTag } from '../../components/status/StatusTag';
import { TimelineStatus } from '../../components/timeline/TimelineStatus';
import { getStudentDashboard } from '../../services/dashboards.api';
import { getMyNotifications } from '../../services/notifications.api';
import { getRegistrationStatusHistory } from '../../services/registrations.api';
import { useAuthStore } from '../../store/auth.store';
import { formatDateTimeVi } from '../../utils/datetime';
import { queryKeys } from '../../utils/query-keys';
import { getRegistrationTitle, getRegistrationTypeLabel, getTermName } from '../../utils/registration';
import { buildTimelineFromRegistration } from '../../utils/status';

export default function StudentDashboardPage() {
  const authUser = useAuthStore((state) => state.user);

  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard('student'),
    queryFn: getStudentDashboard,
  });

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications({ page: 'student-dashboard' }),
    queryFn: () => getMyNotifications(),
  });

  const currentRegistration = dashboardQuery.data?.currentRegistration ?? null;
  const statusHistoryQuery = useQuery({
    queryKey: queryKeys.statusHistory(currentRegistration?.id),
    queryFn: () => getRegistrationStatusHistory(currentRegistration!.id),
    enabled: Boolean(currentRegistration?.id),
  });

  const timelineItems =
    (statusHistoryQuery.data?.length
      ? statusHistoryQuery.data.map((item) => ({
          status: item.status,
          label: item.statusLabel,
          description: item.note,
          createdAt: item.changedAt,
        }))
      : undefined) ??
    dashboardQuery.data?.statusHistory ??
    buildTimelineFromRegistration(currentRegistration);

  return (
    <div className="page-stack">
      <PageHeader
        title="Dashboard sinh viên"
        subtitle="Theo dõi nhanh hồ sơ hiện tại, deadline gần nhất và thông báo mới."
      />

      <div className="page-grid three-up">
        <MetricCard
          title="Mã sinh viên"
          value={authUser?.studentCode ?? authUser?.id ?? '--'}
          preserveValue
        />
        <MetricCard
          title="Trạng thái hiện tại"
          value={currentRegistration?.statusLabel ?? currentRegistration?.status ?? 'Chưa đăng ký'}
          preserveValue
        />
        <MetricCard
          title="Đợt đang tham gia"
          value={getTermName(currentRegistration)}
        />
      </div>

      <div className="page-grid two-up">
        <SectionCard title="Tóm tắt sinh viên">
          <Space direction="vertical" size={12}>
            <Typography.Text strong>
              {dashboardQuery.data?.profile?.fullName ?? authUser?.fullName}
            </Typography.Text>
            <Typography.Text>{authUser?.email}</Typography.Text>
            <Typography.Text>
              {authUser?.major ?? 'Chưa có chuyên ngành'}
            </Typography.Text>
          </Space>
        </SectionCard>

        <SectionCard title="Hồ sơ hiện tại">
          <Space direction="vertical" size={12}>
            <Typography.Text strong>
              {getRegistrationTitle(currentRegistration)}
            </Typography.Text>
            <Typography.Text>
              GVHD: {currentRegistration?.supervisor?.fullName ?? 'Chưa phân công'}
            </Typography.Text>
            <Typography.Text>
              Loại hồ sơ: {getRegistrationTypeLabel(currentRegistration)}
            </Typography.Text>
            <StatusTag status={currentRegistration?.statusLabel} />
          </Space>
        </SectionCard>
      </div>

      <div className="page-grid two-up">
        <SectionCard title="Timeline trạng thái">
          <TimelineStatus items={timelineItems} />
        </SectionCard>

        <SectionCard title="Deadline gần nhất">
          <Space direction="vertical" size={12}>
            <Typography.Text strong>
              {dashboardQuery.data?.nextDeadline?.title ?? 'Chưa có deadline'}
            </Typography.Text>
            <Typography.Text>
              {dashboardQuery.data?.nextDeadline?.description ??
                'Hệ thống sẽ cập nhật khi backend trả về mốc gần nhất.'}
            </Typography.Text>
            <Typography.Text type="secondary">
              {formatDateTimeVi(dashboardQuery.data?.nextDeadline?.dueAt, 'Chưa xác định')}
            </Typography.Text>
          </Space>
        </SectionCard>
      </div>

      <SectionCard title="Thông báo mới">
        <List
          dataSource={notificationsQuery.data ?? []}
          locale={{ emptyText: 'Chưa có thông báo mới.' }}
          renderItem={(item) => (
            <List.Item>
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
      </SectionCard>
    </div>
  );
}
