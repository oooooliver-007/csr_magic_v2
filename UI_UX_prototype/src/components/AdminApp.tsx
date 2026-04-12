import React, { useState, useEffect } from 'react';
import { 
  BarChart3, CalendarDays, ClipboardList, Users, UserCircle, Bell, 
  Search, Plus, Filter, MoreVertical, Edit, Eye, Download, Check, X,
  ChevronDown, ChevronUp, MessageSquare, Shield, Mail, Trash2, Lock, Unlock
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export function AdminApp() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'events' | 'activities' | 'participation' | 'users' | 'notifications'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock loading state
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'events', label: 'Events', icon: CalendarDays },
    { id: 'activities', label: 'Activities', icon: ClipboardList },
    { id: 'participation', label: 'Participation', icon: Users },
    { id: 'users', label: 'Users', icon: UserCircle },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F7FAF8] text-[#1A2E22] font-sans flex">
      {/* Fixed Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2EB87A] rounded-lg flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="font-bold text-lg">CSR Admin</span>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                currentPage === item.id 
                  ? 'bg-[#2EB87A]/10 text-[#2EB87A]' 
                  : 'text-[#1A2E22]/70 hover:bg-gray-50 hover:text-[#1A2E22]'
              }`}
            >
              <item.icon className={`w-5 h-5 ${currentPage === item.id ? 'text-[#2EB87A]' : 'text-[#1A2E22]/50'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" referrerPolicy="no-referrer" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">Admin User</p>
              <p className="text-xs text-[#1A2E22]/60">System Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white/50 backdrop-blur-sm border-b border-gray-200 flex items-center px-8 sticky top-0 z-10">
          <div className="flex items-center text-sm font-medium text-[#1A2E22]/60">
            <span>Admin</span>
            <span className="mx-2">/</span>
            <span className="text-[#1A2E22] capitalize">{currentPage}</span>
          </div>
        </header>

        <div className="p-8 flex-1">
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {currentPage === 'dashboard' && <DashboardPage />}
              {currentPage === 'activities' && <ActivitiesManagementPage />}
              {currentPage === 'participation' && <ParticipationReviewPage />}
              {currentPage === 'users' && <UserManagementPage />}
              {currentPage !== 'dashboard' && currentPage !== 'activities' && currentPage !== 'participation' && currentPage !== 'users' && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <ClipboardList className="w-8 h-8 text-gray-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Page under construction</h2>
                  <p className="text-[#1A2E22]/60 max-w-md">
                    The {currentPage} page is currently being built. Check back later.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 h-32"></div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 h-96"></div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 h-96"></div>
      </div>
    </div>
  );
}

const lineChartData = [
  { name: 'Jan', participants: 400 },
  { name: 'Feb', participants: 300 },
  { name: 'Mar', participants: 550 },
  { name: 'Apr', participants: 480 },
  { name: 'May', participants: 700 },
  { name: 'Jun', participants: 650 },
  { name: 'Jul', participants: 800 },
  { name: 'Aug', participants: 950 },
  { name: 'Sep', participants: 850 },
  { name: 'Oct', participants: 1100 },
  { name: 'Nov', participants: 1050 },
  { name: 'Dec', participants: 1205 },
];

const pieChartData = [
  { name: 'Volunteer', value: 45 },
  { name: 'Donation', value: 25 },
  { name: 'Check-in', value: 20 },
  { name: 'General', value: 10 },
];

const COLORS = ['#FFB347', '#2EB87A', '#3B82F6', '#6B7280'];

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <div className="text-sm text-[#1A2E22]/60">Last updated: Today, 09:41 AM</div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard title="Total Activities" value="24" trend="+3 this month" />
        <StatCard title="Total Participations" value="1,205" trend="+12% vs last month" />
        <StatCard title="Total Donations" value="$8,450" trend="+$450 this week" />
        <StatCard title="New This Month" value="156" trend="Active users" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Monthly Participation Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#2EB87A', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line type="monotone" dataKey="participants" stroke="#2EB87A" strokeWidth={3} dot={{ r: 4, fill: '#2EB87A', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold mb-2">Activity Type Distribution</h3>
          <div className="flex-1 flex items-center justify-center">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1A2E22', fontWeight: 500 }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-[#1A2E22] font-medium ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top 10 Active Employees */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold">Top Active Employees</h3>
            <button className="text-sm font-medium text-[#2EB87A] hover:underline">View All</button>
          </div>
          <div className="p-0 flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-[#1A2E22]/50">
                  <th className="px-6 py-3 font-medium">Employee</th>
                  <th className="px-6 py-3 font-medium">Department</th>
                  <th className="px-6 py-3 font-medium text-right">Activities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { name: 'Alex Chen', dept: 'Engineering', count: 12, avatar: 'Alex' },
                  { name: 'Sarah Jenkins', dept: 'Marketing', count: 10, avatar: 'Sarah' },
                  { name: 'Michael Ross', dept: 'Sales', count: 8, avatar: 'Michael' },
                  { name: 'Emily Wong', dept: 'Product', count: 7, avatar: 'Emily' },
                  { name: 'David Kim', dept: 'Engineering', count: 6, avatar: 'David' },
                ].map((emp, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.avatar}`} alt={emp.name} referrerPolicy="no-referrer" />
                        </div>
                        <span className="font-medium">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-[#1A2E22]/70 text-sm">{emp.dept}</td>
                    <td className="px-6 py-3 text-right font-bold text-[#2EB87A]">{emp.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Currently Active Activities */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold">Active Activities</h3>
            <button className="text-sm font-medium text-[#2EB87A] hover:underline">Manage</button>
          </div>
          <div className="p-6 space-y-6">
            {[
              { name: 'Spring Tree Planting', type: 'Volunteer', current: 45, max: 50, color: 'bg-[#FFB347]' },
              { name: 'Beach Cleanup Drive', type: 'Volunteer', current: 120, max: 200, color: 'bg-[#FFB347]' },
              { name: 'Local School Book Donation', type: 'Donation', current: 85, max: 100, color: 'bg-[#2EB87A]' },
              { name: 'Q2 Wellness Walk', type: 'Check-in', current: 210, max: 500, color: 'bg-blue-500' },
            ].map((activity, i) => {
              const percent = Math.round((activity.current / activity.max) * 100);
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="font-bold text-sm">{activity.name}</h4>
                      <p className="text-xs text-[#1A2E22]/50 mt-0.5">{activity.type}</p>
                    </div>
                    <div className="text-sm font-medium">
                      {activity.current} <span className="text-[#1A2E22]/50">/ {activity.max}</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${activity.color}`} 
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend }: { title: string, value: string, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <p className="text-[#1A2E22]/60 font-medium text-sm mb-3">{title}</p>
      <p className="text-3xl font-bold text-[#1A2E22] mb-2">{value}</p>
      <p className="text-xs font-medium text-[#2EB87A] bg-[#2EB87A]/10 inline-block px-2 py-1 rounded-md">
        {trend}
      </p>
    </div>
  );
}

function ActivitiesManagementPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const activities = [
    { id: 'ACT-001', name: 'Spring Tree Planting', event: 'Earth Month 2026', type: 'volunteer', date: 'Apr 15 - Apr 16', participants: 45, capacity: 50, status: 'Active' },
    { id: 'ACT-002', name: 'Beach Cleanup Drive', event: 'Earth Month 2026', type: 'volunteer', date: 'Apr 22', participants: 120, capacity: 200, status: 'Active' },
    { id: 'ACT-003', name: 'Local School Book Donation', event: 'Education First', type: 'donation', date: 'May 01 - May 31', participants: 85, capacity: 100, status: 'Draft' },
    { id: 'ACT-004', name: 'Q2 Wellness Walk', event: 'Health & Wellness', type: 'check-in', date: 'Jun 10', participants: 210, capacity: 500, status: 'Active' },
    { id: 'ACT-005', name: 'Winter Coat Drive', event: 'Holiday Giving', type: 'donation', date: 'Dec 01 - Dec 20', participants: 340, capacity: null, status: 'Completed' },
  ];

  return (
    <div className="space-y-6 relative h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Activities Management</h1>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A2E22]/40" />
            <input 
              type="text" 
              placeholder="Search activities..." 
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
            />
          </div>
          <select className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#2EB87A] focus:outline-none bg-white">
            <option value="">All Events</option>
            <option value="earth">Earth Month 2026</option>
            <option value="edu">Education First</option>
          </select>
          <select className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#2EB87A] focus:outline-none bg-white">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="bg-[#2EB87A] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#2EB87A]/90 transition-colors flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Activity
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-[#1A2E22]/50 border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Activity Name</th>
                <th className="px-6 py-4 font-medium">Event</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Date Range</th>
                <th className="px-6 py-4 font-medium">Participants</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activities.map((act) => (
                <tr key={act.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#1A2E22]">{act.name}</div>
                    <div className="text-xs text-[#1A2E22]/50 mt-0.5">{act.id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#1A2E22]/70">{act.event}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                      ${act.type === 'volunteer' ? 'bg-[#FFB347]/10 text-[#FFB347]' : ''}
                      ${act.type === 'donation' ? 'bg-[#2EB87A]/10 text-[#2EB87A]' : ''}
                      ${act.type === 'check-in' ? 'bg-blue-500/10 text-blue-600' : ''}
                    `}>
                      {act.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#1A2E22]/70">{act.date}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="font-medium">{act.participants}</span>
                    <span className="text-[#1A2E22]/50"> / {act.capacity || '∞'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                      ${act.status === 'Active' ? 'bg-[#2EB87A]/10 text-[#2EB87A]' : ''}
                      ${act.status === 'Draft' ? 'bg-gray-100 text-gray-600' : ''}
                      ${act.status === 'Completed' ? 'bg-blue-500/10 text-blue-600' : ''}
                    `}>
                      {act.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-[#1A2E22]/40 hover:text-[#2EB87A] transition-colors rounded-lg hover:bg-[#2EB87A]/10">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-[#1A2E22]/40 hover:text-[#2EB87A] transition-colors rounded-lg hover:bg-[#2EB87A]/10">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Drawer */}
      {isDrawerOpen && (
        <>
          <div 
            className="fixed inset-0 bg-[#1A2E22]/20 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">Create Activity</h2>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-[#1A2E22]/40 hover:text-[#1A2E22] hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#1A2E22]">Event</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none bg-white text-sm">
                  <option>Select an event...</option>
                  <option>Earth Month 2026</option>
                  <option>Education First</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#1A2E22]">Activity Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Spring Tree Planting"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#1A2E22]">Template Type</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none bg-white text-sm">
                  <option>Volunteer</option>
                  <option>Donation</option>
                  <option>Check-in</option>
                  <option>General</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#1A2E22]">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#1A2E22]">End Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#1A2E22]">Capacity</label>
                <input 
                  type="number" 
                  placeholder="Leave empty for unlimited"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#1A2E22]">Description</label>
                <textarea 
                  rows={4}
                  placeholder="Describe the activity..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#1A2E22]">Cover Image</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-[#2EB87A] hover:bg-[#2EB87A]/5 transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <Plus className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-[#1A2E22]">Click to upload</p>
                  <p className="text-xs text-[#1A2E22]/50 mt-1">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50">
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 font-medium text-[#1A2E22] hover:bg-white transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#2EB87A] font-medium text-white hover:bg-[#2EB87A]/90 transition-colors text-sm"
              >
                Save Activity
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const mockRegistrations = [
  { id: '1', user: 'Emma Chen', department: 'Engineering', activity: 'Spring Tree Planting', date: '2026-03-25', status: 'pending', notes: 'Vegetarian lunch please' },
  { id: '2', user: 'Liam Smith', department: 'Marketing', activity: 'Beach Cleanup', date: '2026-03-24', status: 'approved', notes: '' },
  { id: '3', user: 'Olivia Davis', department: 'HR', activity: 'Spring Tree Planting', date: '2026-03-24', status: 'pending', notes: '' },
  { id: '4', user: 'Noah Wilson', department: 'Finance', activity: 'Food Bank Sorting', date: '2026-03-23', status: 'rejected', notes: 'Schedule conflict' },
  { id: '5', user: 'Ava Taylor', department: 'Engineering', activity: 'Beach Cleanup', date: '2026-03-22', status: 'approved', notes: 'Bringing my own gloves' },
];

function ParticipationReviewPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === mockRegistrations.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(mockRegistrations.map(r => r.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2E22]">Participation Review</h1>
          <p className="text-[#1A2E22]/60 text-sm mt-1">Review and manage employee activity registrations.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {selectedRows.size > 0 && (
            <>
              <button className="flex-1 sm:flex-none bg-white border border-gray-200 text-[#1A2E22] px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Approve ({selectedRows.size})
              </button>
              <button className="flex-1 sm:flex-none bg-white border border-gray-200 text-[#1A2E22] px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <X className="w-4 h-4 text-red-600" />
                Reject ({selectedRows.size})
              </button>
            </>
          )}
          <button className="flex-1 sm:flex-none bg-white border border-gray-200 text-[#1A2E22] px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or activity..." 
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select className="px-4 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm bg-white min-w-[120px]">
            <option>All Status</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
          <select className="px-4 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm bg-white min-w-[140px]">
            <option>All Activities</option>
            <option>Spring Tree Planting</option>
            <option>Beach Cleanup</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-[#1A2E22]/60 font-medium">
              <tr>
                <th className="p-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-[#2EB87A] focus:ring-[#2EB87A]"
                    checked={selectedRows.size === mockRegistrations.length && mockRegistrations.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4">Employee</th>
                <th className="p-4">Activity</th>
                <th className="p-4">Applied On</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockRegistrations.map((reg) => (
                <React.Fragment key={reg.id}>
                  <tr className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-[#2EB87A] focus:ring-[#2EB87A]"
                        checked={selectedRows.has(reg.id)}
                        onChange={() => toggleSelectRow(reg.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#2EB87A]/10 flex items-center justify-center text-[#2EB87A] font-bold text-xs">
                          {reg.user.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-[#1A2E22]">{reg.user}</p>
                          <p className="text-xs text-[#1A2E22]/50">{reg.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-[#1A2E22]/80">{reg.activity}</td>
                    <td className="p-4 text-[#1A2E22]/80">{reg.date}</td>
                    <td className="p-4">{getStatusBadge(reg.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {reg.status === 'pending' && (
                          <>
                            <button className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve">
                              <Check className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => toggleRow(reg.id)}
                          className="p-1.5 text-gray-400 hover:text-[#1A2E22] hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {expandedRow === reg.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded Details Row */}
                  {expandedRow === reg.id && (
                    <tr className="bg-gray-50/30">
                      <td colSpan={6} className="p-0">
                        <div className="p-4 pl-16 border-l-2 border-[#2EB87A] m-2 rounded-r-xl bg-white shadow-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs font-bold text-[#1A2E22]/50 uppercase tracking-wider mb-1">Registration Notes</h4>
                              <p className="text-sm text-[#1A2E22]">{reg.notes || <span className="text-gray-400 italic">No notes provided.</span>}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-[#1A2E22]/50 uppercase tracking-wider mb-1">Contact</h4>
                              <p className="text-sm text-[#1A2E22] flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                                Message {reg.user.split(' ')[0]}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-[#1A2E22]/60">
          <p>Showing 1 to 5 of 24 entries</p>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <button className="px-3 py-1 bg-[#2EB87A] text-white rounded-lg">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">2</button>
            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">3</button>
            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const mockUsers = [
  { id: '1', name: 'Alex Johnson', email: 'alex.j@company.com', department: 'Engineering', role: 'employee', status: 'active', hours: 24, lastActive: '2 hours ago' },
  { id: '2', name: 'Sarah Williams', email: 'sarah.w@company.com', department: 'HR', role: 'admin', status: 'active', hours: 45, lastActive: '10 mins ago' },
  { id: '3', name: 'Michael Brown', email: 'michael.b@company.com', department: 'Marketing', role: 'employee', status: 'inactive', hours: 0, lastActive: '2 months ago' },
  { id: '4', name: 'Emily Davis', email: 'emily.d@company.com', department: 'Design', role: 'employee', status: 'active', hours: 12, lastActive: '1 day ago' },
  { id: '5', name: 'David Wilson', email: 'david.w@company.com', department: 'Finance', role: 'employee', status: 'active', hours: 8, lastActive: '5 hours ago' },
];

function UserManagementPage() {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);

  const toggleSelectAll = () => {
    if (selectedUsers.size === mockUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(mockUsers.map(u => u.id)));
    }
  };

  const toggleSelectUser = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUsers(newSelected);
  };

  return (
    <div className="flex h-full gap-6 relative">
      {/* Main Content */}
      <div className={`flex-1 space-y-6 transition-all duration-300 ${selectedUserDetail ? 'mr-[400px]' : ''}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A2E22]">User Management</h1>
            <p className="text-[#1A2E22]/60 text-sm mt-1">Manage employee accounts, roles, and permissions.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {selectedUsers.size > 0 && (
              <button className="flex-1 sm:flex-none bg-white border border-gray-200 text-[#1A2E22] px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                Message ({selectedUsers.size})
              </button>
            )}
            <button className="flex-1 sm:flex-none bg-[#2EB87A] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#2EB87A]/90 transition-colors flex items-center justify-center gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              Invite Users
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search users by name or email..." 
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select className="px-4 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm bg-white min-w-[120px]">
              <option>All Roles</option>
              <option>Admin</option>
              <option>Employee</option>
            </select>
            <select className="px-4 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm bg-white min-w-[140px]">
              <option>All Departments</option>
              <option>Engineering</option>
              <option>HR</option>
              <option>Marketing</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-[#1A2E22]/60 font-medium">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-[#2EB87A] focus:ring-[#2EB87A]"
                      checked={selectedUsers.size === mockUsers.length && mockUsers.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Total Hours</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${selectedUserDetail?.id === user.id ? 'bg-[#2EB87A]/5' : ''}`}
                    onClick={() => setSelectedUserDetail(user)}
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-[#2EB87A] focus:ring-[#2EB87A]"
                        checked={selectedUsers.has(user.id)}
                        onChange={(e) => toggleSelectUser(user.id, e as any)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2EB87A]/20 to-[#FFB347]/20 flex items-center justify-center text-[#1A2E22] font-bold text-xs">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-[#1A2E22]">{user.name}</p>
                          <p className="text-xs text-[#1A2E22]/50">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                        {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-[#1A2E22]/80 font-medium">{user.hours}h</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="p-1.5 text-gray-400 hover:text-[#2EB87A] hover:bg-green-50 rounded-lg transition-colors" 
                          title="Edit User"
                          onClick={(e) => { e.stopPropagation(); setSelectedUserDetail(user); }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Deactivate User"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-[#1A2E22]/60">
            <p>Showing 1 to 5 of 500 users</p>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">Prev</button>
              <button className="px-3 py-1 bg-[#2EB87A] text-white rounded-lg">1</button>
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">2</button>
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">3</button>
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel for User Details */}
      {selectedUserDetail && (
        <div className="absolute top-0 right-0 w-[400px] h-full bg-white rounded-2xl border border-gray-100 shadow-xl flex flex-col z-10 animate-in slide-in-from-right-8">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
            <h2 className="text-lg font-bold text-[#1A2E22]">User Details</h2>
            <button 
              onClick={() => setSelectedUserDetail(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-[#1A2E22]/60" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#2EB87A]/20 to-[#FFB347]/20 flex items-center justify-center text-[#1A2E22] font-bold text-2xl mb-3">
                {selectedUserDetail.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <h3 className="text-xl font-bold text-[#1A2E22]">{selectedUserDetail.name}</h3>
              <p className="text-[#1A2E22]/60 text-sm">{selectedUserDetail.email}</p>
              
              <div className="flex gap-2 mt-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${selectedUserDetail.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                  {selectedUserDetail.role.charAt(0).toUpperCase() + selectedUserDetail.role.slice(1)}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                  {selectedUserDetail.department}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-[#1A2E22] mb-3 uppercase tracking-wider">CSR Statistics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-xs text-[#1A2E22]/60 mb-1">Total Hours</p>
                    <p className="text-xl font-bold text-[#2EB87A]">{selectedUserDetail.hours}h</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-xs text-[#1A2E22]/60 mb-1">Activities Joined</p>
                    <p className="text-xl font-bold text-[#1A2E22]">4</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#1A2E22] mb-3 uppercase tracking-wider">Account Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-[#1A2E22]">Admin Privileges</p>
                      <p className="text-xs text-[#1A2E22]/50">Can manage activities and users</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={selectedUserDetail.role === 'admin'} />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2EB87A]"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-[#1A2E22]">Account Status</p>
                      <p className="text-xs text-[#1A2E22]/50">Currently {selectedUserDetail.status}</p>
                    </div>
                    <button className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${selectedUserDetail.status === 'active' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'} transition-colors`}>
                      {selectedUserDetail.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#1A2E22] mb-3 uppercase tracking-wider">Recent Activity</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#2EB87A]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-[#2EB87A]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A2E22]">Completed "Spring Tree Planting"</p>
                      <p className="text-xs text-[#1A2E22]/50">Earned 4 hours • 2 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <ClipboardList className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A2E22]">Registered for "Beach Cleanup"</p>
                      <p className="text-xs text-[#1A2E22]/50">Status: Approved • 1 week ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex gap-3">
            <button className="flex-1 py-2.5 bg-white border border-gray-200 text-[#1A2E22] rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
              Reset Password
            </button>
            <button className="flex-1 py-2.5 bg-[#2EB87A] text-white rounded-xl font-medium hover:bg-[#2EB87A]/90 transition-colors text-sm">
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
