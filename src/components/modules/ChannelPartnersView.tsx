import React, { useEffect, useState } from 'react';
import { UserCheck, Plus, Search, Percent, CheckCircle2, Shield } from 'lucide-react';
import { apiFetch, formatCurrency } from '../../services/apiClient.ts';
import { CurrentUser, ChannelPartner } from '../../types/index.ts';

interface ChannelPartnersViewProps {
  user: CurrentUser | null;
}

export const ChannelPartnersView: React.FC<ChannelPartnersViewProps> = ({ user }) => {
  const [partners, setPartners] = useState<ChannelPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    mobile: '',
    email: '',
    reraNumber: '',
    commissionRate: '2.00',
    pan: '',
  });

  const loadPartners = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/channel-partners');
      setPartners(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/channel-partners', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      loadPartners();
    } catch (err: any) {
      alert(err.message || 'Failed to create partner');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-900">Channel Partners & Real Estate Brokers</h2>
          </div>
          <p className="text-xs text-slate-500">
            Authorized realtors network, RERA certifications, commission slabs, and sourcing payouts
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-sky-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Register Channel Partner</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-2">Partner Code & Firm</th>
                <th className="py-3 px-2">Contact Person</th>
                <th className="py-3 px-2">Contact Details</th>
                <th className="py-3 px-2">RERA Certificate</th>
                <th className="py-3 px-2">Default Commission</th>
                <th className="py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partners.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 px-2">
                    <div className="font-bold text-slate-900">{p.companyName || p.name}</div>
                    <div className="font-mono text-[10px] text-sky-700">{p.partnerCode}</div>
                  </td>
                  <td className="py-3 px-2 text-slate-800 font-medium">{p.name}</td>
                  <td className="py-3 px-2 text-slate-600">
                    <div>{p.mobile}</div>
                    <div className="text-[10px] text-slate-400">{p.email}</div>
                  </td>
                  <td className="py-3 px-2 font-mono text-[11px] text-slate-700">
                    {p.reraNumber || 'Applied / Pending'}
                  </td>
                  <td className="py-3 px-2 font-bold text-sky-700">{p.commissionRate}%</td>
                  <td className="py-3 px-2">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Register Channel Partner</h3>
              <button onClick={() => setShowModal(false)} className="rounded p-1 text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block">Agency / Brokerage Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Prime Bengal Properties"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sanjay Roy"
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
                    placeholder="+91 98300 11223"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block">RERA Number</label>
                  <input
                    type="text"
                    placeholder="WBRERA/A/KOL/2024/0012"
                    value={formData.reraNumber}
                    onChange={(e) => setFormData({ ...formData, reraNumber: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded border border-slate-200 px-3 py-1.5 text-slate-600">Cancel</button>
                <button type="submit" className="rounded bg-sky-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-sky-700">Save Partner</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
