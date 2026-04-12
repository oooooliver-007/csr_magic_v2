import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, Search, Sparkles, Calendar, Users, ChevronRight, Leaf, MapPin, Clock, Info, MessageSquare, Send, Image as ImageIcon, Download, Share2, ArrowLeft } from 'lucide-react';
import { Badge } from './Badge';

export function EmployeeApp() {
  const [currentPage, setCurrentPage] = useState<'home' | 'list' | 'detail' | 'chat' | 'poster'>('home');

  return (
    <div className="min-h-screen bg-[#F7FAF8] text-[#1A2E22] font-sans">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <button className="md:hidden p-2 -ml-2 text-[#1A2E22]/60 hover:text-[#1A2E22]">
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('home')}>
                <div className="w-8 h-8 bg-[#2EB87A]/10 rounded-xl flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-[#2EB87A]" />
                </div>
                <span className="font-bold text-lg hidden sm:block">CSR Hub</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => setCurrentPage('home')} className={`font-medium ${currentPage === 'home' ? 'text-[#2EB87A]' : 'text-[#1A2E22]/60 hover:text-[#1A2E22]'}`}>Home</button>
              <button onClick={() => setCurrentPage('list')} className={`font-medium ${currentPage === 'list' ? 'text-[#2EB87A]' : 'text-[#1A2E22]/60 hover:text-[#1A2E22]'}`}>Activities</button>
              <button onClick={() => setCurrentPage('poster')} className={`font-medium ${currentPage === 'poster' ? 'text-[#2EB87A]' : 'text-[#1A2E22]/60 hover:text-[#1A2E22]'}`}>Poster Studio</button>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-[#1A2E22]/60 hover:text-[#1A2E22] transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#2EB87A] to-[#FFB347] p-[2px]">
                <img 
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" 
                  alt="User avatar" 
                  className="w-full h-full rounded-full bg-white"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {currentPage === 'home' && <HomePage onNavigate={setCurrentPage} />}
        {currentPage === 'list' && <ActivityListPage onNavigate={setCurrentPage} />}
        {currentPage === 'detail' && <ActivityDetailPage onNavigate={setCurrentPage} />}
        {currentPage === 'chat' && <AIChatRegistrationPage onNavigate={setCurrentPage} />}
        {currentPage === 'poster' && <AIPosterStudioPage onNavigate={setCurrentPage} />}
        {/* Other pages will be implemented here later */}
        {currentPage !== 'home' && currentPage !== 'list' && currentPage !== 'detail' && currentPage !== 'chat' && currentPage !== 'poster' && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Page under construction</h2>
            <button onClick={() => setCurrentPage('home')} className="text-[#2EB87A] font-medium hover:underline">Return Home</button>
          </div>
        )}
      </main>
    </div>
  );
}

