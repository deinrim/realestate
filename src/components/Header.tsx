import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Search,
  UserCheck,
  LogOut,
  Bell,
  Shield,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  ChevronDown,
  Smartphone,
  Download,
} from 'lucide-react';
import { CurrentUser, Organization, OrganizationSettings } from '../types/index.ts';
import { apiFetch } from '../services/apiClient.ts';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

interface HeaderProps {
  user: CurrentUser | null;
  organization: Organization | null;
  settings: OrganizationSettings | null;
  personas: any[];
  onSelectPersona: (uid: string) => void;
  onNavigate: (module: string) => void;
  onRefreshUser: () => void;
  onOpenAndroidSimulator?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  organization,
  personas,
  onSelectPersona,
  onNavigate,
  onRefreshUser,
  onOpenAndroidSimulator,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    leads: any[];
    customers: any[];
    projects: any[];
    units: any[];
    bookings: any[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiFetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      sessionStorage.setItem('auraestate_id_token', token);
      localStorage.removeItem('auraestate_active_persona');
      onRefreshUser();
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      alert('Google Sign-In note: In iframe mode, ensure popups are allowed or use the Persona Switcher.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('auraestate_id_token');
    localStorage.removeItem('auraestate_active_persona');
    onSelectPersona('user_srj_admin_001');
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur shadow-xs sm:px-6">
      {/* Brand & Organization Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
          <Building2 className="h-6 w-6 text-sky-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 sm:text-lg leading-tight">
              {organization ? organization.companyName : 'AuraEstate Global SaaS'}
            </h1>
            {user?.isSystemAdmin && (
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                System Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Tenant Code: <strong className="text-slate-700">{organization?.code || 'SYSTEM'}</strong></span>
            <span>•</span>
            <span className="hidden sm:inline">Isolation: <strong className="text-emerald-600">PostgreSQL Strict RLS</strong></span>
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <div ref={searchRef} className="relative hidden md:block w-72 lg:w-96">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, units, bookings, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 transition focus:border-sky-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-100"
          />
        </div>

        {/* Search Results Popover */}
        {searchResults && (
          <div className="absolute top-11 left-0 right-0 z-50 max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
            {isSearching ? (
              <div className="p-4 text-center text-xs text-slate-500">Searching...</div>
            ) : (
              <div className="space-y-3">
                {searchResults.leads.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Leads
                    </div>
                    {searchResults.leads.map((l) => (
                      <button
                        key={`l-${l.id}`}
                        onClick={() => {
                          setSearchResults(null);
                          setSearchQuery('');
                          onNavigate('crm');
                        }}
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-800">{l.title}</span>
                        <span className="text-xs text-slate-500">{l.subtitle}</span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.units.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Inventory Units
                    </div>
                    {searchResults.units.map((u) => (
                      <button
                        key={`u-${u.id}`}
                        onClick={() => {
                          setSearchResults(null);
                          setSearchQuery('');
                          onNavigate('inventory');
                        }}
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-800">Unit {lPad(u.title)}</span>
                        <span className="rounded bg-sky-50 px-1.5 py-0.5 text-xs text-sky-700">
                          {u.subtitle}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.bookings.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Bookings
                    </div>
                    {searchResults.bookings.map((b) => (
                      <button
                        key={`b-${b.id}`}
                        onClick={() => {
                          setSearchResults(null);
                          setSearchQuery('');
                          onNavigate('bookings');
                        }}
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-800">{b.title}</span>
                        <span className="text-xs text-slate-500">{b.subtitle}</span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.customers.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Customers
                    </div>
                    {searchResults.customers.map((c) => (
                      <button
                        key={`c-${c.id}`}
                        onClick={() => {
                          setSearchResults(null);
                          setSearchQuery('');
                          onNavigate('customers');
                        }}
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-800">{c.title}</span>
                        <span className="text-xs text-slate-500">{c.subtitle}</span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.leads.length === 0 &&
                  searchResults.units.length === 0 &&
                  searchResults.bookings.length === 0 &&
                  searchResults.customers.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No matching records found in this organization.
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Persona Switcher & Google Sign-In */}
      <div className="flex items-center gap-3">
        {/* Launch Android Model Simulator */}
        {onOpenAndroidSimulator && (
          <button
            onClick={onOpenAndroidSimulator}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:from-sky-500 hover:to-indigo-500 active:scale-95 transition"
            title="Open Interactive Android Mobile Simulator with Card System"
          >
            <Smartphone className="h-4 w-4 text-sky-200" />
            <span className="hidden sm:inline">Android Model</span>
            <span className="rounded bg-white/20 px-1 py-0.2 text-[9px] font-mono tracking-tight">CARD UI</span>
          </button>
        )}

        {/* PWA Direct In-App Install Button */}
        {!isInstalled && (
          <button
            onClick={() => {
              if (isInstallable) {
                install();
              } else {
                alert('PWA Ready: You can install AuraEstate via your browser menu ("Install App" / "Add to Home screen").');
              }
            }}
            className="hidden md:flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
            title="Install AuraEstate PWA to Android or Desktop"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install App</span>
          </button>
        )}

        {/* Quick Persona Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition shadow-2xs"
            title="Switch Persona / Role"
          >
            <Shield className="h-3.5 w-3.5 text-sky-600" />
            <div className="text-left hidden lg:block">
              <span className="block font-semibold text-slate-900 leading-tight">
                {user ? user.name : 'Select Persona'}
              </span>
              <span className="block text-[10px] text-slate-500 capitalize">
                {user?.roleCode.replace('_', ' ')} • {organization ? organization.code : 'Global'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 top-11 z-50 w-72 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
              <div className="border-b border-slate-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Switch Live Persona (Multi-Tenant Demo)
              </div>
              <div className="max-h-72 overflow-y-auto py-1">
                {personas.map((p) => {
                  const isActive = user?.uid === p.uid;
                  return (
                    <button
                      key={p.uid}
                      onClick={() => {
                        onSelectPersona(p.uid);
                        setShowPersonaMenu(false);
                      }}
                      className={`flex w-full items-start gap-2 rounded-md p-2 text-left text-xs transition ${
                        isActive ? 'bg-sky-50 text-sky-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <UserCheck className={`h-4 w-4 mt-0.5 shrink-0 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold truncate">{p.name}</span>
                          {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-sky-600 shrink-0 ml-1" />}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.roleCode.replace('_', ' ')} • {p.organizationName}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Google Sign-In with Firebase Auth */}
        <button
          onClick={handleGoogleSignIn}
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          title="Sign in with Google (Firebase Auth)"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Google Auth</span>
        </button>

        {/* Notifications indicator */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-white"></span>
        </button>
      </div>
    </header>
  );
};

function lPad(val: any) {
  return val ? String(val) : '';
}
