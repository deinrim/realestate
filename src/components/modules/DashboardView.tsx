import React, { useEffect, useState } from 'react';
import {
  Building,
  Layers,
  Users,
  Compass,
  CreditCard,
  CheckSquare,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles,
  CalendarCheck,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { apiFetch, formatCurrency } from '../../services/apiClient.ts';
import { CurrentUser, Organization } from '../../types/index.ts';
import { useMobile } from '../../context/MobileContext.tsx';

interface DashboardViewProps {
  user: CurrentUser | null;
  organization: Organization | null;
  onNavigate: (module: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  organization,
  onNavigate,
}) => {
  const { isMobile } = useMobile();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user?.organizationId, user?.uid]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
          <p className="text-xs font-medium text-stone-500">Loading enterprise real estate metrics...</p>
        </div>
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Welcome Banner */}
      <div className="rounded-xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs">
        <div className={`flex flex-col gap-3 sm:gap-4 ${isMobile ? '' : 'sm:flex-row sm:items-center sm:justify-between'}`}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base sm:text-lg lg:text-xl font-bold text-stone-900 tracking-wide">
                Welcome back, {user?.name}
              </h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-emerald-800 border border-emerald-200 shrink-0">
                Live RERA Database
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-500 truncate">
              Overview for <strong className="text-stone-800">{organization?.companyName}</strong> • Role: <span className="capitalize font-semibold text-amber-800">{user?.roleCode.replace('_', ' ')}</span>
            </p>
          </div>

          <div className={`grid grid-cols-3 gap-1.5 sm:gap-2 ${isMobile ? 'w-full pt-1' : 'sm:flex sm:flex-wrap sm:items-center'}`}>
            <button
              onClick={() => onNavigate('crm')}
              className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg bg-amber-700 px-2 py-2 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-xs font-bold text-white shadow-xs hover:bg-amber-800 transition active:scale-95"
            >
              <Compass className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">+ Add Lead</span>
            </button>
            <button
              onClick={() => onNavigate('inventory')}
              className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg border border-stone-200 bg-[#F8FAFC] px-2 py-2 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-100 transition active:scale-95"
            >
              <Layers className="h-3.5 w-3.5 shrink-0 text-amber-700" />
              <span className="truncate">Inventory</span>
            </button>
            <button
              onClick={() => onNavigate('bookings')}
              className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg border border-stone-200 bg-white px-2 py-2 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition active:scale-95"
            >
              <span className="truncate">+ Booking</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className={`grid gap-2.5 sm:gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {/* Total Consideration & Bookings */}
        <div className="rounded-xl border border-stone-200/90 bg-white p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between text-stone-500 gap-1">
            <span className="text-[10px] sm:text-xs font-medium line-clamp-1">Sales Consideration</span>
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 font-num text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-stone-900 truncate">
            {formatCurrency(m.totalSalesValue)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-stone-500 truncate">
            <span className="font-semibold text-stone-800 font-num">{m.totalBookings}</span> bookings recorded
          </div>
        </div>

        {/* Collections */}
        <div className="rounded-xl border border-stone-200/90 bg-white p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between text-stone-500 gap-1">
            <span className="text-[10px] sm:text-xs font-medium line-clamp-1">Collections Cleared</span>
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 font-num text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-emerald-800 truncate">
            {formatCurrency(m.totalCollected)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] sm:text-xs text-stone-500 truncate">
            <span className="truncate">Due:</span>
            <span className="font-semibold text-rose-700 font-num truncate ml-1">{formatCurrency(m.outstanding)}</span>
          </div>
        </div>

        {/* Inventory Units */}
        <div className="rounded-xl border border-stone-200/90 bg-white p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between text-stone-500 gap-1">
            <span className="text-[10px] sm:text-xs font-medium line-clamp-1">Property Inventory</span>
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-700 border border-stone-200 shrink-0">
              <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1 sm:gap-2 truncate">
            <span className="font-num text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-stone-900">{m.availableUnits}</span>
            <span className="text-[10px] sm:text-xs text-stone-500 font-num truncate">/ {m.totalUnits} Units</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs truncate">
            <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-800 border border-emerald-200/60 font-num truncate">
              {m.availableUnits} Ready
            </span>
            <span className="inline-flex items-center rounded bg-stone-100 px-1.5 py-0.5 font-medium text-stone-600 font-num truncate">
              {m.bookedUnits} Sold
            </span>
          </div>
        </div>

        {/* CRM Leads & Pipeline */}
        <div className="rounded-xl border border-stone-200/90 bg-white p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between text-stone-500 gap-1">
            <span className="text-[10px] sm:text-xs font-medium line-clamp-1">Leads & Pipeline</span>
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-amber-100/70 text-amber-800 border border-amber-300/50 shrink-0">
              <Compass className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1 sm:gap-2 truncate">
            <span className="font-num text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-stone-900">{m.totalLeads}</span>
            <span className="text-[10px] sm:text-xs text-stone-500 truncate">Total Leads</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] sm:text-xs text-stone-500 truncate">
            <span className="font-num truncate">{m.newLeads} Inbound</span>
            <span className="mx-1">•</span>
            <span className="text-amber-800 font-semibold font-num truncate">{m.siteVisits} Visits</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Section */}
      <div className={`grid gap-5 sm:gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* Left 2 Cols: Recent Bookings & Pipeline Breakdown */}
        <div className={`space-y-5 sm:space-y-6 ${isMobile ? '' : 'lg:col-span-2'}`}>
          {/* Recent Bookings */}
          <div className="rounded-xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-display text-sm font-bold text-stone-900 tracking-wide">Recent Bookings & Contracts</h3>
                <p className="text-[11px] sm:text-xs text-stone-500">Latest reservations across active projects</p>
              </div>
              <button
                onClick={() => onNavigate('bookings')}
                className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
              >
                <span>View All</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Mobile Card Layout (Visible when isMobile or on small screens) */}
            <div className={`mt-3 space-y-2.5 ${isMobile ? 'block' : 'md:hidden'}`}>
              {data?.recentBookings?.length > 0 ? (
                data.recentBookings.map((b: any) => (
                  <div
                    key={`mob-rb-${b.id}`}
                    onClick={() => onNavigate('bookings')}
                    className="rounded-xl border border-stone-200/80 bg-[#F8FAFC] p-3 text-xs space-y-2 cursor-pointer active:bg-stone-100 transition shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-num font-bold text-amber-900 bg-amber-100/70 border border-amber-300/60 px-2 py-0.5 rounded text-[11px]">
                        {b.bookingNumber}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          b.status === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                            : b.status === 'Pending Approval'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-stone-900 pt-1">
                      <span className="font-bold text-sm truncate mr-2">{b.customerName}</span>
                      <span className="font-bold font-num text-emerald-800 shrink-0">{formatCurrency(b.total)}</span>
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {b.projectName} • <span className="font-semibold text-amber-800">Unit {b.unitNumber}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-stone-400">
                  No bookings recorded yet.
                </div>
              )}
            </div>

            {/* Desktop Table View (Hidden when isMobile or on mobile) */}
            <div className={`mt-3 overflow-x-auto ${isMobile ? 'hidden' : 'hidden md:block'}`}>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-100 text-[11px] font-semibold text-stone-400">
                    <th className="py-2.5">Booking #</th>
                    <th className="py-2.5">Customer</th>
                    <th className="py-2.5">Project / Unit</th>
                    <th className="py-2.5">Consideration</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data?.recentBookings?.length > 0 ? (
                    data.recentBookings.map((b: any) => (
                      <tr key={b.id} className="hover:bg-[#F8FAFC] transition">
                        <td className="py-3 font-semibold text-stone-800 font-num">{b.bookingNumber}</td>
                        <td className="py-3 font-medium text-stone-800">{b.customerName}</td>
                        <td className="py-3 text-stone-600">
                          {b.projectName} • <span className="font-semibold text-amber-800">Unit {b.unitNumber}</span>
                        </td>
                        <td className="py-3 font-semibold font-num text-stone-900">{formatCurrency(b.total)}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              b.status === 'Confirmed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                : b.status === 'Pending Approval'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-stone-400">
                        No bookings recorded yet. Create the first booking in Bookings module.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lead Acquisition Sources Distribution */}
          <div className="rounded-xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-stone-900">Lead Acquisition Sources</h3>
            <p className="text-xs text-stone-500">Distribution of inbound buyer enquiries across Indian portals & CPs</p>

            <div className="mt-4 space-y-3">
              {data?.leadSources?.map((src: any) => {
                const total = m.totalLeads || 1;
                const pct = Math.round((Number(src.count) / total) * 100);
                return (
                  <div key={src.source}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-700">{src.source}</span>
                      <span className="text-stone-500 font-semibold font-num">{src.count} leads ({pct}%)</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-600 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Priority Follow-ups & System Status */}
        <div className="space-y-5 sm:space-y-6">
          {/* Action Tasks */}
          <div className="rounded-xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Priority Tasks</h3>
                <p className="text-xs text-stone-500">Immediate follow-ups & approvals</p>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800"
              >
                All Tasks
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {data?.pendingTasks?.length > 0 ? (
                data.pendingTasks.map((t: any) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-stone-200/70 bg-[#F8FAFC] p-3 text-xs hover:border-amber-300 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-stone-800 leading-snug">{t.title}</span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          t.priority === 'High'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                    {t.description && (
                      <p className="mt-1 text-[11px] text-stone-500 line-clamp-2">{t.description}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
                      <span>Due: {t.dueDate || 'Flexible'}</span>
                      <span className="font-semibold text-amber-800 capitalize">{t.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-xs text-stone-400">No pending priority tasks.</p>
              )}
            </div>
          </div>

          {/* Real Estate Architecture & RERA Card */}
          <div className="rounded-xl border border-stone-800 bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800 p-4 sm:p-5 text-stone-200 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <h4 className="text-sm font-bold text-amber-400">RERA & Escrow Architecture</h4>
            </div>
            <p className="mt-2 text-xs text-stone-300 leading-relaxed">
              Multi-tenant isolation enabled. Every transaction enforces Section 4(2)(l)(D) 70% Escrow and Section 194-IA 1% TDS buyer reconciliation directly in the database layer.
            </p>
            <div className="mt-4 pt-3 border-t border-stone-700/60 flex items-center justify-between text-[11px] text-stone-400">
              <span className="font-num">WBRERA/P/KOL/2023/000214</span>
              <span className="text-emerald-400 font-semibold">Active & Regulated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
