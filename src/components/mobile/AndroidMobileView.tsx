import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Layers,
  Building,
  Users,
  FileCheck2,
  CreditCard,
  Search,
  Plus,
  Phone,
  MessageCircle,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  MapPin,
  Tag,
  Download,
  ShieldCheck,
  Compass,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { apiFetch, formatCurrency } from '../../services/apiClient.ts';
import { CurrentUser, Organization, Project, Unit, Lead, Booking } from '../../types/index.ts';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';

interface AndroidMobileViewProps {
  user: CurrentUser | null;
  organization: Organization | null;
  onNavigate: (module: string, params?: any) => void;
  onClosePreview?: () => void;
  isStandaloneSimulator?: boolean;
}

export const AndroidMobileView: React.FC<AndroidMobileViewProps> = ({
  user,
  organization,
  onNavigate,
  onClosePreview,
  isStandaloneSimulator = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'home' | 'projects' | 'inventory' | 'leads' | 'bookings'>('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [selectedUnitCard, setSelectedUnitCard] = useState<Unit | null>(null);
  const [selectedLeadCard, setSelectedLeadCard] = useState<Lead | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashData, projData, unitData, leadData, bookingData] = await Promise.all([
        apiFetch('/api/dashboard'),
        apiFetch('/api/projects'),
        apiFetch('/api/inventory/units'),
        apiFetch('/api/leads'),
        apiFetch('/api/bookings'),
      ]);
      setMetrics(dashData.metrics);
      setProjects(projData);
      setUnits(unitData);
      setLeads(leadData);
      setBookings(bookingData);
    } catch (err) {
      console.error('Failed to load mobile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick unit status updater on mobile
  const handleQuickStatusChange = async (unitId: number, status: string) => {
    try {
      await apiFetch(`/api/inventory/units/${unitId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      loadData();
      if (selectedUnitCard?.id === unitId) {
        setSelectedUnitCard((prev) => (prev ? { ...prev, status: status as Unit['status'] } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update unit');
    }
  };

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.mobile.includes(searchQuery) ||
      l.leadCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategoryFilter === 'All' || l.status === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filtered Units
  const filteredUnits = units.filter((u) => {
    const matchesSearch =
      u.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.towerName && u.towerName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategoryFilter === 'All' || u.status === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="relative flex flex-col h-full bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      {/* 1. Android Status Bar (Material 3 style) */}
      <div className="h-7 w-full bg-slate-900/90 backdrop-blur-md px-5 flex items-center justify-between text-[11px] font-semibold text-slate-400 z-30 shrink-0 border-b border-slate-800/40">
        <div className="flex items-center gap-1.5">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-[9px] rounded bg-sky-500/20 text-sky-400 px-1 font-mono">5G</span>
        </div>

        {/* Camera Hole Punch Mockup */}
        <div className="h-3.5 w-3.5 rounded-full bg-slate-950 border border-slate-800 shadow-inner" />

        <div className="flex items-center gap-2">
          <span>89%</span>
          <div className="w-5 h-2.5 border border-slate-400 rounded-xs p-0.5 flex items-center">
            <div className="w-full h-full bg-emerald-400 rounded-2xs" />
          </div>
        </div>
      </div>

      {/* 2. Top Android App Bar */}
      <div className="bg-slate-900/95 backdrop-blur-md px-4 py-2.5 border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-sky-500/20">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-tight">
                {organization?.companyName || 'AuraEstate'}
              </span>
              <span className="text-[9px] font-mono bg-sky-500/20 text-sky-400 px-1 rounded">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[170px]">
              {user?.name} • {user?.roleCode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* In-app Android PWA Install / APK Badge */}
          {!isInstalled && (
            <button
              onClick={() => {
                if (isInstallable) {
                  install();
                } else {
                  alert(
                    'To install on Android: Open browser menu (⋮) -> tap "Add to Home Screen" or "Install App".'
                  );
                }
              }}
              className="flex items-center gap-1 rounded-full bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs transition active:scale-95"
            >
              <Download className="h-3 w-3" />
              <span>Install App</span>
            </button>
          )}

          {isStandaloneSimulator && onClosePreview && (
            <button
              onClick={onClosePreview}
              className="rounded-full bg-slate-800 p-1.5 text-slate-300 hover:text-white"
              title="Close Simulator"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. Search & Horizontal Filter Pill Carousel */}
      <div className="bg-slate-900 px-3.5 py-2 border-b border-slate-800/60 space-y-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'inventory'
                ? 'Search flat number, tower...'
                : activeTab === 'leads'
                ? 'Search leads, buyer mobile...'
                : 'Search units, projects, contracts...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:outline-hidden"
          />
        </div>

        {/* Scrollable Material Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          {['All', 'Available', 'Booked', 'Sold', 'Hold', 'New', 'Contacted', 'Qualified'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`rounded-full px-3 py-1 font-medium whitespace-nowrap transition active:scale-95 ${
                  selectedCategoryFilter === cat
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* 4. Scrollable Main Cards Body */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3.5 pb-24">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-sky-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* ----------------- TAB: HOME / DASHBOARD ----------------- */}
            {activeTab === 'home' && (
              <div className="space-y-3.5">
                {/* Metric Summary Carousel Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Bookings</span>
                      <FileCheck2 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="mt-1 text-lg font-black text-white">
                      {metrics?.totalBookings || 0}
                    </div>
                    <div className="mt-1 text-[10px] text-emerald-400 font-semibold">
                      {formatCurrency(metrics?.totalSalesValue || 0)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Collections</span>
                      <CreditCard className="h-4 w-4 text-sky-400" />
                    </div>
                    <div className="mt-1 text-lg font-black text-white">
                      {formatCurrency(metrics?.totalCollected || 0)}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400">
                      Pending: {formatCurrency(metrics?.outstanding || 0)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Available Units</span>
                      <Layers className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="mt-1 text-lg font-black text-white">
                      {metrics?.availableUnits || 0} <span className="text-xs text-slate-400 font-normal">/ {metrics?.totalUnits || 0}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-amber-400 font-medium">Ready for allotment</div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">CRM Pipeline</span>
                      <Compass className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="mt-1 text-lg font-black text-white">
                      {metrics?.totalLeads || 0}
                    </div>
                    <div className="mt-1 text-[10px] text-purple-400 font-medium">Active Inquiries</div>
                  </div>
                </div>

                {/* Section Header: Active Projects Card Feed */}
                <div className="flex items-center justify-between pt-1">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Featured Developments ({projects.length})
                  </h3>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="text-[11px] text-sky-400 font-semibold flex items-center"
                  >
                    View All <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                {/* Project Hero Cards */}
                {projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveTab('inventory');
                      setSearchQuery(p.name);
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-lg active:scale-[0.98] transition cursor-pointer"
                  >
                    <div className="h-28 w-full bg-slate-800 relative">
                      <img
                        src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80"
                        alt={p.name}
                        className="h-full w-full object-cover opacity-60 group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-slate-900/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-sky-400 border border-slate-700/50">
                        <Building className="h-3 w-3" /> {p.code}
                      </div>
                      <div className="absolute top-2.5 right-2.5 rounded-full bg-emerald-500/20 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                        {p.status}
                      </div>
                      <div className="absolute bottom-2 left-3 right-3">
                        <h4 className="text-sm font-bold text-white leading-tight drop-shadow-sm">{p.name}</h4>
                        <p className="text-[10px] text-slate-300 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2.5 w-2.5 text-sky-400" /> {p.location || p.city}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                        <div>
                          <span className="text-slate-400 block">Towers</span>
                          <span className="font-bold text-white text-xs">{p.towersCount || 2}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Units</span>
                          <span className="font-bold text-white text-xs">{p.totalUnits || 0}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Available</span>
                          <span className="font-bold text-emerald-400 text-xs">{p.availableUnits || 0}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="font-mono text-slate-400 text-[10px]">
                          RERA: {p.reraNumber ? p.reraNumber.slice(0, 16) + '...' : 'Approved'}
                        </span>
                        <span className="text-sky-400 font-bold flex items-center gap-1">
                          Inspect Units <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ----------------- TAB: INVENTORY CARD SYSTEM ----------------- */}
            {activeTab === 'inventory' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Showing {filteredUnits.length} Units
                  </span>
                  <span className="text-[10px] text-slate-400">Tap card for instant actions</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {filteredUnits.map((u) => {
                    const isAvailable = u.status === 'Available';
                    const isBooked = ['Booked', 'Sold'].includes(u.status);
                    const isHold = u.status === 'Hold';

                    return (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUnitCard(u)}
                        className={`rounded-2xl border p-3 shadow-md transition active:scale-[0.99] cursor-pointer ${
                          isAvailable
                            ? 'border-emerald-500/30 bg-gradient-to-br from-slate-900 to-emerald-950/20'
                            : isHold
                            ? 'border-amber-500/30 bg-gradient-to-br from-slate-900 to-amber-950/20'
                            : 'border-slate-800 bg-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-base font-black text-white">
                                Unit {u.unitNumber}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                  isAvailable
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : isHold
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {u.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {u.projectName} • {u.towerName || 'Tower A'} • Floor {u.floorNumber}
                            </p>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-black text-sky-400">
                              {formatCurrency(u.totalPrice)}
                            </div>
                            <span className="text-[9px] text-slate-400">
                              ₹{Number(u.pricePerSqft || 0).toLocaleString('en-IN')}/sqft
                            </span>
                          </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-300 border-t border-slate-800/60 pt-2">
                          <span className="font-semibold text-slate-200">{u.bedrooms} BHK</span>
                          <span>•</span>
                          <span>{u.carpetArea} sq.ft.</span>
                          <span>•</span>
                          <span className="text-slate-400">Facing: {u.facing || 'East'}</span>
                        </div>

                        {/* Quick Mobile Action Bar */}
                        <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/40">
                          {isAvailable ? (
                            <div className="flex gap-2 w-full">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigate('bookings', {
                                    prefillUnitId: u.id,
                                    prefillProjectId: u.projectId,
                                    prefillConsideration: u.totalPrice,
                                  });
                                }}
                                className="flex-1 rounded-xl bg-sky-600 hover:bg-sky-500 py-1.5 text-xs font-bold text-white shadow-xs"
                              >
                                Reserve / Book Unit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickStatusChange(u.id, 'Hold');
                                }}
                                className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400"
                              >
                                Hold
                              </button>
                            </div>
                          ) : isHold ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickStatusChange(u.id, 'Available');
                              }}
                              className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-1.5 text-xs font-semibold text-emerald-400"
                            >
                              Release to Available
                            </button>
                          ) : (
                            <span className="text-[11px] text-rose-400 font-medium">
                              Allotted & Locked against double-booking
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ----------------- TAB: LEADS CRM CARDS ----------------- */}
            {activeTab === 'leads' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    {filteredLeads.length} Prospective Inquiries
                  </span>
                  <button
                    onClick={() => onNavigate('crm')}
                    className="text-[11px] text-sky-400 font-semibold"
                  >
                    + Add Inbound Lead
                  </button>
                </div>

                <div className="space-y-2.5">
                  {filteredLeads.map((l) => (
                    <div
                      key={l.id}
                      onClick={() => setSelectedLeadCard(l)}
                      className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-md space-y-2.5 active:scale-[0.99] transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-white">{l.name}</span>
                            <span className="font-mono text-[9px] text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">
                              {l.leadCode}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Prefers: {l.unitPreference || '3 BHK'} • {l.budget || '₹1 Cr'}
                          </p>
                        </div>
                        <span className="rounded-full bg-sky-500/20 text-sky-300 px-2 py-0.5 text-[10px] font-bold border border-sky-500/30">
                          {l.status}
                        </span>
                      </div>

                      {/* Direct Mobile Quick Contact Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${l.mobile}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs"
                          >
                            <Phone className="h-3 w-3" />
                            <span>Call</span>
                          </a>
                          <a
                            href={`https://wa.me/${l.mobile.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 rounded-xl bg-emerald-700/60 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-emerald-200 border border-emerald-500/40 shadow-xs"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('site-visits', { leadId: l.id });
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-sky-400"
                        >
                          <Calendar className="h-3 w-3" /> Schedule Visit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ----------------- TAB: BOOKINGS & CONTRACTS CARDS ----------------- */}
            {activeTab === 'bookings' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Active Contracts ({bookings.length})
                  </span>
                  <button
                    onClick={() => onNavigate('bookings')}
                    className="text-[11px] text-sky-400 font-semibold"
                  >
                    + New Booking
                  </button>
                </div>

                <div className="space-y-2.5">
                  {bookings.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-md space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-[10px] text-sky-400 font-bold block">
                            {b.bookingNumber}
                          </span>
                          <span className="text-sm font-bold text-white">{b.customerName}</span>
                          <p className="text-[11px] text-slate-400">
                            {b.projectName} • Unit {b.unitNumber}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            b.status === 'Confirmed'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2 rounded-xl text-[11px]">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Total Agreed</span>
                          <span className="font-bold text-white">
                            {formatCurrency(b.totalConsideration)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Token Received</span>
                          <span className="font-bold text-emerald-400">
                            {formatCurrency(b.bookingAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-slate-400 text-[10px]">
                          Booked on: {b.bookingDate}
                        </span>
                        <button
                          onClick={() => onNavigate('payments')}
                          className="text-sky-400 font-bold flex items-center gap-1"
                        >
                          Payment Receipt <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ----------------- TAB: PROJECTS CAROUSEL ----------------- */}
            {activeTab === 'projects' && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300">
                  All Developments ({projects.length})
                </span>
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 space-y-2.5 shadow-md"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-white">{p.name}</h4>
                        <p className="text-[11px] text-slate-400">
                          {p.location}, {p.city}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                        {p.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2">{p.description}</p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950 p-2 rounded-xl">
                      <div>
                        <span className="text-slate-500 text-[10px] block">RERA Number</span>
                        <span className="font-mono text-slate-300 text-[10px] font-semibold">
                          {p.reraNumber || 'Sanctioned'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Target Handover</span>
                        <span className="font-bold text-slate-300">{p.expectedCompletion || '2027'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('inventory');
                        setSearchQuery(p.name);
                      }}
                      className="w-full rounded-xl bg-sky-600/20 text-sky-300 hover:bg-sky-600/30 border border-sky-500/30 py-2 text-xs font-bold"
                    >
                      Browse Available Units →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 5. Material Floating Action Button (FAB) */}
      <div className="absolute bottom-20 right-4 z-40">
        {showFabMenu && (
          <div className="mb-3 flex flex-col items-end gap-2 transition-all">
            <button
              onClick={() => {
                setShowFabMenu(false);
                onNavigate('crm');
              }}
              className="flex items-center gap-2 rounded-full bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-bold text-white shadow-xl"
            >
              <span>+ Quick Lead</span>
              <Users className="h-3.5 w-3.5 text-purple-400" />
            </button>

            <button
              onClick={() => {
                setShowFabMenu(false);
                onNavigate('bookings');
              }}
              className="flex items-center gap-2 rounded-full bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-bold text-white shadow-xl"
            >
              <span>+ Reserve Unit</span>
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
            </button>

            <button
              onClick={() => {
                setShowFabMenu(false);
                onNavigate('site-visits');
              }}
              className="flex items-center gap-2 rounded-full bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-bold text-white shadow-xl"
            >
              <span>+ Book Visit</span>
              <Calendar className="h-3.5 w-3.5 text-sky-400" />
            </button>
          </div>
        )}

        <button
          onClick={() => setShowFabMenu(!showFabMenu)}
          className={`h-14 w-14 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-sky-500/40 transition active:scale-95 ${
            showFabMenu ? 'rotate-45' : ''
          }`}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* 6. Material Bottom Navigation Bar (Android System Nav) */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-3 flex items-center justify-around z-30">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            activeTab === 'home' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="h-5 w-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            activeTab === 'inventory'
              ? 'text-sky-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="h-5 w-5" />
          <span>Inventory</span>
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            activeTab === 'leads' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="h-5 w-5" />
          <span>Leads CRM</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            activeTab === 'bookings'
              ? 'text-sky-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck2 className="h-5 w-5" />
          <span>Bookings</span>
        </button>

        <button
          onClick={() => onNavigate('dashboard')}
          className="flex flex-col items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-slate-200"
        >
          <Smartphone className="h-5 w-5 text-indigo-400" />
          <span>Desktop</span>
        </button>
      </div>

      {/* 7. Android Gesture Pill (Home Indicator) */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-700/80 rounded-full z-40 pointer-events-none" />
    </div>
  );
};
