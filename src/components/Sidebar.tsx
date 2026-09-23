import React from 'react';
import {
  LayoutDashboard,
  Building,
  Layers,
  Users,
  Calendar,
  CreditCard,
  UserCheck,
  Headphones,
  CheckSquare,
  FolderOpen,
  BarChart3,
  Settings,
  ShieldAlert,
  Compass,
  FileCheck2,
  Smartphone,
} from 'lucide-react';
import { CurrentUser } from '../types/index.ts';

interface SidebarProps {
  currentModule: string;
  onSelectModule: (module: string) => void;
  user: CurrentUser | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  user,
  isOpenMobile,
  onCloseMobile,
}) => {
  const isSysAdmin = user?.isSystemAdmin;

  const menuGroups = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ...(isSysAdmin
          ? [{ id: 'system-admin', label: 'System Admin SaaS', icon: ShieldAlert, highlight: true }]
          : []),
      ],
    },
    {
      title: 'Property & Inventory',
      items: [
        { id: 'projects', label: 'Projects & Phases', icon: Building },
        { id: 'inventory', label: 'Visual Inventory', icon: Layers, badge: 'Live' },
      ],
    },
    {
      title: 'Sales & CRM',
      items: [
        { id: 'crm', label: 'CRM & Leads', icon: Compass },
        { id: 'site-visits', label: 'Site Visits', icon: Calendar },
        { id: 'bookings', label: 'Bookings & Sales', icon: FileCheck2 },
        { id: 'customers', label: 'Customers 360°', icon: Users },
      ],
    },
    {
      title: 'Financials & Network',
      items: [
        { id: 'payments', label: 'Payments & Receipts', icon: CreditCard },
        { id: 'channel-partners', label: 'Channel Partners', icon: UserCheck },
      ],
    },
    {
      title: 'Operations & Service',
      items: [
        { id: 'complaints', label: 'Service Complaints', icon: Headphones },
        { id: 'tasks', label: 'Tasks & Follow-ups', icon: CheckSquare },
        { id: 'documents', label: 'Document Center', icon: FolderOpen },
      ],
    },
    {
      title: 'Administration',
      items: [
        { id: 'reports', label: 'Reports & Exports', icon: BarChart3 },
        { id: 'settings', label: 'Organization Settings', icon: Settings },
      ],
    },
  ];

  const handleItemClick = (id: string) => {
    onSelectModule(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col justify-between overflow-y-auto px-3 py-4">
          <div className="space-y-6">
            {menuGroups.map((group, idx) => (
              <div key={idx}>
                <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.title}
                </div>
                <nav className="mt-1 space-y-0.5">
                  {group.items.map((item: any) => {
                    const Icon = item.icon;
                    const active = currentModule === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                          active
                            ? item.highlight
                              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                              : 'bg-sky-50 text-sky-700 font-semibold'
                            : item.highlight
                            ? 'text-indigo-600 hover:bg-indigo-50 font-medium'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`h-4 w-4 shrink-0 transition ${
                              active
                                ? item.highlight
                                  ? 'text-white'
                                  : 'text-sky-600'
                                : item.highlight
                                ? 'text-indigo-600'
                                : 'text-slate-400 group-hover:text-slate-600'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              active
                                ? 'bg-sky-200 text-sky-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* User profile footer card in sidebar */}
          <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800">{user?.name}</p>
                <p className="truncate text-[10px] text-slate-500 capitalize">
                  {user?.roleCode.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
