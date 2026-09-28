import React, { useEffect, useState } from 'react';
import { UserCheck, Plus, Search, Percent, CheckCircle2, Shield } from 'lucide-react';
import { apiFetch, formatCurrency } from '../../services/apiClient.ts';
import { CurrentUser, ChannelPartner } from '../../types/index.ts';
import { useMobile } from '../../context/MobileContext.tsx';

interface ChannelPartnersViewProps {
  user: CurrentUser | null;
}

export const ChannelPartnersView: React.FC<ChannelPartnersViewProps> = ({ user }) => {
  const { isMobile } = useMobile();
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-stone-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-amber-700" />
            <h2 className="font-display text-lg font-bold text-stone-900 tracking-wide">Channel Partners & Real Estate Brokers</h2>
          </div>
          <p className="text-xs text-stone-500">
            Authorized realtors network, RERA certifications, commission slabs, and sourcing payouts
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Register Channel Partner</span>
        </button>
      </div>

      {/* Mobile Partner Cards */}
      <div className={`grid grid-cols-1 gap-2.5 ${isMobile ? 'block' : 'md:hidden'}`}>
        {partners.map((p) => (
          <div
            key={`mob-cp-${p.id}`}
            className="rounded-xl border border-stone-200/90 bg-white p-3.5 shadow-xs space-y-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-num text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                  {p.partnerCode}
                </span>
                <div className="font-bold text-sm text-stone-900 mt-1">{p.companyName || p.name}</div>
                <div className="text-[11px] text-stone-500 font-num">{p.mobile}</div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200/60">
                {p.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100 text-stone-600">
              <span className="text-[11px]">RERA: <span className="font-num font-semibold">{p.reraNumber || 'Pending'}</span></span>
              <span className="font-bold font-num text-amber-800">{p.commissionRate}% Slab</span>
            </div>
          </div>
        ))}
      </div>

      <div className={`rounded-xl border border-stone-200/90 bg-white p-5 shadow-xs ${isMobile ? 'hidden' : 'hidden md:block'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-[#F8FAFC]">
                <th className="py-3 px-3">Partner Code & Firm</th>
                <th className="py-3 px-3">Contact Person</th>
                <th className="py-3 px-3">Contact Details</th>
                <th className="py-3 px-3">RERA Certificate</th>
                <th className="py-3 px-3">Default Commission</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {partners.map((p) => (
                <tr key={p.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-3">
                    <div className="font-bold text-stone-900">{p.companyName || p.name}</div>
                    <div className="font-num text-[10px] text-amber-800 font-bold">{p.partnerCode}</div>
                  </td>
                  <td className="py-3 px-3 text-stone-800 font-medium">{p.name}</td>
                  <td className="py-3 px-3 text-stone-600">
                    <div className="font-num">{p.mobile}</div>
                    <div className="text-[10px] text-stone-400">{p.email}</div>
                  </td>
                  <td className="py-3 px-3 font-num text-[11px] text-stone-700">
                    {p.reraNumber || 'Applied / Pending'}
                  </td>
                  <td className="py-3 px-3 font-bold font-num text-amber-800">{p.commissionRate}%</td>
                  <td className="py-3 px-3">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200/60">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-display text-base font-bold text-stone-900">Register Channel Partner</h3>
              <button onClick={() => setShowModal(false)} className="rounded p-1 text-stone-400 hover:text-stone-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block">Agency / Brokerage Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Prime Bengal Properties"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="mt-1 w-full rounded border border-stone-200 p-2 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 block">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sanjay Roy"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded border border-stone-200 p-2 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98300 11223"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="mt-1 w-full rounded border border-stone-200 p-2 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 block">RERA Number</label>
                  <input
                    type="text"
                    placeholder="WBRERA/A/KOL/2024/0012"
                    value={formData.reraNumber}
                    onChange={(e) => setFormData({ ...formData, reraNumber: e.target.value })}
                    className="mt-1 w-full rounded border border-stone-200 p-2 font-num focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                    className="mt-1 w-full rounded border border-stone-200 p-2 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded border border-stone-200 px-3 py-1.5 text-stone-600 hover:bg-stone-50 font-medium">Cancel</button>
                <button type="submit" className="rounded bg-amber-700 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-amber-800 transition">Save Partner</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
