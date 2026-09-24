import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { DashboardView } from './components/modules/DashboardView.tsx';
import { SystemAdminView } from './components/modules/SystemAdminView.tsx';
import { ProjectsView } from './components/modules/ProjectsView.tsx';
import { VisualInventoryView } from './components/modules/VisualInventoryView.tsx';
import { LeadsCrmView } from './components/modules/LeadsCrmView.tsx';
import { SiteVisitsView } from './components/modules/SiteVisitsView.tsx';
import { CustomersView } from './components/modules/CustomersView.tsx';
import { BookingsView } from './components/modules/BookingsView.tsx';
import { PaymentsView } from './components/modules/PaymentsView.tsx';
import { ChannelPartnersView } from './components/modules/ChannelPartnersView.tsx';
import { ComplaintsView } from './components/modules/ComplaintsView.tsx';
import { TasksView } from './components/modules/TasksView.tsx';
import { DocumentsView } from './components/modules/DocumentsView.tsx';
import { ReportsView } from './components/modules/ReportsView.tsx';
import { OrganizationSettingsView } from './components/modules/OrganizationSettingsView.tsx';
import { MobileFooterNav } from './components/mobile/MobileFooterNav.tsx';
import { apiFetch } from './services/apiClient.ts';
import { CurrentUser, Organization, OrganizationSettings } from './types/index.ts';

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [currentSettings, setCurrentSettings] = useState<OrganizationSettings | null>(null);
  const [personas, setPersonas] = useState<any[]>([]);
  const [currentModule, setCurrentModule] = useState<string>('dashboard');
  const [navParams, setNavParams] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const [session, personaList] = await Promise.all([
        apiFetch('/api/auth/me'),
        apiFetch('/api/auth/personas'),
      ]);
      setCurrentUser(session.user);
      setCurrentOrg(session.organization);
      setCurrentSettings(session.settings);
      setPersonas(personaList);
    } catch (err) {
      console.error('Failed to initialize session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleSelectPersona = (uid: string) => {
    localStorage.setItem('auraestate_active_persona', uid);
    sessionStorage.removeItem('auraestate_id_token');
    fetchSession();
  };

  const handleNavigate = (module: string, params?: any) => {
    setCurrentModule(module);
    setNavParams(params || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderModuleContent = () => {
    switch (currentModule) {
      case 'dashboard':
        return (
          <DashboardView
            user={currentUser}
            organization={currentOrg}
            onNavigate={handleNavigate}
          />
        );
      case 'system-admin':
        return (
          <SystemAdminView
            user={currentUser}
            onSelectTenant={(orgId) => {
              fetchSession();
            }}
          />
        );
      case 'projects':
        return <ProjectsView user={currentUser} onNavigate={handleNavigate} />;
      case 'inventory':
        return <VisualInventoryView user={currentUser} onNavigate={handleNavigate} />;
      case 'crm':
        return <LeadsCrmView user={currentUser} onNavigate={handleNavigate} />;
      case 'site-visits':
        return <SiteVisitsView user={currentUser} />;
      case 'customers':
        return <CustomersView user={currentUser} onNavigate={handleNavigate} />;
      case 'bookings':
        return (
          <BookingsView
            user={currentUser}
            params={navParams}
            onNavigate={handleNavigate}
          />
        );
      case 'payments':
        return (
          <PaymentsView
            user={currentUser}
            organization={currentOrg}
          />
        );
      case 'channel-partners':
        return <ChannelPartnersView user={currentUser} />;
      case 'complaints':
        return <ComplaintsView user={currentUser} />;
      case 'tasks':
        return <TasksView user={currentUser} />;
      case 'documents':
        return <DocumentsView user={currentUser} />;
      case 'reports':
        return <ReportsView user={currentUser} />;
      case 'settings':
        return (
          <OrganizationSettingsView
            user={currentUser}
            organization={currentOrg}
            onRefresh={fetchSession}
          />
        );
      default:
        return (
          <DashboardView
            user={currentUser}
            organization={currentOrg}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  if (loading && !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F6F1]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
          <h2 className="text-sm font-bold text-stone-800">Connecting to Cloud SQL (asia-southeast1)...</h2>
          <p className="text-xs text-stone-500">Initializing multi-tenant ERP session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-stone-900 flex flex-col antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* Top Header Bar */}
      <Header
        user={currentUser}
        organization={currentOrg}
        settings={currentSettings}
        personas={personas}
        onSelectPersona={handleSelectPersona}
        onNavigate={handleNavigate}
        onRefreshUser={fetchSession}
        isMobileMode={isMobileMode}
        onToggleMobileMode={() => setIsMobileMode(!isMobileMode)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Body with Sidebar + Content */}
      <div
        className={`flex flex-1 overflow-hidden ${
          isMobileMode ? 'justify-center bg-stone-900/15 py-2 sm:py-4' : ''
        }`}
      >
        {/* Desktop Sidebar (hidden when in simulated mobile view or closed) */}
        {!isMobileMode && (
          <Sidebar
            currentModule={currentModule}
            onSelectModule={handleNavigate}
            user={currentUser}
            isOpenMobile={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Dynamic Content View Area */}
        <main
          className={`flex-1 overflow-y-auto ${
            isMobileMode
              ? 'max-w-md w-full bg-[#FDFBF7] min-h-[820px] rounded-3xl shadow-2xl border-2 border-stone-300/80 pb-24 p-3.5'
              : 'p-4 sm:p-6 lg:p-8 pb-24 md:pb-8'
          }`}
        >
          <div className={isMobileMode ? 'w-full' : 'mx-auto max-w-7xl'}>
            {renderModuleContent()}
          </div>
        </main>
      </div>

      {/* Android Mobile Bottom Footer Navigation Menu */}
      <MobileFooterNav
        currentModule={currentModule}
        onNavigate={handleNavigate}
        user={currentUser}
        organization={currentOrg}
        isMobileMode={isMobileMode}
      />
    </div>
  );
}
