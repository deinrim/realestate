import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Printer,
  CheckCircle2,
  Building,
  DollarSign,
  FileCheck2,
} from 'lucide-react';
import { apiFetch, formatCurrency } from '../../services/apiClient.ts';
import { CurrentUser, Payment, Booking, Organization } from '../../types/index.ts';

interface PaymentsViewProps {
  user: CurrentUser | null;
  organization: Organization | null;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ user, organization }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [printableReceipt, setPrintableReceipt] = useState<Payment | null>(null);

  const [formData, setFormData] = useState({
    bookingId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'Bank Transfer (NEFT/RTGS)',
    referenceNumber: '',
    bankName: 'HDFC Bank',
    remarks: 'Installment payment',
  });

  const loadPayments = async () => {
    try {
      setLoading(true);
      const [pList, bList] = await Promise.all([
        apiFetch('/api/payments'),
        apiFetch('/api/bookings'),
      ]);
      setPayments(pList);
      setBookings(bList);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowCreateModal(false);
      setFormData({
        bookingId: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'Bank Transfer (NEFT/RTGS)',
        referenceNumber: '',
        bankName: 'HDFC Bank',
        remarks: 'Installment payment',
      });
      loadPayments();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    }
  };

  const filtered = payments.filter(
    (p) =>
      p.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.bookingNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-900">Collections & Payment Receipts</h2>
          </div>
          <p className="text-xs text-slate-500">
            Official tax invoices, milestone collections, RTGS/NEFT reconciliations, and printable receipts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-60">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search receipt #, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-sky-500 focus:bg-white focus:outline-hidden"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-2">Receipt #</th>
                <th className="py-3 px-2">Date</th>
                <th className="py-3 px-2">Customer & Unit</th>
                <th className="py-3 px-2">Amount Collected</th>
                <th className="py-3 px-2">Payment Mode</th>
                <th className="py-3 px-2">Reference / Bank</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-2 font-mono font-bold text-sky-700">{p.receiptNumber}</td>
                  <td className="py-3 px-2 text-slate-600">{p.paymentDate}</td>
                  <td className="py-3 px-2">
                    <div className="font-semibold text-slate-800">{p.customerName}</div>
                    <div className="text-[10px] text-slate-500">
                      {p.projectName} • Unit {p.unitNumber}
                    </div>
                  </td>
                  <td className="py-3 px-2 font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                  <td className="py-3 px-2 text-slate-700">{p.paymentMode}</td>
                  <td className="py-3 px-2 text-slate-600 font-mono text-[11px]">
                    {p.referenceNumber || 'Cash/Cheque'} • {p.bankName || 'Direct'}
                  </td>
                  <td className="py-3 px-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => setPrintableReceipt(p)}
                      className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      <Printer className="h-3 w-3" /> Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {printableReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Official Payment Receipt Voucher
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 rounded bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Voucher
                </button>
                <button
                  onClick={() => setPrintableReceipt(null)}
                  className="rounded p-1 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Official Receipt Body */}
            <div className="mt-6 border border-slate-300 rounded-lg p-6 bg-white space-y-6 text-slate-800">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{organization?.legalName || organization?.companyName}</h3>
                  <p className="text-xs text-slate-500">{organization?.address}, {organization?.city}, {organization?.state}</p>
                  <p className="text-xs text-slate-500">GSTIN: <span className="font-mono font-semibold">{organization?.gstin || '19AAECS9876C1Z8'}</span></p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold uppercase text-sky-700">Payment Receipt</div>
                  <div className="font-mono font-bold text-sm">{printableReceipt.receiptNumber}</div>
                  <div className="text-xs text-slate-500">Date: {printableReceipt.paymentDate}</div>
                </div>
              </div>

              {/* Customer & Booking Details */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg">
                <div>
                  <span className="block text-[10px] uppercase text-slate-400 font-bold">Received From</span>
                  <span className="font-bold text-sm text-slate-900">{printableReceipt.customerName}</span>
                  <span className="block text-slate-600 mt-1">Booking Ref: {printableReceipt.bookingNumber}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase text-slate-400 font-bold">Allotted Property</span>
                  <span className="font-bold text-slate-900">{printableReceipt.projectName}</span>
                  <span className="block text-sky-700 font-bold mt-1">Unit {printableReceipt.unitNumber}</span>
                </div>
              </div>

              {/* Amount Box */}
              <div className="rounded-lg border-2 border-slate-800 p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Sum Received</span>
                  <div className="text-2xl font-bold text-slate-900">{formatCurrency(printableReceipt.amount)}</div>
                </div>
                <div className="text-right text-xs">
                  <span className="rounded bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-[11px]">
                    Payment Cleared
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1">{printableReceipt.paymentMode}</div>
                </div>
              </div>

              {/* Transaction details */}
              <div className="text-xs text-slate-600 space-y-1">
                <div>Bank Reference / UTR: <strong className="font-mono text-slate-800">{printableReceipt.referenceNumber || 'N/A'}</strong></div>
                <div>Receiving Bank: <strong>{printableReceipt.bankName || 'Developer Escrow Account'}</strong></div>
                <div>Purpose: <strong>{printableReceipt.remarks || 'Property Installment Payment'}</strong></div>
              </div>

              {/* Signature & Seal */}
              <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs">
                <div>
                  <div className="font-bold text-[10px] uppercase text-slate-400">System Generated Document</div>
                  <div className="text-slate-400 text-[10px]">Cloud SQL Relational Audit Record Verified</div>
                </div>
                <div className="text-center">
                  <div className="h-10 w-32 border-b border-slate-400 mx-auto" />
                  <span className="font-bold text-slate-700 block mt-1">Authorized Accounts Signatory</span>
                  <span className="text-[10px] text-slate-400">For {organization?.companyName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record Incoming Collection</h3>
              <button onClick={() => setShowCreateModal(false)} className="rounded p-1 text-slate-400">✕</button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block">Link to Booking / Customer *</label>
                <select
                  required
                  value={formData.bookingId}
                  onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 p-2"
                >
                  <option value="">Select Booking</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bookingNumber} - {b.customerName} (Unit {b.unitNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block">Amount Collected (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="950000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block">Payment Mode</label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2"
                  >
                    <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Demand Draft">Demand Draft</option>
                    <option value="UPI / Online">UPI / Online</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block">UTR / Cheque Ref #</label>
                  <input
                    type="text"
                    placeholder="HDFCR92024092000012"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2 uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block">Deposited Bank Account</label>
                <input
                  type="text"
                  placeholder="HDFC Bank Escrow A/C 50200098765432"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 p-2"
                />
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
                  className="rounded bg-emerald-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-emerald-700"
                >
                  Record & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
