import type { TopParticipantItem } from '../../types/dashboard';

interface TopParticipantsListProps {
  data: TopParticipantItem[];
}

export default function TopParticipantsList({ data }: TopParticipantsListProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-bold">最活跃员工 Top 10</h3>
      </div>
      <div className="p-0 flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-[#1A2E22]/50">
              <th className="px-6 py-3 font-medium">排名</th>
              <th className="px-6 py-3 font-medium">员工</th>
              <th className="px-6 py-3 font-medium text-right">参与次数</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-[#1A2E22]/40">
                  暂无数据
                </td>
              </tr>
            )}
            {data.map((emp, i) => (
              <tr key={emp.userId} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-3">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    i < 3 ? 'bg-[#2EB87A]/10 text-[#2EB87A]' : 'bg-gray-100 text-[#1A2E22]/50'
                  }`}>
                    {i + 1}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#2EB87A]/10 flex items-center justify-center text-[#2EB87A] font-bold text-sm">
                      {emp.displayName?.charAt(0) ?? '?'}
                    </div>
                    <span className="font-medium">{emp.displayName ?? '未知用户'}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-right font-bold text-[#2EB87A]">{emp.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
