import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  Shield,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { apiFetch } from '../../services/apiClient.ts';
import { CurrentUser, Organization } from '../../types/index.ts';

interface SystemAdminViewProps {
  user: CurrentUser | null;
  onSelectTenant: (orgId: number) => void;
}

export const SystemAdminView: React.FC<SystemAdminViewProps> = ({ user, onSelectTenant }) => {
  const [organizationsList, setOrganizationsList] = useState<Organization[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Organization Form
  const [formData, setFormData] = useState({
    code: '',
    companyName: '',
    legalName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    gstin: '',
    pan: '',
    subscriptionPlan: 'Growth Tier',
    adminName: '',
    adminEmail: '',
    adminMobile: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dash, orgs] = await Promise.all([
        apiFetch('/api/system/dashboard'),
        apiFetch('/api/system/organizations'),
      ]);
      setDashboardData(dash);
      setOrganizationsList(orgs);
    } catch (err) {
      console.error('Error fetching system admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusToggle = async (orgId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await apiFetch(`/api/system/organizations/${orgId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update organization status');
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiFetch('/api/system/organizations', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowCreateModal(false);
      setFormData({
        code: '',
        companyName: '',
        legalName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        gstin: '',
        pan: '',
        subscriptionPlan: 'Growth Tier',
        adminName: '',
        adminEmail: '',
        adminMobile: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create organization');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrgs = organizationsList.filter(
    (o) =>
      o.companyName.toLowerCase().includes(search.toLowerCase()) ||
      o.code.toLowerCase().includes(search.toLowerCase()) ||
      o.city.toLowerCase().includes(search.toLowerCase())
  );

  const m = dashboardData?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl font-bold">System Administration Panel</h2>
          </div>
          <p className="mt-1 text-xs text-indigo-200">
            Multi-Tenant SaaS Control Center • Manage organizations, data tenancy, and subscription tiers
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-600 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Provision New Developer Organization</span>
        </button>
      </div>

      {/* Global SaaS Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500">Total Organizations</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{m.totalOrganizations || 0}</div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">
            {m.activeOrganizations || 0} Active • {m.suspendedOrganizations || 0} Suspended
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500">Total System Users</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{m.totalUsers || 0}</div>
          <div className="mt-1 text-[11px] text-slate-400">Across all developer tenants</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500">Total Projects Managed</span>
          <div className="mt-1 text-2xl font-bold text-indigo-600">{m.totalProjects || 0}</div>
          <div className="mt-1 text-[11px] text-slate-400">{m.totalUnits || 0} Total Units Listed</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500">Total Global Bookings</span>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{m.totalBookings || 0}</div>
          <div className="mt-1 text-[11px] text-slate-400">{m.totalCustomers || 0} Registered Buyers</div>
        </div>
      </div>

      {/* Organization Management Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Developer Organizations</h3>
            <p className="text-xs text-slate-500">Independent isolated enterprise clients</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by company, code or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-indigo-500 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-2">Organization</th>
                <th className="py-3 px-2">Tenant Code</th>
                <th className="py-3 px-2">Location</th>
                <th className="py-3 px-2">Plan</th>
                <th className="py-3 px-2">Projects / Units</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrgs.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold">
                        {org.code.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{org.companyName}</div>
                        <div className="text-[11px] text-slate-400">{org.legalName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                      {org.code}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-600">
                    {org.city}, {org.state}
                  </td>
                  <td className="py-3 px-2">
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                      {org.subscriptionPlan}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-700">
                    <span className="font-semibold">{org.stats?.projects || 0}</span> projects • <span className="font-semibold">{org.stats?.units || 0}</span> units
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        org.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {org.status === 'active' ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span className="capitalize">{org.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleStatusToggle(org.id, org.status)}
                        className={`rounded px-2.5 py-1 text-[11px] font-medium border transition ${
                          org.status === 'active'
                            ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {org.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Provision New Developer Organization</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Company Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Developers"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Tenant Code (Unique) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ACME"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs uppercase font-mono focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Full Legal Registered Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Developers Private Limited"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Primary Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="corp@acme.demo"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Official Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98000 12345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="Managing Director Name"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Head Office Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Plot 10, Commercial Tower"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mumbai"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="Maharashtra"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">GSTIN</label>
                  <input
                    type="text"
                    placeholder="27AAECS1234F1Z5"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs uppercase focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Subscription Tier</label>
                  <select
                    value={formData.subscriptionPlan}
                    onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="Starter Tier">Starter Tier</option>
                    <option value="Growth Tier">Growth Tier</option>
                    <option value="Enterprise Tier">Enterprise Tier</option>
                  </select>
                </div>
              </div>

              {/* Initial Admin User */}
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                <h4 className="text-xs font-bold text-indigo-900">Provision Initial Organization Administrator</h4>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Admin Email</label>
                    <input
                      type="email"
                      placeholder="admin@acme.demo"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-200 bg-white p-1.5 text-xs focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Admin Name</label>
                    <input
                      type="text"
                      placeholder="Admin Name"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-200 bg-white p-1.5 text-xs focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Provisioning Tenant...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