function HomePage({ onNavigate }: { onNavigate: (page: any) => void }) {
  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Hi, Alex 👋</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-[#1A2E22]/60 font-medium mb-2">Activities Joined</p>
            <p className="text-4xl font-bold text-[#2EB87A]">12</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-[#1A2E22]/60 font-medium mb-2">Volunteer Hours</p>
            <p className="text-4xl font-bold text-[#2EB87A]">48</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-2 md:col-span-1">
            <p className="text-[#1A2E22]/60 font-medium mb-2">Total Donations</p>
            <p className="text-4xl font-bold text-[#2EB87A]">$350</p>
          </div>
        </div>
      </div>

      {/* Active Activities */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Active Activities</h2>
          <button onClick={() => onNavigate('list')} className="text-[#2EB87A] font-medium hover:underline hidden md:block">
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Spring Tree Planting Activity (春季植树活动)", type: "volunteer" as const, date: "Apr 15, 2026", participants: 45, image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800" },
            { title: "Beach Cleanup Drive", type: "volunteer" as const, date: "Apr 22, 2026", participants: 120, image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800" },
            { title: "Local School Book Donation", type: "donation" as const, date: "May 05, 2026", participants: 85, image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800" },
          ].map((activity, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
              <div className="h-48 overflow-hidden relative">
                <img src={activity.image} alt={activity.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute top-3 left-3">
                  <Badge type={activity.type} className="bg-white/90 backdrop-blur-sm shadow-sm" />
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-lg mb-3 line-clamp-2 leading-tight">{activity.title}</h3>
                <div className="mt-auto space-y-2 mb-5">
                  <div className="flex items-center text-[#1A2E22]/60 text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    {activity.date}
                  </div>
                  <div className="flex items-center text-[#1A2E22]/60 text-sm">
                    <Users className="w-4 h-4 mr-2" />
                    {activity.participants} participants
                  </div>
                </div>
                <button 
                  onClick={() => onNavigate('detail')}
                  className="w-full py-2.5 rounded-xl border-2 border-[#E5E7EB] font-medium text-[#1A2E22] hover:border-[#2EB87A] hover:text-[#2EB87A] transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Timeline */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-bold mb-6">My Recent Participation</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="space-y-6">
              {[
                { title: "Winter Coat Drive", date: "Jan 10, 2026", type: "donation" as const, points: "+50 pts" },
                { title: "Senior Center Tech Help", date: "Dec 15, 2025", type: "volunteer" as const, points: "+120 pts" },
                { title: "Annual Charity Run 5K", date: "Nov 02, 2025", type: "check-in" as const, points: "+200 pts" },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== 2 && <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-gray-100"></div>}
                  <div className="w-10 h-10 rounded-full bg-[#F7FAF8] flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm">
                    <Badge type={item.type} className="px-0 py-0 bg-transparent w-full h-full flex items-center justify-center [&>span:last-child]:hidden [&>span:first-child]:text-lg" />
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold">{item.title}</h4>
                        <p className="text-sm text-[#1A2E22]/60 mt-1">{item.date}</p>
                      </div>
                      <span className="text-sm font-bold text-[#2EB87A] bg-[#2EB87A]/10 px-2 py-1 rounded-lg">{item.points}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex flex-col justify-center">
          <div className="bg-gradient-to-br from-[#2EB87A]/20 to-[#FFB347]/20 rounded-2xl p-8 text-center border border-white shadow-sm">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Sparkles className="w-8 h-8 text-[#FFB347]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Share Your Impact</h3>
            <p className="text-[#1A2E22]/70 mb-6 text-sm leading-relaxed">
              Create a beautiful AI-generated poster of your CSR journey to share with colleagues!
            </p>
            <button 
              onClick={() => onNavigate('poster')}
              className="w-full bg-gradient-to-r from-[#2EB87A] to-[#249663] text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate My Poster
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-40">
        <button 
          onClick={() => onNavigate('poster')}
          className="w-full bg-gradient-to-r from-[#2EB87A] to-[#249663] text-white py-3.5 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Generate My Poster
        </button>
      </div>
    </div>
  );
}

function ActivityListPage({ onNavigate }: { onNavigate: (page: any) => void }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Volunteer', 'Donation', 'Check-in', 'General'];

  const activities = [
    { title: "Spring Tree Planting Activity (春季植树活动)", type: "volunteer" as const, date: "Apr 15, 2026", participants: 45, image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800" },
    { title: "Beach Cleanup Drive", type: "volunteer" as const, date: "Apr 22, 2026", participants: 120, image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800" },
    { title: "Local School Book Donation", type: "donation" as const, date: "May 05, 2026", participants: 85, image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800" },
    { title: "Q2 Wellness Walk", type: "check-in" as const, date: "Jun 10, 2026", participants: 210, image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=800" },
    { title: "Senior Center Tech Help", type: "volunteer" as const, date: "Jul 12, 2026", participants: 15, image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=800" },
    { title: "Disaster Relief Fund", type: "donation" as const, date: "Ongoing", participants: 340, image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Explore Activities</h1>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A2E22]/40" />
          <input 
            type="text" 
            placeholder="Search activities..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-[#E5E7EB] focus:border-[#2EB87A] focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter 
                ? 'bg-[#2EB87A] text-white shadow-sm' 
                : 'bg-white text-[#1A2E22]/70 border border-gray-200 hover:border-[#2EB87A] hover:text-[#2EB87A]'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activities.map((activity, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
            <div className="h-48 overflow-hidden relative">
              <img src={activity.image} alt={activity.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute top-3 left-3">
                <Badge type={activity.type} className="bg-white/90 backdrop-blur-sm shadow-sm" />
              </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <h3 className="font-bold text-lg mb-3 line-clamp-2 leading-tight">{activity.title}</h3>
              <div className="mt-auto space-y-2 mb-5">
                <div className="flex items-center text-[#1A2E22]/60 text-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  {activity.date}
                </div>
                <div className="flex items-center text-[#1A2E22]/60 text-sm">
                  <Users className="w-4 h-4 mr-2" />
                  {activity.participants} participants
                </div>
              </div>
              <button 
                onClick={() => onNavigate('detail')}
                className="w-full py-2.5 rounded-xl border-2 border-[#E5E7EB] font-medium text-[#1A2E22] hover:border-[#2EB87A] hover:text-[#2EB87A] transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityDetailPage({ onNavigate }: { onNavigate: (page: any) => void }) {
  return (
    <div className="pb-24 md:pb-0">
      {/* Full-width cover image with rounded bottom corners */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 mb-8 relative h-64 md:h-96">
        <img 
          src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1600" 
          alt="Spring Tree Planting Activity" 
          className="w-full h-full object-cover rounded-b-3xl shadow-sm"
          referrerPolicy="no-referrer"
        />
        <button 
          onClick={() => onNavigate('list')}
          className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ChevronRight className="w-6 h-6 rotate-180 text-[#1A2E22]" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column: Details */}
        <div className="flex-1 space-y-8">
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge type="volunteer" />
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Environment
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">Spring Tree Planting Activity (春季植树活动)</h1>
            <p className="text-[#1A2E22]/70 text-lg leading-relaxed">
              Join us for our annual Spring Tree Planting event! We'll be working together to plant over 500 native saplings in the local community park. This is a great opportunity to give back to nature, meet colleagues from other departments, and enjoy a beautiful spring morning outdoors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
              <div className="w-10 h-10 bg-[#2EB87A]/10 rounded-xl flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-[#2EB87A]" />
              </div>
              <div>
                <p className="font-bold text-sm">Date & Time</p>
                <p className="text-[#1A2E22]/60 text-sm mt-0.5">April 15, 2026<br/>9:00 AM - 1:00 PM</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
              <div className="w-10 h-10 bg-[#2EB87A]/10 rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#2EB87A]" />
              </div>
              <div>
                <p className="font-bold text-sm">Location</p>
                <p className="text-[#1A2E22]/60 text-sm mt-0.5">Riverside Community Park<br/>Meeting point: South Gate</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
              <div className="w-10 h-10 bg-[#2EB87A]/10 rounded-xl flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[#2EB87A]" />
              </div>
              <div>
                <p className="font-bold text-sm">Participants</p>
                <p className="text-[#1A2E22]/60 text-sm mt-0.5">45 registered<br/>(50 capacity)</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
              <div className="w-10 h-10 bg-[#2EB87A]/10 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-[#2EB87A]" />
              </div>
              <div>
                <p className="font-bold text-sm">Volunteer Hours</p>
                <p className="text-[#1A2E22]/60 text-sm mt-0.5">4 hours credited<br/>upon check-in</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">What to bring</h2>
            <ul className="list-disc list-inside space-y-2 text-[#1A2E22]/70 leading-relaxed">
              <li>Comfortable outdoor clothing that you don't mind getting dirty</li>
              <li>Sturdy closed-toe shoes or boots</li>
              <li>Reusable water bottle</li>
              <li>Sunscreen and a hat</li>
            </ul>
            <div className="mt-4 bg-[#FFB347]/10 p-4 rounded-xl flex gap-3 text-sm text-[#1A2E22]/80">
              <Info className="w-5 h-5 text-[#FFB347] shrink-0" />
              <p>Gloves, shovels, and all planting materials will be provided by the CSR team. Lunch will be served at 12:30 PM.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Registration Card (Desktop) */}
        <div className="hidden md:block w-96 shrink-0">
          <div className="sticky top-24 bg-white p-6 rounded-2xl border border-gray-100 shadow-md">
            <h3 className="text-xl font-bold mb-2">Ready to join?</h3>
            <p className="text-[#1A2E22]/60 text-sm mb-6">Only 5 spots left! Secure your place and volunteer kit.</p>
            
            <div className="space-y-4 mb-6">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#1A2E22]">Optional Donation Amount ($)</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#1A2E22]">Message to Organizer</label>
                <textarea 
                  rows={2}
                  placeholder="Any dietary restrictions or notes?"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm resize-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full bg-[#2EB87A] text-white py-3.5 rounded-xl font-bold hover:bg-[#2EB87A]/90 transition-colors shadow-sm">
                Register Now
              </button>
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-[#1A2E22]/40 text-xs uppercase font-bold">Or</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
              <button 
                onClick={() => onNavigate('chat')}
                className="w-full bg-white text-[#2EB87A] border-2 border-[#2EB87A] py-3.5 rounded-xl font-bold hover:bg-[#2EB87A]/5 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                AI Chat Registration ✨
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-40 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button className="flex-1 bg-[#2EB87A] text-white py-3.5 rounded-xl font-bold shadow-sm">
          Register
        </button>
        <button 
          onClick={() => onNavigate('chat')}
          className="flex-1 bg-white text-[#2EB87A] border-2 border-[#2EB87A] py-3.5 rounded-xl font-bold flex items-center justify-center gap-1.5"
        >
          <MessageSquare className="w-4 h-4" />
          AI Chat ✨
        </button>
      </div>
    </div>
  );
}

function AIChatRegistrationPage({ onNavigate }: { onNavigate: (page: any) => void }) {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hi there! 👋 I see you\'re interested in the Spring Tree Planting activity. I can help you register and answer any questions you might have. To start, do you have any dietary restrictions for lunch?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      if (newMessages.length === 2) {
        setMessages(prev => [...prev, { role: 'ai', content: 'Got it! I\'ve noted that down. Would you like to make an optional donation to the local park conservancy? If so, just let me know the amount.' }]);
      } else if (newMessages.length === 4) {
        setMessages(prev => [...prev, { role: 'ai', content: 'Perfect. You\'re all set! 🎉 I\'ve registered you for the Spring Tree Planting activity. You\'ll receive a calendar invite shortly. Would you like to create a fun poster to share with your team?' }]);
      }
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('detail')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#1A2E22]" />
          </button>
          <div>
            <h2 className="font-bold text-[#1A2E22] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2EB87A]" />
              AI Registration Assistant
            </h2>
            <p className="text-xs text-[#1A2E22]/60">Spring Tree Planting Activity</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#F7FAF8]/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-[#2EB87A]/10'}`}>
                {msg.role === 'user' ? (
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="User" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <Sparkles className="w-4 h-4 text-[#2EB87A]" />
                )}
              </div>
              <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-[#2EB87A] text-white rounded-tr-sm' : 'bg-white border border-gray-100 shadow-sm text-[#1A2E22] rounded-tl-sm'}`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                {msg.role === 'ai' && messages.length >= 5 && idx === messages.length - 1 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button 
                      onClick={() => onNavigate('poster')}
                      className="px-4 py-2 bg-[#FFB347]/10 text-[#FFB347] hover:bg-[#FFB347]/20 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Create Poster
                    </button>
                    <button 
                      onClick={() => onNavigate('home')}
                      className="px-4 py-2 bg-gray-100 text-[#1A2E22] hover:bg-gray-200 rounded-xl text-sm font-bold transition-colors"
                    >
                      Back to Home
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2 max-w-4xl mx-auto relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#2EB87A] focus:bg-white focus:outline-none transition-all text-sm"
            disabled={messages.length >= 5}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || messages.length >= 5}
            className="absolute right-2 p-2 bg-[#2EB87A] text-white rounded-xl hover:bg-[#2EB87A]/90 disabled:opacity-50 disabled:hover:bg-[#2EB87A] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AIPosterStudioPage({ onNavigate }: { onNavigate: (page: any) => void }) {
  const [prompt, setPrompt] = useState('A vibrant, cartoon-style illustration of a diverse group of people planting a small tree in a sunny park, with a cute dog watching.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      setGeneratedImage('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800');
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => onNavigate('chat')}
          className="p-2 bg-white hover:bg-gray-50 rounded-full shadow-sm transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#1A2E22]" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A2E22] flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#2EB87A]" />
            AI Poster Studio
          </h1>
          <p className="text-[#1A2E22]/60 mt-1">Create a unique poster to share your participation!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Controls */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-lg mb-4">1. Describe your poster</h2>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#2EB87A] focus:bg-white focus:outline-none transition-all text-sm resize-none mb-4"
              placeholder="E.g., A watercolor painting of a forest..."
            />
            
            <h2 className="font-bold text-lg mb-4 mt-6">2. Choose a style</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {['Cartoon', 'Watercolor', '3D Render', 'Minimalist', 'Pop Art', 'Realistic'].map((style, i) => (
                <button 
                  key={style}
                  className={`py-2 px-3 rounded-xl text-sm font-medium border-2 transition-colors ${i === 0 ? 'border-[#2EB87A] bg-[#2EB87A]/5 text-[#2EB87A]' : 'border-gray-100 hover:border-gray-200 text-[#1A2E22]/70'}`}
                >
                  {style}
                </button>
              ))}
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3.5 bg-[#2EB87A] text-white rounded-xl font-bold hover:bg-[#2EB87A]/90 disabled:opacity-70 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Poster
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
          <h2 className="font-bold text-lg mb-4">Preview</h2>
          <div className="flex-1 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden min-h-[400px] relative">
            {generatedImage ? (
              <div className="relative w-full h-full group">
                <img src={generatedImage} alt="Generated Poster" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                {/* Overlay text simulating a poster */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 text-white">
                  <p className="text-sm font-bold text-[#FFB347] mb-1 uppercase tracking-wider">I'm joining!</p>
                  <h3 className="text-2xl font-bold mb-2">Spring Tree Planting</h3>
                  <p className="text-white/80 text-sm">April 15, 2026 • Riverside Park</p>
                </div>
              </div>
            ) : (
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-[#1A2E22]/50 text-sm">Your generated poster will appear here.</p>
              </div>
            )}
          </div>

          {generatedImage && (
            <div className="flex gap-3 mt-6">
              <button className="flex-1 py-3 bg-gray-100 text-[#1A2E22] rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </button>
              <button className="flex-1 py-3 bg-[#FFB347] text-white rounded-xl font-bold hover:bg-[#FFB347]/90 transition-colors flex items-center justify-center gap-2 shadow-sm">
                <Share2 className="w-4 h-4" />
                Share to Feed
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
