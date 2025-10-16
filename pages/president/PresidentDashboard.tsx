import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { API_ENDPOINTS } from '../../src/config/config';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';

interface WardRow { ward: number; councillor: { id: string; name: string; email: string }; population: number | null; totalComplaints: number }
interface WelfareDetail { schemeId: string; schemeTitle: string; category: string; applicants: number; approved: number; rejected: number }

type PresTab = 'overview' | 'welfare' | 'announce' | 'events' | 'esabha';

const sidebarItems = [
  { id: 'overview', name: 'Ward Overview', icon: 'fa-university', path: '/president' },
  { id: 'welfare', name: 'Welfare Statistics', icon: 'fa-chart-pie', path: '/president' },
  { id: 'announce', name: 'Announcements', icon: 'fa-bullhorn', path: '/president' },
  { id: 'events', name: 'Events', icon: 'fa-calendar-alt', path: '/president' },
  { id: 'esabha', name: 'E-Sabha', icon: 'fa-video', path: '/president' }
];

const PresidentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PresTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [wards, setWards] = useState<WardRow[]>([]);
  const [welfare, setWelfare] = useState<{ totalSchemes: number; approvalRate: number; distribution: Record<string, number>; details: WelfareDetail[] } | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annDesc, setAnnDesc] = useState('');
  const [annAudience, setAnnAudience] = useState<'citizens' | 'councillors' | 'all'>('all');
  const [annList, setAnnList] = useState<any[]>([]);
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDesc, setEvtDesc] = useState('');
  const [evtTime, setEvtTime] = useState('');
  const [evtLocation, setEvtLocation] = useState('');
  const [evtList, setEvtList] = useState<any[]>([]);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);

  const token = useMemo(() => localStorage.getItem('token'), []);
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }), [token]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [w1, w2, a1, e1] = await Promise.all([
          fetch(API_ENDPOINTS.PRESIDENT_WARDS, { headers: authHeaders }),
          fetch(API_ENDPOINTS.PRESIDENT_WELFARE, { headers: authHeaders }),
          fetch(API_ENDPOINTS.PRESIDENT_ANNOUNCEMENTS, { headers: authHeaders }),
          fetch(API_ENDPOINTS.PRESIDENT_EVENTS, { headers: authHeaders })
        ]);
        const wardsJson = await w1.json();
        const welfareJson = await w2.json();
        const annJson = await a1.json();
        const evJson = await e1.json();
        if (wardsJson.success) setWards(wardsJson.wards || []);
        if (welfareJson.success) setWelfare(welfareJson);
        if (annJson.success) setAnnList(annJson.items || []);
        if (evJson.success) setEvtList(evJson.items || []);
      } catch (_) {}
    };
    fetchAll();
  }, [authHeaders]);


  const sendAnnouncement = async () => {
    if (!annTitle.trim() || !annDesc.trim()) return;
    const res = await fetch(API_ENDPOINTS.PRESIDENT_ANNOUNCEMENTS, { method: 'POST', headers: authHeaders, body: JSON.stringify({ title: annTitle, description: annDesc, audience: annAudience }) });
    if (res.ok) {
      const { item } = await res.json();
      setAnnList(prev => [item, ...prev]);
      setAnnTitle(''); setAnnDesc('');
    }
  };
  const deleteAnnouncement = async (id: string) => {
    const res = await fetch(`${API_ENDPOINTS.PRESIDENT_ANNOUNCEMENTS}/${id}`, { method: 'DELETE', headers: authHeaders });
    if (res.ok) setAnnList(prev => prev.filter(a => a._id !== id));
  };

  const createEvent = async () => {
    if (!evtTitle.trim() || !evtDesc.trim() || !evtTime.trim()) return;
    const res = await fetch(API_ENDPOINTS.PRESIDENT_EVENTS, { method: 'POST', headers: authHeaders, body: JSON.stringify({ title: evtTitle, description: evtDesc, time: evtTime, location: evtLocation, audience: annAudience }) });
    if (res.ok) {
      const { item } = await res.json();
      setEvtList(prev => [...prev, item]);
      setEvtTitle(''); setEvtDesc(''); setEvtTime(''); setEvtLocation('');
    }
  };
  const deleteEvent = async (id: string) => {
    const res = await fetch(`${API_ENDPOINTS.PRESIDENT_EVENTS}/${id}`, { method: 'DELETE', headers: authHeaders });
    if (res.ok) setEvtList(prev => prev.filter(e => e._id !== id));
  };


  const startMeeting = async () => {
    setCreatingMeeting(true);
    try {
      const res = await fetch(API_ENDPOINTS.PRESIDENT_VIDEO, { method: 'POST', headers: authHeaders });
      if (res.ok) { const data = await res.json(); setMeetingUrl(data.url); }
    } finally { setCreatingMeeting(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex">
        <Sidebar items={sidebarItems} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab={activeTab} onItemClick={(id) => setActiveTab(id as PresTab)} />
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="text-gray-700 text-sm">Erumeli Panchayath • President Control Centre</div>
          </div>
          {/* Top Nav mirroring sidebar */}
          <div className="mb-6">
            <nav className="flex flex-wrap gap-2">
              {sidebarItems.map(it => (
                <button key={it.id} onClick={() => setActiveTab(it.id as PresTab)} className={`px-3 py-2 rounded-lg text-sm font-medium border ${activeTab===it.id ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'}`}>
                  <i className={`fas ${it.icon} mr-2`}></i>{it.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Stats quick */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="text-sm text-gray-600">Total Wards</div>
              <div className="text-3xl font-bold text-gray-900">23</div>
              <div className="text-xs text-gray-500 mt-1">Loaded: {wards.length || 0}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="text-sm text-gray-600">Total Schemes</div>
              <div className="text-3xl font-bold text-gray-900">{welfare?.totalSchemes ?? '—'}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="text-sm text-gray-600">Approval Rate</div>
              <div className="text-3xl font-bold text-gray-900">{welfare ? `${(welfare.approvalRate*100).toFixed(1)}%` : '—'}</div>
            </div>
          </div>

          {/* Tabs content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              {activeTab === 'overview' && (
                <div>
                  <h3 className="font-bold text-xl text-gray-800 mb-4">Ward Overview</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-4 py-2 text-left">Ward</th>
                          <th className="px-4 py-2 text-left">Councillor</th>
                          <th className="px-4 py-2 text-left">Population</th>
                          <th className="px-4 py-2 text-left">Complaints</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {wards.map(w => (
                          <tr key={w.ward}>
                            <td className="px-4 py-2 font-semibold">{w.ward}</td>
                            <td className="px-4 py-2">{w.councillor?.name || '-'} ({w.councillor?.email || '-'})</td>
                            <td className="px-4 py-2">{w.population ?? '-'}</td>
                            <td className="px-4 py-2">{w.totalComplaints}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'welfare' && (
                <div>
                  <h3 className="font-bold text-xl text-gray-800 mb-4">Welfare Statistics</h3>
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="p-4 rounded border bg-white">
                      <div className="font-semibold mb-2">Complaints by Ward</div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={wards.map(w=>({ ward: String(w.ward), complaints: w.totalComplaints }))} margin={{top:10,right:10,left:0,bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="ward" tick={{fontSize:12}} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="complaints" fill="#2563EB" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="p-4 rounded border bg-white">
                      <div className="font-semibold mb-2">Scheme Distribution</div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie dataKey="value" data={Object.entries(welfare?.distribution||{}).map(([k,v])=>({ name:k, value: v as number }))} outerRadius={90} label>
                              {Object.keys(welfare?.distribution||{}).map((_,i)=> <Cell key={i} fill={["#2563EB","#10B981","#F59E0B","#EF4444","#8B5CF6","#06B6D4","#84CC16"][i%7]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="p-4 rounded border bg-white">
                      <div className="font-semibold mb-2">Key Numbers</div>
                      <ul className="text-sm text-gray-700 space-y-2">
                        <li><span className="text-gray-500">Total Schemes:</span> <span className="font-semibold">{welfare?.totalSchemes ?? '-'}</span></li>
                        <li><span className="text-gray-500">Approval Rate:</span> <span className="font-semibold">{welfare ? `${(welfare.approvalRate*100).toFixed(1)}%` : '—'}</span></li>
                        <li><span className="text-gray-500">Total Complaints:</span> <span className="font-semibold">{wards.reduce((s,w)=>s+(w.totalComplaints||0),0)}</span></li>
                        <li><span className="text-gray-500">Total Population:</span> <span className="font-semibold">{wards.reduce((s,w)=>s+(w.population||0),0).toLocaleString()}</span></li>
                      </ul>
                    </div>
                  </div>
                  <div className="overflow-x-auto mt-4">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-4 py-2 text-left">Scheme</th>
                          <th className="px-4 py-2 text-left">Applicants</th>
                          <th className="px-4 py-2 text-left">Approved</th>
                          <th className="px-4 py-2 text-left">Rejected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {welfare?.details?.map(d => (
                          <tr key={d.schemeId}>
                            <td className="px-4 py-2">{d.schemeTitle}</td>
                            <td className="px-4 py-2">{d.applicants}</td>
                            <td className="px-4 py-2">{d.approved}</td>
                            <td className="px-4 py-2">{d.rejected}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'announce' && (
                <div>
                  <h3 className="font-bold text-xl text-gray-800 mb-4">Announcements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 space-y-3">
                      <input value={annTitle} onChange={e=>setAnnTitle(e.target.value)} placeholder="Title" className="w-full border rounded-lg px-3 py-2"/>
                      <textarea value={annDesc} onChange={e=>setAnnDesc(e.target.value)} placeholder="Description" className="w-full border rounded-lg px-3 py-2 h-28"/>
                      <select value={annAudience} onChange={e=>setAnnAudience(e.target.value as any)} className="w-full border rounded-lg px-3 py-2">
                        <option value="all">All</option>
                        <option value="citizens">Citizens</option>
                        <option value="councillors">Councillors</option>
                      </select>
                      <button onClick={sendAnnouncement} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Publish</button>
                    </div>
                    <div className="md:col-span-2">
                      <div className="space-y-3">
                        {annList.map(a => (
                          <div key={a._id} className="border rounded-lg p-4 flex items-start justify-between">
                            <div>
                              <div className="font-semibold">{a.title}</div>
                              <div className="text-sm text-gray-600">{a.description}</div>
                              <div className="text-xs text-gray-500 mt-1">Audience: {a.audience}</div>
                            </div>
                            <button onClick={()=>deleteAnnouncement(a._id)} className="text-red-600 hover:underline text-sm">Delete</button>
                          </div>
                        ))}
                        {annList.length === 0 && <div className="text-sm text-gray-500">No announcements yet.</div>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'events' && (
                <div>
                  <h3 className="font-bold text-xl text-gray-800 mb-4">Events</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 space-y-3">
                      <input value={evtTitle} onChange={e=>setEvtTitle(e.target.value)} placeholder="Title" className="w-full border rounded-lg px-3 py-2"/>
                      <textarea value={evtDesc} onChange={e=>setEvtDesc(e.target.value)} placeholder="Description" className="w-full border rounded-lg px-3 py-2 h-28"/>
                      <input type="datetime-local" value={evtTime} onChange={e=>setEvtTime(e.target.value)} className="w-full border rounded-lg px-3 py-2"/>
                      <select value={annAudience} onChange={e=>setAnnAudience(e.target.value as any)} className="w-full border rounded-lg px-3 py-2">
                        <option value="all">All</option>
                        <option value="citizens">Citizens</option>
                        <option value="councillors">Councillors</option>
                      </select>
                      <input value={evtLocation} onChange={e=>setEvtLocation(e.target.value)} placeholder="Location" className="w-full border rounded-lg px-3 py-2"/>
                      <button onClick={createEvent} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Create</button>
                    </div>
                    <div className="md:col-span-2">
                      <div className="space-y-3">
                        {evtList.map(e => (
                          <div key={e._id} className="border rounded-lg p-4 flex items-start justify-between">
                            <div>
                              <div className="font-semibold">{e.title}</div>
                              <div className="text-sm text-gray-600">{e.description}</div>
                              <div className="text-xs text-gray-500 mt-1">{new Date(e.time).toLocaleString()} • {e.location}</div>
                            </div>
                            <button onClick={()=>deleteEvent(e._id)} className="text-red-600 hover:underline text-sm">Delete</button>
                          </div>
                        ))}
                        {evtList.length === 0 && <div className="text-sm text-gray-500">No events yet.</div>}
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {activeTab === 'esabha' && (
                <div>
                  <h3 className="font-bold text-xl text-gray-800 mb-4">E-Sabha</h3>
                  <p className="text-gray-600 mb-3">Generate a meeting link and share with councillors. Jitsi is used.</p>
                  <button onClick={startMeeting} disabled={creatingMeeting} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                    {creatingMeeting ? 'Creating…' : 'Start Sabha Meeting'}
                  </button>
                  {meetingUrl && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-800">
                      Meeting Link: <a href={meetingUrl} target="_blank" rel="noreferrer" className="underline">{meetingUrl}</a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PresidentDashboard;

