import React from 'react';
import { useNavigate } from 'react-router-dom';

export type AdminTopNavItem = {
  id: string;
  name: string;
  path: string;
  icon?: string;
};

const DEFAULT_ITEMS: AdminTopNavItem[] = [
  { id: 'overview', name: 'Overview', path: '/admin', icon: 'fa-tachometer-alt' },
  { id: 'welfare-schemes', name: 'Welfare Schemes', path: '/admin/welfare-schemes', icon: 'fa-hands-helping' },
  { id: 'welfare-applications', name: 'Applications', path: '/admin/welfare-applications', icon: 'fa-file-alt' },
  { id: 'users', name: 'Users', path: '/admin/users', icon: 'fa-users' },
  { id: 'grievances', name: 'Grievances', path: '/admin/grievances', icon: 'fa-bullhorn' },
  { id: 'councillors', name: 'Councillors', path: '/admin/councillors', icon: 'fa-user-tie' },
  { id: 'analytics', name: 'Analytics', path: '/admin/analytics', icon: 'fa-chart-bar' },
  { id: 'settings', name: 'Settings', path: '/admin/settings', icon: 'fa-cog' }
];

const AdminTopNav: React.FC<{ activeId?: string; items?: AdminTopNavItem[] }> = ({ activeId = 'overview', items = DEFAULT_ITEMS }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white border-b border-gray-200">
      <nav className="max-w-full px-4 md:px-6">
        <ul className="flex flex-wrap gap-1 py-2">
          {items.map(item => (
            <li key={item.id}>
              <button
                onClick={() => navigate(item.path)}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                  activeId === item.id ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-current={activeId === item.id ? 'page' : undefined}
              >
                {item.icon ? <i className={`fas ${item.icon} text-xs`}></i> : null}
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default AdminTopNav;