import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DistributionItem } from '../../types/dashboard';

const COLORS: Record<string, string> = {
  VOLUNTEER: '#FFB347',
  DONATION: '#2EB87A',
  CHECKIN: '#3B82F6',
  BASIC: '#6B7280',
  CUSTOM: '#A855F7',
};

const LABELS: Record<string, string> = {
  VOLUNTEER: '志愿者',
  DONATION: '捐赠',
  CHECKIN: '签到',
  BASIC: '基础',
  CUSTOM: '自定义',
};

interface DistributionChartProps {
  data: DistributionItem[];
}

export default function DistributionChart({ data }: DistributionChartProps) {
  const chartData = data.map((item) => ({
    name: LABELS[item.templateType] ?? item.templateType,
    value: item.count,
    color: COLORS[item.templateType] ?? '#6B7280',
  }));

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
      <h3 className="text-lg font-bold mb-2">活动类型分布</h3>
      <div className="flex-1 flex items-center justify-center">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                itemStyle={{ color: '#1A2E22', fontWeight: 500 }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-[#1A2E22] font-medium ml-1">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
