import React, { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  Compass,
  FileCheck2,
  Menu,
  Plus,
  Calendar,
  Users,
  CreditCard,
  Building,
  CheckSquare,
  Headphones,
  BarChart3,
  Settings,
  X,
  Shield,
  FolderOpen,
} from 'lucide-react';
import { CurrentUser, Organization } from '../../types/index.ts';

interface MobileFooterNavProps {
  currentModule: string;
  onNavigate: (module: string) => void;
  user: CurrentUser | null;
  organization: Organization | null;
  onOpenQuickAction?: (action: 'lead' | 'booking' | 'visit') => void;
  isMobileMode?: boolean;
}

export const MobileFooterNav: React.FC<MobileFooterNavProps> = ({
  currentModule,
  onNavigate,
  user,
  organization,
  onOpenQuickAction,
  isMobileMode,
}) => {
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const [showFabDial, setShowFabDial] = useState(false);

  const mainTabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Layers },
    { id: 'crm', label: 'Leads', icon: Compass },
    { id: 'bookings', label: 'Bookings', icon: FileCheck2 },
  ];

  const secondaryModules = [
    { id: 'projects', label: 'Projects & Developments', icon: Building, desc: 'Towers, phases, RERA info' },
    { id: 'site-visits', label: 'Site Visits', icon: Calendar, desc: 'Tour schedules & cab logistics' },
    { id: 'customers', label: 'Customers 360°', icon: Users, desc: 'Allottee files & KYC' },
    { id: 'payments', label: 'Payments & Receipts', icon: CreditCard, desc: 'Milestone collections & tax vouchers' },
    { id: 'channel-partners', label: 'Channel Partners', icon: Users, desc: 'Brokers & payout slabs' },
    { id: 'complaints', label: 'Service & Snags', icon: Headphones, desc: 'Customer maintenance tickets' },
    { id: 'tasks', label: 'Tasks & Follow-ups', icon: CheckSquare, desc: 'Daily sales priorities' },
    { id: 'documents', label: 'Document Center', icon: FolderOpen, desc: 'Agreements, NOCs & brochures' },
    { id: 'reports', label: 'Reports & Exports', icon: BarChart3, desc: 'Sales & collection CSVs' },
    { id: 'settings', label: 'Organization Settings', icon: Settings, desc: 'Prefixes, taxes & branding' },
    ...(user?.isSystemAdmin
      ? [{ id: 'system-admin', label: 'System Admin SaaS', icon: Shield, desc: 'Manage all tenant builders' }]
      : []),
  ];

  const handleTabClick = (tabId: string) => {
    setShowMoreDrawer(false);
    setShowFabDial(false);
    onNavigate(tabId);
  };

  return (
    <>
      {/* Expandable Android Speed-Dial FAB (Floating Action Button) */}
      <div
        className={`fixed z-40 ${
          isMobileMode
            ? 'bottom-20 right-4 sm:right-auto sm:left-1/2 sm:ml-36'
            : 'bottom-20 right-4 md:hidden'
        }`}
      >
        {showFabDial && (
          <div className="mb-3 flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              onClick={() => {
                setShowFabDial(false);
                onNavigate('crm');
              }}
              className="flex items-center gap-2 rounded-full bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs font-bold text-white shadow-xl active:scale-95 transition"
            >
              <span>+ New Lead</span>
              <div className="rounded-full bg-purple-500/20 p-1 text-purple-400">
                <Compass className="h-3.5 w-3.5" />
              </div>
            </button>

            <button
              onClick={() => {
                setShowFabDial(false);
                onNavigate('bookings');
              }}
              className="flex items-center gap-2 rounded-full bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs font-bold text-white shadow-xl active:scale-95 transition"
            >
              <span>+ New Booking</span>
              <div className="rounded-full bg-emerald-500/20 p-1 text-emerald-400">
                <FileCheck2 className="h-3.5 w-3.5" />
              </div>
            </button>

            <button
              onClick={() => {
                setShowFabDial(false);
                onNavigate('site-visits');
              }}
              className="flex items-center gap-2 rounded-full bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs font-bold text-white shadow-xl active:scale-95 transition"
            >
              <span>+ Book Site Visit</span>
              <div className="rounded-full bg-sky-500/20 p-1 text-sky-400">
                <Calendar className="h-3.5 w-3.5" />
              </div>
            </button>
          </div>
        )}

        <button
          onClick={() => setShowFabDial(!showFabDial)}
          className={`h-13 w-13 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-sky-600/30 transition active:scale-95 ${
            showFabDial ? 'rotate-45' : ''
          }`}
          title="Quick Actions"
        >
          <Plus className="h-6 w-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Android Bottom Navigation Bar (Footer Menu) */}
      <nav
        className={`fixed bottom-0 inset-x-0 z-40 bg-slate-900/98 backdrop-blur-xl border-t border-slate-800 text-slate-300 flex items-center justify-around h-16 px-1 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.3)] ${
          isMobileMode ? 'max-w-md mx-auto sm:rounded-t-2xl sm:border-x' : 'md:hidden'
        }`}
        aria-label="Mobile Navigation"
      >
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentModule === tab.id && !showMoreDrawer;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors ${
                isActive ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-6.5 rounded-full transition-all ${
                  isActive ? 'bg-sky-500/20 text-sky-400 scale-105' : ''
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}

        {/* More Menu Drawer Trigger */}
        <button
          onClick={() => setShowMoreDrawer(!showMoreDrawer)}
          className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors ${
            showMoreDrawer ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`flex items-center justify-center w-10 h-6.5 rounded-full transition-all ${
              showMoreDrawer ? 'bg-sky-500/20 text-sky-400 scale-105' : ''
            }`}
          >
            {showMoreDrawer ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">More</span>
        </button>
      </nav>

      {/* Full Android Material Bottom Sheet for "More" Menu */}
      {showMoreDrawer && (
        <div
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end ${
            isMobileMode ? '' : 'md:hidden'
          }`}
          onClick={() => setShowMoreDrawer(false)}
        >
          <div
            className={`bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[82vh] overflow-y-auto p-4 pb-20 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 ${
              isMobileMode ? 'max-w-md mx-auto w-full' : ''
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">All ERP Modules</h3>
                <p className="text-[11px] text-slate-400">
                  {organization?.companyName} • {user?.roleCode}
                </p>
              </div>
              <button
                onClick={() => setShowMoreDrawer(false)}
                className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {secondaryModules.map((item) => {
                const Icon = item.icon;
                const isActive = currentModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                      isActive
                        ? 'border-sky-500/50 bg-sky-500/10 text-white font-semibold'
                        : 'border-slate-800/80 bg-slate-950/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
