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
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-900">
                Welcome back, {user?.name}
              </h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                Live RERA Enterprise Database
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Overview for <strong className="text-stone-800">{organization?.companyName}</strong> • Role: <span className="capitalize font-semibold text-amber-800">{user?.roleCode.replace('_', ' ')}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('crm')}
              className="flex items-center gap-1.5 rounded-lg bg-amber-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>+ Add Lead</span>
            </button>
            <button
              onClick={() => onNavigate('inventory')}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-[#FAF8F5] px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-100 transition"
            >
              <Layers className="h-3.5 w-3.5 text-amber-700" />
              <span>Visual Inventory</span>
            </button>
            <button
              onClick={() => onNavigate('bookings')}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition"
            >
              <span>+ New Booking</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Consideration & Bookings */}
        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Total Sales Consideration</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900">
            {formatCurrency(m.totalSalesValue)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-stone-500">
            <span className="font-semibold text-stone-800">{m.totalBookings}</span> bookings recorded
          </div>
        </div>

        {/* Collections */}
        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Total Collections (Cleared)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {formatCurrency(m.totalCollected)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
            <span>Outstanding:</span>
            <span className="font-semibold text-rose-700">{formatCurrency(m.outstanding)}</span>
          </div>
        </div>

        {/* Inventory Units */}
        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Active Property Inventory</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">{m.availableUnits}</span>
            <span className="text-xs text-stone-500">Available of {m.totalUnits}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200/60">
              {m.availableUnits} Ready for Sale
            </span>
            <span className="inline-flex items-center rounded bg-stone-100 px-1.5 py-0.5 text-[11px] font-medium text-stone-600">
              {m.bookedUnits} Booked / Sold
            </span>
          </div>
        </div>

        {/* CRM Leads & Pipeline */}
        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Leads & Pipeline</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100/70 text-amber-800 border border-amber-300/50">
              <Compass className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">{m.totalLeads}</span>
            <span className="text-xs text-stone-500">Total Pipeline</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
            <span>{m.newLeads} New Inbound</span>
            <span>•</span>
            <span className="text-amber-800 font-semibold">{m.siteVisits} Site Visits</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Recent Bookings & Pipeline Breakdown */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent Bookings */}
          <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Recent Bookings & Contracts</h3>
                <p className="text-xs text-stone-500">Latest reservations across active projects</p>
              </div>
              <button
                onClick={() => onNavigate('bookings')}
                className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
              >
                <span>View All</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Mobile Card Layout (visible on mobile / narrow viewports) */}
            <div className="mt-3 space-y-2 md:hidden">
              {data?.recentBookings?.length > 0 ? (
                data.recentBookings.map((b: any) => (
                  <div
                    key={`mob-rb-${b.id}`}
                    onClick={() => onNavigate('bookings')}
                    className="rounded-xl border border-stone-200 bg-[#FAF8F5] p-3 text-xs space-y-1.5 cursor-pointer active:bg-stone-100 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-900 bg-amber-100/70 border border-amber-300/60 px-1.5 py-0.5 rounded">
                        {b.bookingNumber}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          b.status === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : b.status === 'Pending Approval'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-stone-900">
                      <span className="font-bold text-sm">{b.customerName}</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(b.total)}</span>
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {b.projectName} • Unit {b.unitNumber}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-stone-400">
                  No bookings recorded yet.
                </div>
              )}
            </div>

            {/* Desktop Table View (Hidden on mobile) */}
            <div className="mt-3 hidden md:block overflow-x-auto">
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
                      <tr key={b.id} className="hover:bg-[#FAF8F5] transition">
                        <td className="py-3 font-semibold text-stone-800 font-mono">{b.bookingNumber}</td>
                        <td className="py-3 font-medium text-stone-800">{b.customerName}</td>
                        <td className="py-3 text-stone-600">
                          {b.projectName} • <span className="font-semibold text-amber-800">Unit {b.unitNumber}</span>
                        </td>
                        <td className="py-3 font-semibold text-stone-900">{formatCurrency(b.total)}</td>
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
          <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-2xs">
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
                      <span className="text-stone-500 font-semibold">{src.count} leads ({pct}%)</span>
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
        <div className="space-y-6">
          {/* Action Tasks */}
          <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-2xs">
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

            <div className="mt-3 space-y-3">
              {data?.pendingTasks?.length > 0 ? (
                data.pendingTasks.map((t: any) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-stone-200/70 bg-[#FAF8F5] p-3 text-xs hover:border-amber-300 transition"
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
          <div className="rounded-xl border border-stone-800 bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800 p-5 text-stone-200 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <h4 className="text-sm font-bold text-amber-400">RERA & Escrow Architecture</h4>
            </div>
            <p className="mt-2 text-xs text-stone-300 leading-relaxed">
              Multi-tenant isolation enabled. Every transaction enforces Section 4(2)(l)(D) 70% Escrow and Section 194-IA 1% TDS buyer reconciliation directly in the database layer.
            </p>
            <div className="mt-4 pt-3 border-t border-stone-700/60 flex items-center justify-between text-[11px] text-stone-400">
              <span>WBRERA/P/KOL/2023/000214</span>
              <span className="text-emerald-400 font-semibold">Active & Regulated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
