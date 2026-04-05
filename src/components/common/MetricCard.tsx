import { Card, Statistic } from 'antd';

interface MetricCardProps {
  title: string;
  value?: number | string;
  suffix?: string;
  preserveValue?: boolean;
}

export function MetricCard({
  title,
  value,
  suffix,
  preserveValue,
}: MetricCardProps) {
  return (
    <Card className="metric-card glass-panel">
      <Statistic
        title={title}
        value={value ?? '--'}
        suffix={suffix}
        formatter={preserveValue ? () => String(value ?? '--') : undefined}
        valueStyle={
          preserveValue
            ? {
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                lineHeight: 1.4,
              }
            : undefined
        }
      />
    </Card>
  );
}
