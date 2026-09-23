import React, { useEffect, useState } from 'react';
import { Headphones, Plus, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../../services/apiClient.ts';
import { CurrentUser, Complaint, Customer } from '../../types/index.ts';

interface ComplaintsViewProps {
  user: CurrentUser | null;
}

export const ComplaintsView: React.FC<ComplaintsViewProps> = ({ user }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const [formData, setFormData] = useState({
    customerId: '',
    category: 'Snag List & Civil',
    priority: 'Medium',
    description: '',
  });

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const [cList, custList] = await Promise.all([
        apiFetch('/api/complaints'),
        apiFetch('/api/customers'),
      ]);
      setComplaints(cList);
      setCustomers(custList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/complaints', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      loadComplaints();
    } catch (err: any) {
      alert(err.message || 'Failed to log ticket');
    }
  };

  const handleResolve = async () => {
    if (!selectedTicket) return;
    try {
      await apiFetch(`/api/complaints/${selectedTicket.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Resolved', resolution: resolutionText }),
      });
      setSelectedTicket(null);
      setResolutionText('');
      loadComplaints();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve ticket');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-900">Customer Support & Snag Management</h2>
          </div>
          <p className="text-xs text-slate-500">
            Post-sales handover tickets, snag checklist rectifications, and SLA countdowns
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-sky-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Log Service Ticket</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-2">Ticket #</th>
                <th className="py-3 px-2">Customer / Allottee</th>
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2">Issue Description</th>
                <th className="py-3 px-2">Priority</th>
                <th className="py-3 px-2">SLA</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-3 px-2 font-mono font-bold text-slate-900">{c.ticketNumber}</td>
                  <td className="py-3 px-2 font-medium text-slate-800">{c.customerName}</td>
                  <td className="py-3 px-2 text-slate-600">{c.category}</td>
                  <td className="py-3 px-2 text-slate-700 max-w-xs truncate">{c.description}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        c.priority === 'Urgent'
                          ? 'bg-rose-50 text-rose-700'
                          : c.priority === 'High'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {c.priority}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-500 font-semibold">{c.slaDays} Days</td>
                  <td className="py-3 px-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        c.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    {c.status !== 'Resolved' && (
                      <button
                        onClick={() => setSelectedTicket(c)}
                        className="rounded px-2 py-1 text-[11px] font-semibold text-sky-600 hover:bg-sky-50"
                      >
                        Resolve →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Resolve Ticket: {selectedTicket.ticketNumber}</h3>
            <p className="mt-1 text-xs text-slate-500">{selectedTicket.description}</p>
            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-700 block">Resolution Remarks</label>
              <textarea
                rows={3}
                required
                placeholder="Engineer attended on site. Replaced plumbing valve and verified with customer."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 p-2 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <button onClick={() => setSelectedTicket(null)} className="rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-600">Cancel</button>
              <button onClick={handleResolve} className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">Mark Resolved</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Log Customer Complaint</h3>
              <button onClick={() => setShowModal(false)} className="rounded p-1 text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
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
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2"
                  >
                    <option value="Snag List & Civil">Snag List & Civil</option>
                    <option value="Plumbing & Sanitary">Plumbing & Sanitary</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Possession Delay">Possession Delay</option>
                    <option value="Agreement Modification">Agreement Modification</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2"
                  >
                    <option value="Low">Low (7 days SLA)</option>
                    <option value="Medium">Medium (3 days SLA)</option>
                    <option value="High">High (24 hours SLA)</option>
                    <option value="Urgent">Urgent (4 hours SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block">Description of Issue *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Seepage observed in master bathroom wall post handover inspection..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded border border-slate-200 px-3 py-1.5 text-slate-600">Cancel</button>
                <button type="submit" className="rounded bg-sky-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-sky-700">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
