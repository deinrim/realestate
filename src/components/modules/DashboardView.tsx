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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Loading enterprise metrics...</p>
        </div>
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                Welcome back, {user?.name}
              </h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                Live Enterprise Database
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Overview for <strong className="text-slate-700">{organization?.companyName}</strong> • Role: <span className="capitalize font-medium text-sky-700">{user?.roleCode.replace('_', ' ')}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('crm')}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-sky-700 transition"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>+ Add Lead</span>
            </button>
            <button
              onClick={() => onNavigate('inventory')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <Layers className="h-3.5 w-3.5 text-sky-600" />
              <span>Visual Inventory</span>
            </button>
            <button
              onClick={() => onNavigate('bookings')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <span>+ New Booking</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Consideration & Bookings */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Sales Consideration</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(m.totalSalesValue)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{m.totalBookings}</span> bookings recorded
          </div>
        </div>

        {/* Collections */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Collections (Cleared)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {formatCurrency(m.totalCollected)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Outstanding:</span>
            <span className="font-semibold text-rose-600">{formatCurrency(m.outstanding)}</span>
          </div>
        </div>

        {/* Inventory Units */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Active Property Inventory</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{m.availableUnits}</span>
            <span className="text-xs text-slate-500">Available of {m.totalUnits}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
              {m.availableUnits} Ready for Sale
            </span>
            <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
              {m.bookedUnits} Booked / Sold
            </span>
          </div>
        </div>

        {/* CRM Leads & Pipeline */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Leads & Pipeline</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Compass className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{m.totalLeads}</span>
            <span className="text-xs text-slate-500">Total Pipeline</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{m.newLeads} New Inbound</span>
            <span>•</span>
            <span className="text-sky-700 font-medium">{m.siteVisits} Site Visits</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Recent Bookings & Pipeline Breakdown */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent Bookings */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Bookings & Contracts</h3>
                <p className="text-xs text-slate-500">Latest reservations across active projects</p>
              </div>
              <button
                onClick={() => onNavigate('bookings')}
                className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
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
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5 cursor-pointer active:bg-slate-100 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                        {b.bookingNumber}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          b.status === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : b.status === 'Pending Approval'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-800">
                      <span className="font-bold text-sm">{b.customerName}</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(b.total)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {b.projectName} • Unit {b.unitNumber}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">
                  No bookings recorded yet.
                </div>
              )}
            </div>

            {/* Desktop Table View (Hidden on mobile) */}
            <div className="mt-3 hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5">Booking #</th>
                    <th className="py-2.5">Customer</th>
                    <th className="py-2.5">Project / Unit</th>
                    <th className="py-2.5">Consideration</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.recentBookings?.length > 0 ? (
                    data.recentBookings.map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 font-semibold text-slate-800">{b.bookingNumber}</td>
                        <td className="py-3 font-medium text-slate-700">{b.customerName}</td>
                        <td className="py-3 text-slate-600">
                          {b.projectName} • <span className="font-semibold text-sky-700">Unit {b.unitNumber}</span>
                        </td>
                        <td className="py-3 font-semibold text-slate-900">{formatCurrency(b.total)}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              b.status === 'Confirmed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : b.status === 'Pending Approval'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                        No bookings recorded yet. Create the first booking in Bookings module.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lead Acquisition Sources Distribution */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Lead Acquisition Sources</h3>
            <p className="text-xs text-slate-500">Distribution of inbound buyer enquiries</p>

            <div className="mt-4 space-y-3">
              {data?.leadSources?.map((src: any) => {
                const total = m.totalLeads || 1;
                const pct = Math.round((Number(src.count) / total) * 100);
                return (
                  <div key={src.source}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{src.source}</span>
                      <span className="text-slate-500 font-semibold">{src.count} leads ({pct}%)</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Pending Action Tasks & Shortcuts */}
        <div className="space-y-6">
          {/* Action Tasks */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Priority Tasks</h3>
                <p className="text-xs text-slate-500">Immediate follow-ups & approvals</p>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                All Tasks
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {data?.pendingTasks?.length > 0 ? (
                data.pendingTasks.map((t: any) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs hover:border-sky-200 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-800 leading-snug">{t.title}</span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          t.priority === 'High'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                    {t.description && (
                      <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{t.description}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Due: {t.dueDate || 'Flexible'}</span>
                      <span className="font-medium text-sky-700 capitalize">{t.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-xs text-slate-400">No pending priority tasks.</p>
              )}
            </div>
          </div>

          {/* Quick System Status Card */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-400" />
              <h4 className="text-sm font-bold">Multi-Tenant Architecture</h4>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Cloud SQL relational database with per-tenant isolation enabled. Every query validates <code className="rounded bg-slate-700 px-1 py-0.5 text-sky-300">organization_id</code> at the SQL engine level.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>PostgreSQL Developer Edition</span>
              <span className="text-emerald-400 font-semibold">Active & Healthy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
