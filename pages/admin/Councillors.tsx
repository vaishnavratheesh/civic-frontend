import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import AdminTopNav from '../../components/AdminTopNav';
import Spinner from '../../components/Spinner';
import { getCouncillors } from '../../services/adminService';

interface Councillor {
  _id: string;
  name: string;
  email: string;
  ward: number;
}

const Councillors: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [councillors, setCouncillors] = useState<Councillor[]>([]);

  const adminSidebarItems = [
    { id: 'overview', name: 'Overview', icon: 'fa-tachometer-alt', path: '/admin' },
    { id: 'welfare-schemes', name: 'Welfare Schemes', icon: 'fa-hands-helping', path: '/admin/welfare-schemes' },
    { id: 'welfare-applications', name: 'Applications', icon: 'fa-file-alt', path: '/admin/welfare-applications' },
    { id: 'users', name: 'User Management', icon: 'fa-users', path: '/admin/users' },
    { id: 'grievances', name: 'Grievance Management', icon: 'fa-bullhorn', path: '/admin/grievances' },
    { id: 'councillors', name: 'Councillors', icon: 'fa-user-tie', path: '/admin/councillors' },
    { id: 'analytics', name: 'Analytics', icon: 'fa-chart-bar', path: '/admin/analytics' },
    { id: 'settings', name: 'Settings', icon: 'fa-cog', path: '/admin/settings' },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const list = await getCouncillors();
        setCouncillors(list || []);
      } catch (e) {
        console.error('Failed to fetch councillors', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar
        items={adminSidebarItems}
        onItemClick={(id) => navigate(adminSidebarItems.find(i => i.id === id)?.path || '/admin')}
        activeTab={'councillors'}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className={`flex-1 flex flex-col overflow-hidden ${isSidebarOpen ? 'ml-80' : 'ml-0'}`}>
        <Navbar onMenuClick={toggleSidebar} />
        <AdminTopNav activeId="councillors" />
        <div className="p-4 md:p-6">
          <h1 className="text-lg font-semibold text-gray-900 mb-4">Councillors</h1>
          {loading ? (
            <div className="py-10"><Spinner /></div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Email</th>
                      <th className="px-4 py-3 text-left font-medium">Ward</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {councillors.map(c => (
                      <tr key={c._id} className="text-gray-800">
                        <td className="px-4 py-3">{c.name}</td>
                        <td className="px-4 py-3">{c.email}</td>
                        <td className="px-4 py-3">{c.ward}</td>
                      </tr>
                    ))}
                    {councillors.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-gray-500" colSpan={3}>No councillors found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Councillors;