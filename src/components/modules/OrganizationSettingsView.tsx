import React, { useEffect, useState } from 'react';
import { Settings, Save, Building, ShieldCheck, MapPin, Hash } from 'lucide-react';
import { apiFetch } from '../../services/apiClient.ts';
import { CurrentUser, Organization, OrganizationSettings } from '../../types/index.ts';

interface OrganizationSettingsViewProps {
  user: CurrentUser | null;
  organization: Organization | null;
  onRefresh: () => void;
}

export const OrganizationSettingsView: React.FC<OrganizationSettingsViewProps> = ({
  user,
  organization,
  onRefresh,
}) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [settingsData, setSettingsData] = useState<OrganizationSettings>({
    currency: 'INR',
    currencySymbol: '₹',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Asia/Kolkata',
    taxRateGst: '5.00',
    leadPrefix: 'LD-',
    bookingPrefix: 'BK-',
    receiptPrefix: 'RCT-',
    customerPrefix: 'CUS-',
    projectPrefix: 'PRJ-',
    invoiceHeader: '',
    emailSignature: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/organization/profile');
      setProfileData(res);
      if (res.settings) {
        setSettingsData((prev) => ({ ...prev, ...res.settings }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiFetch('/api/organization/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsData),
      });
      alert('Organization settings saved successfully!');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  const org = profileData?.organization || organization;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-sky-600" />
          <h2 className="text-lg font-bold text-slate-900">Organization Settings & Configuration</h2>
        </div>
        <p className="text-xs text-slate-500">
          Corporate legal identities, GSTIN/PAN credentials, auto-numbering prefixes, and branch registry
        </p>
      </div>

      {/* Corporate Profile Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Corporate Entity Details
        </h3>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="block text-slate-400 text-[10px]">Company Brand Name</span>
            <span className="font-bold text-slate-800">{org?.companyName}</span>
          </div>
          <div>
            <span className="block text-slate-400 text-[10px]">Legal Entity Name</span>
            <span className="font-bold text-slate-800">{org?.legalName}</span>
          </div>
          <div>
            <span className="block text-slate-400 text-[10px]">Tenant Code</span>
            <span className="font-mono font-bold text-sky-700">{org?.code}</span>
          </div>
          <div>
            <span className="block text-slate-400 text-[10px]">GSTIN Registration</span>
            <span className="font-mono font-bold text-slate-800">{org?.gstin || 'N/A'}</span>
          </div>
          <div>
            <span className="block text-slate-400 text-[10px]">PAN Number</span>
            <span className="font-mono font-bold text-slate-800">{org?.pan || 'N/A'}</span>
          </div>
          <div>
            <span className="block text-slate-400 text-[10px]">Subscription Plan</span>
            <span className="font-bold text-indigo-700">{org?.subscriptionPlan}</span>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Auto-Numbering Prefixes & Regional Formats
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block">Lead Prefix</label>
            <input
              type="text"
              value={settingsData.leadPrefix}
              onChange={(e) => setSettingsData({ ...settingsData, leadPrefix: e.target.value })}
              className="mt-1 w-full rounded border border-slate-200 p-2 font-mono"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block">Booking Prefix</label>
            <input
              type="text"
              value={settingsData.bookingPrefix}
              onChange={(e) => setSettingsData({ ...settingsData, bookingPrefix: e.target.value })}
              className="mt-1 w-full rounded border border-slate-200 p-2 font-mono"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block">Receipt Prefix</label>
            <input
              type="text"
              value={settingsData.receiptPrefix}
              onChange={(e) => setSettingsData({ ...settingsData, receiptPrefix: e.target.value })}
              className="mt-1 w-full rounded border border-slate-200 p-2 font-mono"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block">Customer Prefix</label>
            <input
              type="text"
              value={settingsData.customerPrefix}
              onChange={(e) => setSettingsData({ ...settingsData, customerPrefix: e.target.value })}
              className="mt-1 w-full rounded border border-slate-200 p-2 font-mono"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block">Project Prefix</label>
            <input
              type="text"
              value={settingsData.projectPrefix}
              onChange={(e) => setSettingsData({ ...settingsData, projectPrefix: e.target.value })}
              className="mt-1 w-full rounded border border-slate-200 p-2 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block">Currency Symbol</label>
            <input
              type="text"
              value={settingsData.currencySymbol}
              onChange={(e) => setSettingsData({ ...settingsData, currencySymbol: e.target.value })}
              className="mt-1 w-full rounded border border-slate-200 p-2"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block">Applicable GST Rate (%)</label>
            <input
              type="text"
              value={settingsData.taxRateGst || '5.00'}
              onChange={(e) => setSettingsData({ ...settingsData, taxRateGst: e.target.value })}
              className="mt-1 w-full rounded border border-slate-200 p-2"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block">System Timezone</label>
            <input
              type="text"
              value={settingsData.timezone}
              onChange={(e) => setSettingsData({ ...settingsData, timezone: e.target.value })}
              className="mt-1 w-full rounded border border-slate-200 p-2"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
