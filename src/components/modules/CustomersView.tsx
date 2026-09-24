import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  FileText,
  DollarSign,
  Building,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { apiFetch, formatCurrency } from '../../services/apiClient.ts';
import { CurrentUser, Customer } from '../../types/index.ts';

interface CustomersViewProps {
  user: CurrentUser | null;
  onNavigate: (module: string, params?: any) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ user, onNavigate }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    city: 'Kolkata',
    state: 'West Bengal',
    pan: '',
    gstin: '',
    occupation: '',
    communicationPreference: 'WhatsApp',
  });

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const data = await apiFetch(`/api/customers${query}`);
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const openCustomer360 = async (id: number) => {
    try {
      const data = await apiFetch(`/api/customers/${id}`);
      setSelectedCustomer(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowCreateModal(false);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-stone-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-700" />
            <h2 className="text-lg font-bold text-stone-900">Customer 360° Repository</h2>
          </div>
          <p className="text-xs text-stone-500">
            Unified homeowner profiles, KYC verification, purchase history, and service interactions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search customer name, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-[#FAF8F5] py-1.5 pl-8 pr-3 text-xs focus:border-amber-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-100"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Customer Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-2">Customer Code & Name</th>
                <th className="py-3 px-2">Contact Info</th>
                <th className="py-3 px-2">Location</th>
                <th className="py-3 px-2">PAN / KYC</th>
                <th className="py-3 px-2">Bookings</th>
                <th className="py-3 px-2">Total Collections Paid</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => openCustomer360(c.id)}
                  className="hover:bg-slate-50 transition cursor-pointer"
                >
                  <td className="py-3 px-2">
                    <div className="font-bold text-stone-800">{c.name}</div>
                    <div className="font-mono text-[10px] text-amber-800 font-bold">{c.customerCode}</div>
                  </td>
                  <td className="py-3 px-2 text-stone-700">
                    <div className="font-medium">{c.mobile}</div>
                    <div className="text-[10px] text-stone-400">{c.email}</div>
                  </td>
                  <td className="py-3 px-2 text-stone-600">{c.city || 'Kolkata'}, {c.state || 'WB'}</td>
                  <td className="py-3 px-2 font-mono text-[11px] text-stone-700">{c.pan || 'Pending KYC'}</td>
                  <td className="py-3 px-2">
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200/60">
                      {c.bookingsCount || 0} Units
                    </span>
                  </td>
                  <td className="py-3 px-2 font-semibold text-emerald-700">
                    {formatCurrency(c.totalPaid)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openCustomer360(c.id);
                      }}
                      className="rounded px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition"
                    >
                      360° Profile →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer 360 Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-stone-900">{selectedCustomer.customer.name}</h3>
                  <span className="font-mono text-xs rounded bg-amber-50 px-1.5 py-0.5 text-amber-800 font-bold border border-amber-200/60">
                    {selectedCustomer.customer.customerCode}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {selectedCustomer.customer.mobile} • {selectedCustomer.customer.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* KYC & Identity Summary */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg bg-slate-50 p-3 text-xs">
              <div>
                <span className="block text-[10px] text-slate-400">PAN Card</span>
                <span className="font-mono font-bold text-slate-800">{selectedCustomer.customer.pan || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">GSTIN</span>
                <span className="font-mono font-bold text-slate-800">{selectedCustomer.customer.gstin || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">Occupation</span>
                <span className="font-medium text-slate-800">{selectedCustomer.customer.occupation || 'Business'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-stone-400">Pref. Channel</span>
                <span className="font-medium text-amber-800 font-semibold">{selectedCustomer.customer.communicationPreference}</span>
              </div>
            </div>

            {/* Owned Properties / Bookings */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Booked Properties ({selectedCustomer.bookings.length})
              </h4>
              <div className="mt-2 space-y-2">
                {selectedCustomer.bookings.length > 0 ? (
                  selectedCustomer.bookings.map((b: any) => (
                    <div
                      key={b.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-slate-200 p-3 text-xs gap-2"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {b.projectName} • Unit {b.unitNumber} ({b.unitType})
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{b.bookingNumber} • Booked: {b.bookingDate}</div>
                      </div>
                      <div className="text-right sm:text-right">
                        <div className="font-bold text-slate-900">{formatCurrency(b.totalConsideration)}</div>
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No active bookings yet.</p>
                )}
              </div>
            </div>

            {/* Payment Ledger */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Payment Collections History
              </h4>
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Receipt #</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Mode</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedCustomer.payments?.length > 0 ? (
                      selectedCustomer.payments.map((p: any) => (
                        <tr key={p.id}>
                          <td className="py-2 px-3 font-mono font-bold text-amber-800">{p.receiptNumber}</td>
                          <td className="py-2 px-3 text-stone-600">{p.paymentDate}</td>
                          <td className="py-2 px-3 text-stone-600">{p.paymentMode}</td>
                          <td className="py-2 px-3 font-bold text-stone-900">{formatCurrency(p.amount)}</td>
                          <td className="py-2 px-3 text-emerald-700 font-semibold">{p.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-3 text-center text-slate-400">No receipts recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Customer Record</h3>
              <button onClick={() => setShowCreateModal(false)} className="rounded p-1 text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Debasish Bhattacharya"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98310 99887"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="debasish@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block">PAN Number</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2 uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block">Permanent Postal Address</label>
                <input
                  type="text"
                  placeholder="Flat 4B, 12 Park Street, Kolkata - 700016"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded border border-stone-200 px-3 py-1.5 text-stone-600 hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-amber-700 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-amber-800 transition"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
