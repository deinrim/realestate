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
import { AndroidMobileView } from './components/mobile/AndroidMobileView.tsx';
import { AndroidDeviceModelModal } from './components/mobile/AndroidDeviceModelModal.tsx';
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
  const [showAndroidSimulator, setShowAndroidSimulator] = useState(false);
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
      case 'android-mobile':
        return (
          <div className="max-w-md mx-auto h-[820px] rounded-[38px] overflow-hidden shadow-2xl border-[8px] border-slate-900 ring-2 ring-slate-700/50">
            <AndroidMobileView
              user={currentUser}
              organization={currentOrg}
              onNavigate={handleNavigate}
            />
          </div>
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
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
          <h2 className="text-sm font-bold text-slate-800">Connecting to Cloud SQL (asia-southeast1)...</h2>
          <p className="text-xs text-slate-500">Initializing multi-tenant ERP session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased">
      {/* Top Navigation */}
      <Header
        user={currentUser}
        organization={currentOrg}
        settings={currentSettings}
        personas={personas}
        onSelectPersona={handleSelectPersona}
        onNavigate={handleNavigate}
        onRefreshUser={fetchSession}
        onOpenAndroidSimulator={() => setShowAndroidSimulator(true)}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentModule={currentModule}
          onSelectModule={handleNavigate}
          user={currentUser}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {renderModuleContent()}
          </div>
        </main>
      </div>

      {/* Interactive Physical Android Hardware Model Modal Simulator */}
      <AndroidDeviceModelModal
        isOpen={showAndroidSimulator}
        onClose={() => setShowAndroidSimulator(false)}
        user={currentUser}
        organization={currentOrg}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
