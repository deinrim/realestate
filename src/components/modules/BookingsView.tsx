import React, { useEffect, useState } from 'react';
import {
  FileCheck2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  ShieldCheck,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { apiFetch, formatCurrency } from '../../services/apiClient.ts';
import { CurrentUser, Booking, Customer, Project, Unit } from '../../types/index.ts';

interface BookingsViewProps {
  user: CurrentUser | null;
  params?: any;
  onNavigate: (module: string) => void;
}

export const BookingsView: React.FC<BookingsViewProps> = ({ user, params, onNavigate }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [approvalModalBooking, setApprovalModalBooking] = useState<Booking | null>(null);
  const [approvalComments, setApprovalComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Booking Form
  const [formData, setFormData] = useState({
    customerId: '',
    projectId: params?.prefillProjectId ? String(params.prefillProjectId) : '',
    unitId: params?.prefillUnitId ? String(params.prefillUnitId) : '',
    bookingAmount: '500000',
    totalConsideration: params?.prefillConsideration ? String(params.prefillConsideration) : '',
    paymentPlan: 'Construction Linked Plan',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingData, custData, projData] = await Promise.all([
        apiFetch('/api/bookings'),
        apiFetch('/api/customers'),
        apiFetch('/api/projects'),
      ]);
      setBookings(bookingData);
      setCustomers(custData);
      setProjects(projData);

      if (params?.prefillUnitId) {
        setShowCreateModal(true);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When project changes, fetch available units for that project
  useEffect(() => {
    if (formData.projectId) {
      apiFetch(`/api/inventory/units?projectId=${formData.projectId}&status=Available`)
        .then((units) => setAvailableUnits(units))
        .catch(console.error);
    } else {
      setAvailableUnits([]);
    }
  }, [formData.projectId]);

  // When unit changes, update total consideration
  const handleUnitSelect = (unitId: string) => {
    setFormData((prev) => {
      const selected = availableUnits.find((u) => u.id === Number(unitId));
      return {
        ...prev,
        unitId,
        totalConsideration: selected ? selected.totalPrice : prev.totalConsideration,
      };
    });
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveStep = async () => {
    if (!approvalModalBooking) return;
    try {
      setSubmitting(true);
      await apiFetch(`/api/bookings/${approvalModalBooking.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ comments: approvalComments }),
      });
      setApprovalModalBooking(null);
      setApprovalComments('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStepName = (step: number) => {
    switch (step) {
      case 1:
        return '1. Sales Manager Review';
      case 2:
        return '2. Accounts Token Clearance';
      case 3:
        return '3. Management Final Signoff';
      default:
        return 'Complete';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-900">Bookings & Commercial Contracts</h2>
          </div>
          <p className="text-xs text-slate-500">
            Atomic reservation engine with double-booking prevention and multi-stage workflow approvals
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-sky-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>+ New Property Booking</span>
        </button>
      </div>

      {/* Bookings List */}
      {/* Bookings View: Mobile Cards & Desktop Table */}
      <div className="space-y-3">
        {/* Mobile Android-Style Card System (Visible on small screens) */}
        <div className="grid grid-cols-1 gap-2.5 md:hidden">
          {bookings.map((b) => (
            <div
              key={`mob-${b.id}`}
              className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                    {b.bookingNumber}
                  </span>
                  <div className="font-bold text-sm text-slate-900 mt-1">{b.customerName}</div>
                  <div className="text-[11px] text-slate-500">{b.customerMobile}</div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    b.status === 'Confirmed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {b.status}
                </span>
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Project & Unit:</span>
                  <span className="font-semibold text-slate-800">
                    {b.projectName} • Unit {b.unitNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Consideration:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(b.totalConsideration)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Token Received:</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(b.bookingAmount)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                <div>
                  {b.status === 'Confirmed' ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
                      <CheckCircle2 className="h-3 w-3" /> Fully Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-amber-700 text-[11px]">
                      <Clock className="h-3 w-3" /> {getStepName(b.currentApprovalStep)}
                    </span>
                  )}
                </div>

                {b.status !== 'Confirmed' && (
                  <button
                    onClick={() => setApprovalModalBooking(b)}
                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-sky-700 transition"
                  >
                    Review Step →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden md:block rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-2">Booking #</th>
                  <th className="py-3 px-2">Customer Name</th>
                  <th className="py-3 px-2">Project & Unit</th>
                  <th className="py-3 px-2">Total Consideration</th>
                  <th className="py-3 px-2">Token Paid</th>
                  <th className="py-3 px-2">Approval Stage</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-2 font-mono font-bold text-slate-900">{b.bookingNumber}</td>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-slate-800">{b.customerName}</div>
                      <div className="text-[10px] text-slate-400">{b.customerMobile}</div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-slate-800 font-medium">{b.projectName}</div>
                      <div className="text-sky-700 font-semibold text-[11px]">Unit {b.unitNumber} ({b.unitType})</div>
                    </td>
                    <td className="py-3 px-2 font-bold text-slate-900">{formatCurrency(b.totalConsideration)}</td>
                    <td className="py-3 px-2 font-semibold text-emerald-600">{formatCurrency(b.bookingAmount)}</td>
                    <td className="py-3 px-2">
                      {b.status === 'Confirmed' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
                          <CheckCircle2 className="h-3 w-3" /> Fully Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-amber-700 text-[11px]">
                          <Clock className="h-3 w-3" /> {getStepName(b.currentApprovalStep)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          b.status === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {b.status !== 'Confirmed' && (
                        <button
                          onClick={() => setApprovalModalBooking(b)}
                          className="rounded bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700 hover:bg-sky-100 transition"
                        >
                          Review Step →
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Workflow Approval Modal */}
      {approvalModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Workflow Approval Review</h3>
                <p className="text-xs text-slate-500">{approvalModalBooking.bookingNumber} • {approvalModalBooking.customerName}</p>
              </div>
              <button onClick={() => setApprovalModalBooking(null)} className="rounded p-1 text-slate-400">✕</button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-3">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Current Step</span>
                <span className="font-bold text-sky-700 text-sm">{getStepName(approvalModalBooking.currentApprovalStep)}</span>
                <p className="mt-1 text-slate-500 text-[11px]">
                  Property: {approvalModalBooking.projectName} • Unit {approvalModalBooking.unitNumber}
                </p>
                <p className="text-slate-700 font-semibold mt-1">
                  Consideration: {formatCurrency(approvalModalBooking.totalConsideration)}
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block">Approval Remarks / Verification Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Verified KYC, payment token clearance, and allotment terms."
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovalModalBooking(null)}
                  className="rounded border border-slate-200 px-3 py-1.5 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleApproveStep}
                  className="rounded bg-emerald-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Approving...' : 'Approve & Advance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">New Commercial Booking Entry</h3>
              <button onClick={() => setShowCreateModal(false)} className="rounded p-1 text-slate-400">✕</button>
            </div>

            <form onSubmit={handleCreateBooking} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block">Customer Allottee *</label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.mobile})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block">Project *</label>
                  <select
                    required
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value, unitId: '' })}
                    className="mt-1 w-full rounded border border-slate-200 p-2"
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block">Available Inventory Unit *</label>
                  <select
                    required
                    value={formData.unitId}
                    onChange={(e) => handleUnitSelect(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-200 p-2"
                  >
                    <option value="">Select Available Unit</option>
                    {availableUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        Unit {u.unitNumber} ({u.bedrooms} BHK, Floor {u.floorNumber}) - {formatCurrency(u.totalPrice)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block">Payment Plan</label>
                  <select
                    value={formData.paymentPlan}
                    onChange={(e) => setFormData({ ...formData, paymentPlan: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2"
                  >
                    <option value="Construction Linked Plan">Construction Linked Plan (CLP)</option>
                    <option value="Down Payment Plan">Down Payment Plan (10:90)</option>
                    <option value="Time Linked Plan">Time Linked Plan (Quarterly)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block">Total Agreed Consideration (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="9500000"
                    value={formData.totalConsideration}
                    onChange={(e) => setFormData({ ...formData, totalConsideration: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block">Booking Token Amount Received (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="500000"
                    value={formData.bookingAmount}
                    onChange={(e) => setFormData({ ...formData, bookingAmount: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-sky-50/70 p-3 text-sky-800 text-[11px] leading-relaxed">
                ℹ️ <strong>Atomic Double-Booking Lock:</strong> Confirming this booking instantly reserves the selected unit in PostgreSQL, generates the 6-stage construction payment milestone schedule, and automatically issues an official payment receipt for the initial booking token.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded border border-slate-200 px-3 py-1.5 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-sky-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-sky-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating Booking...' : 'Create Booking & Lock Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
