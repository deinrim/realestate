import React, { useEffect, useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, Layers, CreditCard, Users, Compass } from 'lucide-react';
import { apiFetch, exportToCsv, formatCurrency } from '../../services/apiClient.ts';
import { CurrentUser } from '../../types/index.ts';

interface ReportsViewProps {
  user: CurrentUser | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'collections' | 'inventory' | 'leads'>('sales');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReport = async (type: string) => {
    try {
      setLoading(true);
      if (type === 'sales') {
        const bookings = await apiFetch('/api/bookings');
        setData(bookings);
      } else if (type === 'collections') {
        const payments = await apiFetch('/api/payments');
        setData(payments);
      } else if (type === 'inventory') {
        const units = await apiFetch('/api/inventory/units');
        setData(units);
      } else if (type === 'leads') {
        const leads = await apiFetch('/api/leads');
        setData(leads);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(activeTab);
  }, [activeTab]);

  const handleExport = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportToCsv(`auraestate_${activeTab}_report_${timestamp}`, data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-900">Analytics & Enterprise Reports</h2>
          </div>
          <p className="text-xs text-slate-500">
            Real-time financial audits, booking velocity, inventory aging, and CSV data exports
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
        >
          <Download className="h-4 w-4" />
          <span>Export {activeTab.toUpperCase()} to CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-3 border-b-2 transition ${activeTab === 'sales' ? 'border-sky-600 text-sky-600' : 'border-transparent hover:text-slate-800'}`}
        >
          Sales & Bookings Ledger
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`pb-3 border-b-2 transition ${activeTab === 'collections' ? 'border-sky-600 text-sky-600' : 'border-transparent hover:text-slate-800'}`}
        >
          Collections & Receipts
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 border-b-2 transition ${activeTab === 'inventory' ? 'border-sky-600 text-sky-600' : 'border-transparent hover:text-slate-800'}`}
        >
          Inventory Status & Pricing
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`pb-3 border-b-2 transition ${activeTab === 'leads' ? 'border-sky-600 text-sky-600' : 'border-transparent hover:text-slate-800'}`}
        >
          Lead Acquisition & Sources
        </button>
      </div>

      {/* Report Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  {data.length > 0 &&
                    Object.keys(data[0])
                      .slice(0, 8)
                      .map((key) => (
                        <th key={key} className="py-2.5 px-3">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </th>
                      ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    {Object.keys(row)
                      .slice(0, 8)
                      .map((k) => (
                        <td key={k} className="py-2.5 px-3 text-slate-700 max-w-[200px] truncate">
                          {typeof row[k] === 'object' ? JSON.stringify(row[k]) : String(row[k] ?? '')}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
