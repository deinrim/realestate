import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckCircle2,
  Lock,
  Download,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { apiFetch, formatCurrency } from '../../services/apiClient.ts';
import { CurrentUser, FinanceTransaction } from '../../types/index.ts';

interface FinanceAccountsViewProps {
  user: CurrentUser | null;
}

export const FinanceAccountsView: React.FC<FinanceAccountsViewProps> = ({ user }) => {
  const [overview, setOverview] = useState<any>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Expense',
    category: 'Civil Material - TMT Steel Procurement',
    amount: '',
    paymentMode: 'Bank Transfer (RTGS)',
    referenceNumber: '',
    projectName: 'Srijan Solus',
    payeeOrPayer: '',
    description: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [ov, tx] = await Promise.all([
        apiFetch('/api/finance/overview'),
        apiFetch('/api/finance/transactions'),
      ]);
      setOverview(ov);
      setTransactions(tx);
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/finance/transactions', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({
        type: 'Expense',
        category: 'Civil Material - TMT Steel Procurement',
        amount: '',
        paymentMode: 'Bank Transfer (RTGS)',
        referenceNumber: '',
        projectName: 'Srijan Solus',
        payeeOrPayer: '',
        description: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to record transaction');
    }
  };

  const filtered = filterType === 'All'
    ? transactions
    : transactions.filter((t) => t.type === filterType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-stone-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-700" />
            <h2 className="text-lg font-bold text-stone-900">Finance, P&L & Treasury Accounts</h2>
          </div>
          <p className="text-xs text-stone-500">
            Real estate developer cashflow, project expenditure tracking, vendor payables & statutory RERA escrow balances
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Record Voucher / Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <span className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Total Realization</span>
          <span className="text-lg font-bold text-emerald-700 mt-1 block">
            {overview ? formatCurrency(overview.totalIncome) : '—'}
          </span>
          <span className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
            <ArrowUpRight className="h-3 w-3 text-emerald-600" /> Collections
          </span>
        </div>

        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <span className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Project Expenses</span>
          <span className="text-lg font-bold text-stone-900 mt-1 block">
            {overview ? formatCurrency(overview.totalExpense) : '—'}
          </span>
          <span className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
            <ArrowDownRight className="h-3 w-3 text-amber-600" /> Procurement / Civil
          </span>
        </div>

        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <span className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Net Operating Cash</span>
          <span className="text-lg font-bold text-stone-900 mt-1 block">
            {overview ? formatCurrency(overview.netOperatingCash) : '—'}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold">Positive Runway</span>
        </div>

        <div className="rounded-xl border border-amber-300/80 bg-amber-50/50 p-4 shadow-2xs">
          <span className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <Lock className="h-3 w-3 text-amber-700" /> 70% Escrow Reserve
          </span>
          <span className="text-lg font-bold text-amber-900 mt-1 block">
            {overview ? formatCurrency(overview.escrowLockedBalance) : '—'}
          </span>
          <span className="text-[10px] text-amber-700 font-medium">SBI Solus Designated</span>
        </div>

        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <span className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Upcoming Receivables</span>
          <span className="text-lg font-bold text-amber-800 mt-1 block">
            {overview ? formatCurrency(overview.totalReceivables) : '—'}
          </span>
          <span className="text-[10px] text-stone-500">CLP Slab Milestones</span>
        </div>

        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-2xs">
          <span className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Vendor Payables</span>
          <span className="text-lg font-bold text-stone-900 mt-1 block">
            {overview ? formatCurrency(overview.totalPayables) : '—'}
          </span>
          <span className="text-[10px] text-stone-500">Pending Invoices</span>
        </div>
      </div>

      {/* P&L Breakdown Banner */}
      <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center justify-between">
          <span>Project Profit & Loss Statement (Year-to-Date 2026-27)</span>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Estimated Project Gross Margin: 34.2%
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="space-y-2 p-3 rounded-lg bg-stone-50 border border-stone-200/80">
            <div className="font-bold text-stone-900 border-b border-stone-200 pb-1.5 flex justify-between">
              <span>Gross Project Sales Inflow</span>
              <span className="text-emerald-700 font-mono">₹14.30 Cr</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>• Customer Booking Tokens</span>
              <span>₹1.43 Cr</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>• Foundation & Plinth Clearances</span>
              <span>₹1.43 Cr</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>• 3rd Floor Slab Demand Remittances</span>
              <span>₹1.43 Cr</span>
            </div>
          </div>

          <div className="space-y-2 p-3 rounded-lg bg-stone-50 border border-stone-200/80">
            <div className="font-bold text-stone-900 border-b border-stone-200 pb-1.5 flex justify-between">
              <span>Direct Civil & Land Cost (COGS)</span>
              <span className="text-amber-900 font-mono">₹5.82 Cr</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>• Structural TMT Steel Rebars</span>
              <span>₹1.85 Cr</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>• Ready Mix Concrete (RMC M35)</span>
              <span>₹1.92 Cr</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>• Masonry, Plaster & MEP Works</span>
              <span>₹2.05 Cr</span>
            </div>
          </div>

          <div className="space-y-2 p-3 rounded-lg bg-stone-50 border border-stone-200/80">
            <div className="font-bold text-stone-900 border-b border-stone-200 pb-1.5 flex justify-between">
              <span>Overhead, Sourcing & Marketing</span>
              <span className="text-stone-900 font-mono">₹1.35 Cr</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>• Meta & Google Ads Ad Spend</span>
              <span>₹32.0 Lakhs</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>• Channel Partner Commissions (2%)</span>
              <span>₹28.6 Lakhs</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>• Architectural & Statutory Approvals</span>
              <span>₹74.4 Lakhs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Filter and Ledger */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-500 flex items-center gap-1 mr-1">
            <Filter className="h-3.5 w-3.5" /> Ledger Filter:
          </span>
          {(['All', 'Income', 'Expense'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filterType === t
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-100 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                <th className="py-3 px-2">Voucher Date</th>
                <th className="py-3 px-2">Type</th>
                <th className="py-3 px-2">Category & Description</th>
                <th className="py-3 px-2">Party / Payee</th>
                <th className="py-3 px-2">Ref / UTR</th>
                <th className="py-3 px-2">Amount</th>
                <th className="py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-stone-50 transition">
                  <td className="py-3 px-2 font-mono text-stone-600">{t.date}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                        t.type === 'Income'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {t.type === 'Income' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {t.type}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="font-bold text-stone-900">{t.category}</div>
                    <div className="text-[10px] text-stone-500 line-clamp-1">{t.description || t.projectName}</div>
                  </td>
                  <td className="py-3 px-2 text-stone-700 font-medium">{t.payeeOrPayer}</td>
                  <td className="py-3 px-2 font-mono text-stone-600 text-[11px]">{t.referenceNumber}</td>
                  <td className="py-3 px-2 font-bold font-mono text-stone-900">
                    {t.type === 'Income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="py-3 px-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Voucher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">Record Financial Transaction Entry</h3>
              <button onClick={() => setShowModal(false)} className="rounded p-1 text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecord} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block">Entry Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                  >
                    <option value="Expense">Expense / Outflow</option>
                    <option value="Income">Income / Inflow</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="500000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block">Accounting Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                >
                  <option value="Civil Material - TMT Steel Procurement">Civil Material - TMT Steel Procurement</option>
                  <option value="Ready Mix Concrete (RMC)">Ready Mix Concrete (RMC)</option>
                  <option value="Brickwork & Masonry Contractors">Brickwork & Masonry Contractors</option>
                  <option value="Architectural & Structural Consultancy">Architectural & Structural Consultancy</option>
                  <option value="Digital Performance Marketing">Digital Performance Marketing</option>
                  <option value="Channel Partner Sourcing Payout">Channel Partner Sourcing Payout</option>
                  <option value="Installment Collection (70% Escrow)">Installment Collection (70% Escrow)</option>
                  <option value="Booking Token Advance">Booking Token Advance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block">Party / Payee Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Vendor or Customer Name"
                    value={formData.payeeOrPayer}
                    onChange={(e) => setFormData({ ...formData, payeeOrPayer: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block">Bank Reference / UTR #</label>
                  <input
                    type="text"
                    placeholder="HDFCR92026..."
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block">Particulars / Journal Remark</label>
                <textarea
                  rows={2}
                  placeholder="Stage payment towards 3rd Floor Slab casting..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded border border-stone-200 px-3.5 py-1.5 text-stone-600 hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-amber-700 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-amber-800 transition"
                >
                  Save Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
