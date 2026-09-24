import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Megaphone,
  Plus,
  DollarSign,
  Target,
  Users,
  Calendar,
  CheckCircle2,
  PieChart,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { apiFetch, formatCurrency } from '../../services/apiClient.ts';
import { CurrentUser, MarketingCampaign } from '../../types/index.ts';

interface MarketingViewProps {
  user: CurrentUser | null;
  onNavigate?: (module: string) => void;
}

export const MarketingView: React.FC<MarketingViewProps> = ({ user, onNavigate }) => {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    platform: 'Meta Ads',
    budget: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-11-30',
    projectName: 'Srijan Solus',
  });

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/marketing/campaigns');
      setCampaigns(res);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/marketing/campaigns', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowCreateModal(false);
      setFormData({
        name: '',
        platform: 'Meta Ads',
        budget: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2026-11-30',
        projectName: 'Srijan Solus',
      });
      loadCampaigns();
    } catch (err: any) {
      alert(err.message || 'Failed to create campaign');
    }
  };

  const filtered = selectedPlatform === 'All'
    ? campaigns
    : campaigns.filter((c) => c.platform === selectedPlatform);

  const totalBudget = campaigns.reduce((acc, c) => acc + c.budget, 0);
  const totalSpent = campaigns.reduce((acc, c) => acc + c.spent, 0);
  const totalLeads = campaigns.reduce((acc, c) => acc + c.leadsGenerated, 0);
  const totalBookings = campaigns.reduce((acc, c) => acc + c.bookingsCount, 0);
  const totalRevenue = campaigns.reduce((acc, c) => acc + c.revenueGenerated, 0);
  const averageCpl = totalLeads > 0 ? Math.round(totalSpent / totalLeads) : 0;
  const overallRoi = totalSpent > 0 ? Math.round(((totalRevenue - totalSpent) / totalSpent) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-stone-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-amber-700" />
            <h2 className="text-lg font-bold text-stone-900">Marketing & Performance Campaigns</h2>
          </div>
          <p className="text-xs text-stone-500">
            Multi-channel ad spend, Cost Per Lead (CPL), site visit conversions, and booking ROI analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Launch Campaign</span>
          </button>
        </div>
      </div>

      {/* High-Level Metric Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <span className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Total Ad Budget</span>
          <span className="text-lg font-bold text-stone-900 mt-1 block">{formatCurrency(totalBudget)}</span>
          <span className="text-[10px] text-stone-500">Spent: {formatCurrency(totalSpent)}</span>
        </div>

        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <span className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Leads Sourced</span>
          <span className="text-lg font-bold text-amber-800 mt-1 block">{totalLeads} Leads</span>
          <span className="text-[10px] text-emerald-700 font-medium">Qualified: 42%</span>
        </div>

        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <span className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Blended CPL</span>
          <span className="text-lg font-bold text-stone-900 mt-1 block">₹{averageCpl.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-stone-500">Per verified buyer</span>
        </div>

        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <span className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Direct Bookings</span>
          <span className="text-lg font-bold text-emerald-700 mt-1 block">{totalBookings} Units</span>
          <span className="text-[10px] text-stone-500">From digital ads</span>
        </div>

        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <span className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Sourced Revenue</span>
          <span className="text-lg font-bold text-stone-900 mt-1 block">{formatCurrency(totalRevenue)}</span>
          <span className="text-[10px] text-emerald-700 font-semibold">Contract Value</span>
        </div>

        <div className="rounded-xl border border-amber-300/80 bg-amber-50/50 p-4 shadow-2xs">
          <span className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Marketing ROI</span>
          <span className="text-lg font-bold text-amber-900 mt-1 block">{overallRoi}%</span>
          <span className="text-[10px] text-amber-700 font-medium">Return on Ad Spend</span>
        </div>
      </div>

      {/* Lead Acquisition Funnel Card */}
      <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center justify-between">
          <span>Real Estate Customer Acquisition Funnel (Attributed to Marketing)</span>
          <span className="text-xs font-normal text-stone-500">Live Campaign Velocity</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          <div className="rounded-lg bg-stone-50 border border-stone-200/80 p-3 text-center">
            <span className="text-[10px] font-bold uppercase text-stone-400">1. Total Inquiries</span>
            <div className="text-xl font-bold text-stone-900 mt-1">{totalLeads}</div>
            <div className="text-[10px] text-stone-500 mt-0.5">100% Top of Funnel</div>
          </div>

          <div className="rounded-lg bg-stone-50 border border-stone-200/80 p-3 text-center">
            <span className="text-[10px] font-bold uppercase text-stone-400">2. Qualified Prospects</span>
            <div className="text-xl font-bold text-amber-800 mt-1">268</div>
            <div className="text-[10px] text-stone-500 mt-0.5">Budget & Location Match</div>
          </div>

          <div className="rounded-lg bg-stone-50 border border-stone-200/80 p-3 text-center">
            <span className="text-[10px] font-bold uppercase text-stone-400">3. Physical Site Visits</span>
            <div className="text-xl font-bold text-amber-800 mt-1">135</div>
            <div className="text-[10px] text-stone-500 mt-0.5">Sample Flat Walkthrough</div>
          </div>

          <div className="rounded-lg bg-stone-50 border border-stone-200/80 p-3 text-center">
            <span className="text-[10px] font-bold uppercase text-stone-400">4. Price Discussions</span>
            <div className="text-xl font-bold text-amber-800 mt-1">54</div>
            <div className="text-[10px] text-stone-500 mt-0.5">Active Unit Holds</div>
          </div>

          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center col-span-2 md:col-span-1">
            <span className="text-[10px] font-bold uppercase text-emerald-800">5. Signed Bookings</span>
            <div className="text-xl font-bold text-emerald-700 mt-1">{totalBookings}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">₹11.44 Cr Realization</div>
          </div>
        </div>
      </div>

      {/* Platform Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-stone-500 flex items-center gap-1 mr-1">
          <Filter className="h-3.5 w-3.5" /> Filter Platform:
        </span>
        {['All', 'Meta Ads', 'Google Ads', 'WhatsApp', 'Instagram'].map((plat) => (
          <button
            key={plat}
            onClick={() => setSelectedPlatform(plat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              selectedPlatform === plat
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {plat}
          </button>
        ))}
      </div>

      {/* Campaigns Table */}
      <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-100 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                <th className="py-3 px-2">Campaign Name</th>
                <th className="py-3 px-2">Platform</th>
                <th className="py-3 px-2">Target Project</th>
                <th className="py-3 px-2">Budget & Spent</th>
                <th className="py-3 px-2">Leads (CPL)</th>
                <th className="py-3 px-2">Visits</th>
                <th className="py-3 px-2">Bookings (Revenue)</th>
                <th className="py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50 transition">
                  <td className="py-3 px-2 font-bold text-stone-900">
                    <div>{c.name}</div>
                    <div className="text-[10px] text-stone-400 font-normal">
                      {c.startDate} to {c.endDate}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200/60">
                      {c.platform}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-medium text-stone-700">{c.projectName}</td>
                  <td className="py-3 px-2">
                    <div className="font-bold text-stone-900">{formatCurrency(c.spent)}</div>
                    <div className="text-[10px] text-stone-400">Budget: {formatCurrency(c.budget)}</div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="font-bold text-amber-800">{c.leadsGenerated} Leads</div>
                    <div className="text-[10px] text-stone-500 font-mono">CPL: ₹{c.cpl}</div>
                  </td>
                  <td className="py-3 px-2 font-semibold text-stone-700">{c.siteVisits}</td>
                  <td className="py-3 px-2">
                    <div className="font-bold text-emerald-700">{c.bookingsCount} Units</div>
                    <div className="text-[10px] text-stone-500 font-mono">{formatCurrency(c.revenueGenerated)}</div>
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        c.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Launch Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">Launch Performance Ad Campaign</h3>
              <button onClick={() => setShowCreateModal(false)} className="rounded p-1 text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block">Campaign Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navratri Festive Solus 3BHK Special"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block">Platform *</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                  >
                    <option value="Meta Ads">Meta Ads (FB/Insta)</option>
                    <option value="Google Ads">Google Ads (Search/PMax)</option>
                    <option value="WhatsApp">WhatsApp Broadcast</option>
                    <option value="Instagram">Instagram Reels</option>
                    <option value="YouTube">YouTube Video</option>
                    <option value="Hoardings">Outdoor Hoardings</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block">Allocated Budget (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="250000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block">Target Real Estate Project</label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded border border-stone-200 px-3.5 py-1.5 text-stone-600 hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-amber-700 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-amber-800 transition"
                >
                  Deploy Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
