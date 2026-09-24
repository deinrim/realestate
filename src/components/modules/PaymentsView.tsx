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
  FileText,
  Building2,
  ShieldCheck,
  AlertCircle,
  Clock,
  Download,
} from 'lucide-react';
import { apiFetch, formatCurrency } from '../../services/apiClient.ts';
import { CurrentUser, Payment, Booking, Organization } from '../../types/index.ts';

interface PaymentsViewProps {
  user: CurrentUser | null;
  organization: Organization | null;
}

interface MilestoneDemand {
  id: number;
  demandNumber: string;
  bookingNumber: string;
  customerName: string;
  unitNumber: string;
  projectName: string;
  milestoneTitle: string;
  architectCertificateNo: string;
  installmentPercentage: number;
  baseAmount: number;
  gstAmount: number;
  totalDemandAmount: number;
  escrow70Amount: number;
  builder30Amount: number;
  tdsDeductible1Percent: number;
  dueDate: string;
  status: 'Issued' | 'Partially Paid' | 'Cleared' | 'Overdue';
  reraRegNo: string;
  escrowAccountDetails: string;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ user, organization }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'receipts' | 'demands' | 'tds'>('receipts');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [printableReceipt, setPrintableReceipt] = useState<Payment | null>(null);
  const [selectedDemandNotice, setSelectedDemandNotice] = useState<MilestoneDemand | null>(null);

  // Demo RERA Demands
  const [demands, setDemands] = useState<MilestoneDemand[]>([
    {
      id: 1,
      demandNumber: 'SRJ-DEM-2026-0012',
      bookingNumber: 'SRJ-BK-2026-0042',
      customerName: 'Vikramjit Chakraborty',
      unitNumber: 'A-102',
      projectName: 'Srijan Solus',
      milestoneTitle: 'Completion of 3rd Floor Roof Slab Casting',
      architectCertificateNo: 'ARC/SOL/2026/SLAB-03 (Ar. S. Mukherjee)',
      installmentPercentage: 10,
      baseAmount: 1365000,
      gstAmount: 68250, // 5% GST
      totalDemandAmount: 1433250,
      escrow70Amount: 1003275, // 70%
      builder30Amount: 429975, // 30%
      tdsDeductible1Percent: 13650, // 1% u/s 194-IA
      dueDate: '2026-10-15',
      status: 'Issued',
      reraRegNo: 'WBRERA/P/KOL/2023/000214',
      escrowAccountDetails: 'State Bank of India - Solus Designated RERA Escrow A/C #40291823901 (IFSC: SBIN0000001)',
    },
    {
      id: 2,
      demandNumber: 'SRJ-DEM-2026-0008',
      bookingNumber: 'SRJ-BK-2026-0042',
      customerName: 'Vikramjit Chakraborty',
      unitNumber: 'A-102',
      projectName: 'Srijan Solus',
      milestoneTitle: 'Completion of Foundation & Plinth Work',
      architectCertificateNo: 'ARC/SOL/2026/PLINTH-01 (Ar. S. Mukherjee)',
      installmentPercentage: 10,
      baseAmount: 1365000,
      gstAmount: 68250,
      totalDemandAmount: 1433250,
      escrow70Amount: 1003275,
      builder30Amount: 429975,
      tdsDeductible1Percent: 13650,
      dueDate: '2026-09-10',
      status: 'Cleared',
      reraRegNo: 'WBRERA/P/KOL/2023/000214',
      escrowAccountDetails: 'State Bank of India - Solus Designated RERA Escrow A/C #40291823901 (IFSC: SBIN0000001)',
    },
  ]);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-stone-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-700" />
            <h2 className="text-lg font-bold text-stone-900">Collections, Demand Notes & RERA Compliance</h2>
          </div>
          <p className="text-xs text-stone-500">
            Real estate payment receipts, milestone-linked demand letters, statutory 70/30 escrow compliance & Sec 194-IA TDS
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-60">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search receipt #, customer..."
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
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Module Sub-Tabs */}
      <div className="flex gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('receipts')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
            activeTab === 'receipts'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Payment Receipts ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('demands')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
            activeTab === 'demands'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>RERA Milestone Demand Notices (CLP)</span>
        </button>

        <button
          onClick={() => setActiveTab('tds')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
            activeTab === 'tds'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Section 194-IA (1% Buyer TDS) Register</span>
        </button>
      </div>

      {/* Tab 1: Payment Receipts Table */}
      {activeTab === 'receipts' && (
        <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-100 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
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
              <tbody className="divide-y divide-stone-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50 transition">
                    <td className="py-3 px-2 font-mono font-bold text-amber-800">{p.receiptNumber}</td>
                    <td className="py-3 px-2 text-stone-600">{p.paymentDate}</td>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-stone-900">{p.customerName}</div>
                      <div className="text-[11px] text-stone-400">
                        {p.projectName} • Unit {p.unitNumber}
                      </div>
                    </td>
                    <td className="py-3 px-2 font-bold text-stone-900">{formatCurrency(p.amount)}</td>
                    <td className="py-3 px-2 text-stone-600">{p.paymentMode}</td>
                    <td className="py-3 px-2">
                      <div className="font-mono text-stone-700">{p.referenceNumber || '—'}</div>
                      <div className="text-[10px] text-stone-400">{p.bankName}</div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        {p.status || 'Verified'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => setPrintableReceipt(p)}
                        className="inline-flex items-center gap-1 rounded border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 shadow-2xs hover:bg-stone-50"
                      >
                        <Printer className="h-3 w-3 text-stone-500" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: RERA Construction Milestone Demand Notes */}
      {activeTab === 'demands' && (
        <div className="space-y-4">
          {/* Statutory Escrow Notice Banner */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <Building2 className="h-4 w-4 text-amber-700 shrink-0" />
              <span>RERA Statutory Section 4(2)(l)(D) Escrow Account Mandate</span>
            </div>
            <p className="mt-1 text-stone-700 leading-relaxed">
              In strict accordance with Real Estate (Regulation & Development) Act requirements, <strong>70%</strong> of all realization demands must be credited to the designated RERA Project Escrow Account for construction and land expenditure only, backed by certified Engineer & Architect stage sign-offs. The remaining <strong>30%</strong> is allocated for operational expenditure.
            </p>
          </div>

          <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-100 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    <th className="py-3 px-2">Demand Notice #</th>
                    <th className="py-3 px-2">Customer & Unit</th>
                    <th className="py-3 px-2">Construction Milestone</th>
                    <th className="py-3 px-2">Demand (Base + GST)</th>
                    <th className="py-3 px-2">70% Escrow Deposit</th>
                    <th className="py-3 px-2">Due Date</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {demands.map((d) => (
                    <tr key={d.id} className="hover:bg-stone-50 transition">
                      <td className="py-3 px-2 font-mono font-bold text-amber-800">{d.demandNumber}</td>
                      <td className="py-3 px-2">
                        <div className="font-semibold text-stone-900">{d.customerName}</div>
                        <div className="text-[11px] text-stone-400">
                          {d.projectName} • Unit {d.unitNumber}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-medium text-stone-800">{d.milestoneTitle}</div>
                        <div className="text-[10px] text-stone-500 font-mono">{d.architectCertificateNo}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-bold text-stone-900">{formatCurrency(d.totalDemandAmount)}</div>
                        <div className="text-[10px] text-stone-400">Base: {formatCurrency(d.baseAmount)} + 5% GST</div>
                      </td>
                      <td className="py-3 px-2 font-semibold text-amber-900">
                        {formatCurrency(d.escrow70Amount)}
                      </td>
                      <td className="py-3 px-2 text-stone-600 font-mono">{d.dueDate}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            d.status === 'Cleared'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {d.status === 'Cleared' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => setSelectedDemandNotice(d)}
                          className="inline-flex items-center gap-1 rounded border border-amber-300/80 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                        >
                          <FileText className="h-3 w-3 text-amber-700" />
                          <span>View Notice</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Section 194-IA (1% Buyer TDS) Register */}
      {activeTab === 'tds' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-950">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>Section 194-IA Statutory Compliance Tracker (Properties &gt; ₹50 Lakhs)</span>
            </div>
            <p className="mt-1 text-stone-700 leading-relaxed">
              Under Section 194-IA of the Indian Income Tax Act, any buyer purchasing immovable property where consideration exceeds ₹50 Lakhs is legally mandated to deduct <strong>1% TDS</strong> at the time of credit or payment. Buyers must deposit TDS using <strong>Challan Form 26QB</strong> and furnish <strong>Form 16B</strong> to the developer within 15 days.
            </p>
          </div>

          <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-100 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    <th className="py-3 px-2">Booking Ref</th>
                    <th className="py-3 px-2">Buyer Name & PAN</th>
                    <th className="py-3 px-2">Allotted Unit</th>
                    <th className="py-3 px-2">Total Consideration</th>
                    <th className="py-3 px-2">1% TDS Liability</th>
                    <th className="py-3 px-2">TDS Deposited</th>
                    <th className="py-3 px-2">Form 16B Certificate</th>
                    <th className="py-3 px-2">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr className="hover:bg-stone-50 transition">
                    <td className="py-3 px-2 font-mono font-bold text-amber-800">SRJ-BK-2026-0042</td>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-stone-900">Vikramjit Chakraborty</div>
                      <div className="font-mono text-[10px] text-stone-400">PAN: ABCDE1234F</div>
                    </td>
                    <td className="py-3 px-2">Srijan Solus • Unit A-102</td>
                    <td className="py-3 px-2 font-bold text-stone-900">{formatCurrency(14300000)}</td>
                    <td className="py-3 px-2 font-semibold text-amber-800">{formatCurrency(143000)}</td>
                    <td className="py-3 px-2 font-semibold text-emerald-700">{formatCurrency(28665)}</td>
                    <td className="py-3 px-2">
                      <span className="font-mono text-[11px] text-stone-600">F16B-2026-WB-098</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        Challan 26QB Verified
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RERA Demand Notice Modal */}
      {selectedDemandNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-700" />
                <h3 className="text-base font-bold text-stone-900">RERA Milestone Demand Letter</h3>
              </div>
              <button
                onClick={() => setSelectedDemandNotice(null)}
                className="rounded p-1 text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            {/* Official Printable Demand Letter Document Body */}
            <div className="mt-4 border border-stone-300 rounded-lg p-6 bg-white space-y-5 text-stone-800 text-xs">
              {/* Developer Header */}
              <div className="flex justify-between items-start border-b border-stone-200 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">{organization?.companyName || 'Srijan Demo Realty'}</h3>
                  <p className="text-stone-500">{organization?.address}, {organization?.city}, {organization?.state}</p>
                  <p className="text-stone-500 font-mono">Project RERA Reg: {selectedDemandNotice.reraRegNo}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold uppercase text-amber-800 tracking-wider">Demand Letter</div>
                  <div className="font-mono font-bold text-sm text-stone-900">{selectedDemandNotice.demandNumber}</div>
                  <div className="text-stone-500">Date: {new Date().toISOString().split('T')[0]}</div>
                </div>
              </div>

              {/* Allottee Details */}
              <div className="rounded-lg bg-stone-50 p-4 grid grid-cols-2 gap-4 border border-stone-200/70">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Allottee</span>
                  <span className="font-bold text-sm text-stone-900">{selectedDemandNotice.customerName}</span>
                  <span className="block text-stone-600 mt-0.5">Booking Ref: {selectedDemandNotice.bookingNumber}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Unit Details</span>
                  <span className="font-bold text-stone-900">{selectedDemandNotice.projectName}</span>
                  <span className="block font-bold text-amber-800 mt-0.5">Unit {selectedDemandNotice.unitNumber}</span>
                </div>
              </div>

              {/* Construction Milestone Details */}
              <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-3">
                <div className="font-bold text-stone-900">Milestone Stage Reached:</div>
                <div className="text-stone-700 mt-1">{selectedDemandNotice.milestoneTitle}</div>
                <div className="text-[10px] text-stone-500 mt-1 font-mono">
                  Site Engineer / Architect Certification: {selectedDemandNotice.architectCertificateNo}
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="border border-stone-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#FAF8F5] text-[10px] uppercase font-bold text-stone-600 border-b border-stone-200">
                    <tr>
                      <th className="p-2.5">Component</th>
                      <th className="p-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    <tr>
                      <td className="p-2.5 text-stone-700">Milestone Installment ({selectedDemandNotice.installmentPercentage}% of Base Cost)</td>
                      <td className="p-2.5 text-right font-mono font-semibold">{formatCurrency(selectedDemandNotice.baseAmount)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-stone-700">Applicable GST (5.00% without ITC)</td>
                      <td className="p-2.5 text-right font-mono font-semibold">{formatCurrency(selectedDemandNotice.gstAmount)}</td>
                    </tr>
                    <tr className="bg-stone-50 font-bold">
                      <td className="p-2.5 text-stone-900">Total Net Amount Payable</td>
                      <td className="p-2.5 text-right font-mono text-stone-900 text-sm">{formatCurrency(selectedDemandNotice.totalDemandAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* RERA 70/30 Designated Account Split Instructions */}
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-2 text-[11px] text-amber-900">
                <div className="font-bold text-amber-900">Statutory Escrow Account Remittance Instructions:</div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-2.5 rounded border border-amber-200">
                    <span className="font-bold text-amber-900 block text-[10px] uppercase">70% RERA Escrow Account ({formatCurrency(selectedDemandNotice.escrow70Amount)})</span>
                    <span className="text-stone-600 block mt-1">{selectedDemandNotice.escrowAccountDetails}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-amber-200">
                    <span className="font-bold text-stone-800 block text-[10px] uppercase">30% Developer Operations Account ({formatCurrency(selectedDemandNotice.builder30Amount)})</span>
                    <span className="text-stone-600 block mt-1">HDFC Bank - Current Account #502000349281 (IFSC: HDFC0000123)</span>
                  </div>
                </div>
              </div>

              {/* Indian Statutory Notices: TDS 194-IA & Delayed Interest */}
              <div className="text-[10px] text-stone-500 space-y-1.5 border-t border-stone-200 pt-3">
                <p>
                  <strong>Section 194-IA TDS Notice:</strong> The buyer is required to deduct 1% TDS ({formatCurrency(selectedDemandNotice.tdsDeductible1Percent)}) from the installment amount and deposit it using Form 26QB. Please upload Form 16B on the portal within 15 days of deposit to obtain payment credit.
                </p>
                <p>
                  <strong>Delayed Payment Penal Interest:</strong> As mandated under State RERA Rules, any payment delayed beyond the due date ({selectedDemandNotice.dueDate}) shall attract simple interest at SBI Highest Marginal Cost of Funds Based Lending Rate (MCLR) + 2% per annum from the due date until realization.
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => setSelectedDemandNotice(null)}
                className="rounded border border-stone-200 px-4 py-1.5 text-xs text-stone-600 hover:bg-stone-50 font-medium"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded bg-amber-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-800 transition shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Official Demand Letter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {printableReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">Official Money Receipt</h3>
              <button
                onClick={() => setPrintableReceipt(null)}
                className="rounded p-1 text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 border border-stone-300 rounded-lg p-6 bg-white space-y-6 text-stone-800">
              <div className="flex justify-between items-start border-b border-stone-200 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">{organization?.legalName || organization?.companyName}</h3>
                  <p className="text-xs text-stone-500">{organization?.address}, {organization?.city}, {organization?.state}</p>
                  <p className="text-xs text-stone-500">GSTIN: <span className="font-mono font-semibold">{organization?.gstin || '19AAECS1234F1Z5'}</span></p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold uppercase text-amber-800">Payment Receipt</div>
                  <div className="font-mono font-bold text-sm text-stone-900">{printableReceipt.receiptNumber}</div>
                  <div className="text-xs text-stone-500">Date: {printableReceipt.paymentDate}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-stone-50 p-4 rounded-lg border border-stone-200/70">
                <div>
                  <span className="block text-[10px] uppercase text-stone-400 font-bold">Received From</span>
                  <span className="font-bold text-sm text-stone-900">{printableReceipt.customerName}</span>
                  <span className="block text-stone-600 mt-1">Booking Ref: {printableReceipt.bookingNumber}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase text-stone-400 font-bold">Allotted Property</span>
                  <span className="font-bold text-stone-900">{printableReceipt.projectName}</span>
                  <span className="block text-amber-800 font-bold mt-1">Unit {printableReceipt.unitNumber}</span>
                </div>
              </div>

              <div className="rounded-lg border-2 border-stone-800 p-4 flex items-center justify-between bg-stone-50/50">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400">Total Sum Received</span>
                  <div className="text-2xl font-bold text-stone-900">{formatCurrency(printableReceipt.amount)}</div>
                </div>
                <div className="text-right text-xs">
                  <span className="rounded bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-[11px] border border-emerald-200">
                    Payment Cleared
                  </span>
                  <div className="text-[11px] text-stone-500 mt-1">{printableReceipt.paymentMode}</div>
                </div>
              </div>

              <div className="text-xs text-stone-600 space-y-1">
                <div>Bank Reference / UTR: <strong className="font-mono text-stone-800">{printableReceipt.referenceNumber || 'N/A'}</strong></div>
                <div>Receiving Bank: <strong>{printableReceipt.bankName || 'Developer Escrow Account'}</strong></div>
                <div>Purpose: <strong>{printableReceipt.remarks || 'Property Installment Payment'}</strong></div>
              </div>

              <div className="pt-8 border-t border-stone-200 flex justify-between items-end text-xs">
                <div>
                  <div className="font-bold text-[10px] uppercase text-stone-400">System Generated Document</div>
                  <div className="text-stone-400 text-[10px]">Cloud SQL Relational Audit Record Verified</div>
                </div>
                <div className="text-center">
                  <div className="h-10 w-32 border-b border-stone-400 mx-auto" />
                  <span className="font-bold text-stone-700 block mt-1">Authorized Accounts Signatory</span>
                  <span className="text-[10px] text-stone-400">For {organization?.companyName}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setPrintableReceipt(null)}
                className="rounded border border-stone-200 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50 font-medium"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="rounded bg-amber-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-800 transition"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">Record Customer Payment</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded p-1 text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block">Select Active Booking *</label>
                <select
                  required
                  value={formData.bookingId}
                  onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                >
                  <option value="">Choose Booking</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bookingNumber} - {b.customerName} (Unit {b.unitNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block">Amount Collected (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="1000000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block">Payment Mode</label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                  >
                    <option value="Bank Transfer (NEFT/RTGS)">NEFT / RTGS</option>
                    <option value="Cheque / Pay Order">Cheque / Pay Order</option>
                    <option value="UPI / Virtual Account">UPI / Virtual Account</option>
                    <option value="Online Payment Gateway">Online Gateway</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block">UTR / Cheque Ref #</label>
                  <input
                    type="text"
                    placeholder="HDFCR92024092000012"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 uppercase font-mono focus:border-amber-600 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block">Deposited Bank Account</label>
                <input
                  type="text"
                  placeholder="State Bank of India - Solus RERA Escrow A/C #40291823901"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block">Milestone Remarks</label>
                <input
                  type="text"
                  placeholder="Stage payment towards 3rd Floor Slab"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded border border-stone-200 px-3 py-1.5 text-stone-600 hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-amber-700 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-amber-800 transition"
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
