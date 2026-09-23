import React, { useEffect, useState } from 'react';
import {
  Compass,
  Plus,
  Search,
  Phone,
  MessageSquare,
  Calendar,
  User,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  ArrowRight,
  Send,
} from 'lucide-react';
import { apiFetch, formatCurrency } from '../../services/apiClient.ts';
import { CurrentUser, Lead, Project } from '../../types/index.ts';

interface LeadsCrmViewProps {
  user: CurrentUser | null;
  onNavigate: (module: string, params?: any) => void;
}

export const LeadsCrmView: React.FC<LeadsCrmViewProps> = ({ user, onNavigate }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const [selectedLeadDetails, setSelectedLeadDetails] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Lead Form
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    location: '',
    source: 'Website',
    campaign: '',
    unitPreference: '3 BHK',
    budget: '₹80 Lakh - ₹1.2 Cr',
    projectId: '',
    remarks: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Activity Log form inside lead detail
  const [newActivity, setNewActivity] = useState({
    activityType: 'Call',
    subject: '',
    details: '',
    nextAction: '',
    nextFollowUpDate: '',
  });

  const loadLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (search) params.append('search', search);

      const [leadData, projData] = await Promise.all([
        apiFetch(`/api/leads?${params.toString()}`),
        apiFetch('/api/projects'),
      ]);
      setLeads(leadData);
      setProjects(projData);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [selectedStatus, search]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiFetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowCreateModal(false);
      setFormData({
        name: '',
        mobile: '',
        email: '',
        location: '',
        source: 'Website',
        campaign: '',
        unitPreference: '3 BHK',
        budget: '₹80 Lakh - ₹1.2 Cr',
        projectId: '',
        remarks: '',
      });
      loadLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to create lead');
    } finally {
      setSubmitting(false);
    }
  };

  const openLeadDetails = async (leadId: number) => {
    try {
      const details = await apiFetch(`/api/leads/${leadId}`);
      setSelectedLeadDetails(details);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadDetails?.lead?.id) return;
    try {
      await apiFetch(`/api/leads/${selectedLeadDetails.lead.id}/activities`, {
        method: 'POST',
        body: JSON.stringify(newActivity),
      });
      setNewActivity({
        activityType: 'Call',
        subject: '',
        details: '',
        nextAction: '',
        nextFollowUpDate: '',
      });
      // Refresh lead details
      openLeadDetails(selectedLeadDetails.lead.id);
      loadLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to log activity');
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedLeadDetails?.lead?.id) return;
    try {
      await apiFetch(`/api/leads/${selectedLeadDetails.lead.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      openLeadDetails(selectedLeadDetails.lead.id);
      loadLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const STAGES = [
    'New',
    'Contacted',
    'Qualified',
    'Site Visit Scheduled',
    'Site Visit Completed',
    'Negotiation',
    'Booking',
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-900">Lead Management & CRM Pipeline</h2>
          </div>
          <p className="text-xs text-slate-500">
            Track prospective homebuyers through acquisition, follow-up calls, and site visits
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-56">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-sky-500 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`rounded px-2.5 py-1 font-medium ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`rounded px-2.5 py-1 font-medium ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Pipeline Board
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-sky-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Lead</span>
          </button>
        </div>
      </div>

      {/* Main Content: Table or Kanban */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {/* Mobile Android-Style Card System (Visible on small screens) */}
          <div className="grid grid-cols-1 gap-2.5 md:hidden">
            {leads.map((l) => (
              <div
                key={`mob-${l.id}`}
                onClick={() => openLeadDetails(l.id)}
                className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2.5 active:bg-slate-50 transition cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900">{l.name}</span>
                      <span className="font-mono text-[9px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded font-semibold">
                        {l.leadCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {l.projectName || 'General Enquiry'} • {l.unitPreference || '3 BHK'}
                    </p>
                  </div>
                  <span className="rounded-full bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 text-[10px] font-bold">
                    {l.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Budget</span>
                    <span className="font-semibold text-slate-800">{l.budget || 'Flexible'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Source</span>
                    <span className="font-medium text-slate-700">{l.source}</span>
                  </div>
                </div>

                {/* Mobile Quick Call & WhatsApp Action Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${l.mobile}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition"
                    >
                      <Phone className="h-3 w-3" />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/${l.mobile.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openLeadDetails(l.id);
                    }}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                  >
                    Details →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-2">Lead Code & Name</th>
                    <th className="py-3 px-2">Contact</th>
                    <th className="py-3 px-2">Project</th>
                    <th className="py-3 px-2">Source / Budget</th>
                    <th className="py-3 px-2">Assigned Agent</th>
                    <th className="py-3 px-2">Pipeline Stage</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => openLeadDetails(l.id)}>
                      <td className="py-3 px-2">
                        <div className="font-bold text-slate-800">{l.name}</div>
                        <div className="font-mono text-[10px] text-sky-700">{l.leadCode}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-slate-700 font-medium">{l.mobile}</div>
                        <div className="text-[10px] text-slate-400">{l.email || 'No email provided'}</div>
                      </td>
                      <td className="py-3 px-2 text-slate-700">
                        {l.projectName || 'General Enquiry'}
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-medium text-slate-800">{l.source}</div>
                        <div className="text-[10px] text-slate-500">{l.budget} • {l.unitPreference}</div>
                      </td>
                      <td className="py-3 px-2 text-slate-600">
                        {l.assignedUserName || 'Unassigned'}
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openLeadDetails(l.id);
                          }}
                          className="rounded px-2 py-1 text-[11px] font-semibold text-sky-600 hover:bg-sky-50"
                        >
                          View & Log
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Kanban Board View */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage);
            return (
              <div key={stage} className="w-72 shrink-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-xs text-slate-800">{stage}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="mt-3 space-y-2.5 min-h-[400px]">
                  {stageLeads.map((l) => (
                    <div
                      key={l.id}
                      onClick={() => openLeadDetails(l.id)}
                      className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs hover:border-sky-300 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{l.name}</span>
                        <span className="font-mono text-[9px] text-sky-700">{l.leadCode}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-600">{l.mobile}</div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        {l.projectName || 'All Projects'} • {l.unitPreference}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{l.source}</span>
                        <span className="font-medium text-slate-700">{l.budget}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Detail & Activity Drawer Modal */}
      {selectedLeadDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{selectedLeadDetails.lead.name}</h3>
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                    {selectedLeadDetails.lead.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {selectedLeadDetails.lead.leadCode} • Mobile: {selectedLeadDetails.lead.mobile}
                </p>
              </div>
              <button
                onClick={() => setSelectedLeadDetails(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Stage Progression Bar */}
            <div className="mt-4 rounded-lg bg-slate-50 p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Update Pipeline Stage
              </span>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleUpdateStatus(s)}
                    className={`rounded px-2 py-1 text-xs font-semibold transition ${
                      selectedLeadDetails.lead.status === s
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Convert to Customer Shortcut */}
            <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs">
              <span className="text-emerald-800 font-medium">Ready to reserve a property unit for this buyer?</span>
              <button
                onClick={() => {
                  const lead = selectedLeadDetails.lead;
                  setSelectedLeadDetails(null);
                  onNavigate('bookings', { prefillLead: lead });
                }}
                className="rounded bg-emerald-600 px-3 py-1 font-bold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                Convert to Booking →
              </button>
            </div>

            {/* Log New Activity Section */}
            <div className="mt-5 rounded-lg border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-900">Log Interaction (Call, WhatsApp, Note)</h4>
              <form onSubmit={handleAddActivity} className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Interaction Type</label>
                    <select
                      value={newActivity.activityType}
                      onChange={(e) => setNewActivity({ ...newActivity, activityType: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-200 p-1.5 text-xs"
                    >
                      <option value="Call">Phone Call</option>
                      <option value="WhatsApp">WhatsApp Message</option>
                      <option value="Meeting">Direct Meeting</option>
                      <option value="Email">Email Communication</option>
                      <option value="Note">Internal Note</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Discussed 3BHK budget"
                      value={newActivity.subject}
                      onChange={(e) => setNewActivity({ ...newActivity, subject: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-200 p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Next Follow-Up</label>
                    <input
                      type="datetime-local"
                      value={newActivity.nextFollowUpDate}
                      onChange={(e) => setNewActivity({ ...newActivity, nextFollowUpDate: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-200 p-1.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter discussion notes, buyer feedback, unit preferences..."
                    value={newActivity.details}
                    onChange={(e) => setNewActivity({ ...newActivity, details: e.target.value })}
                    className="w-full rounded border border-slate-200 p-2 text-xs"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1 rounded bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                  >
                    <Send className="h-3 w-3" />
                    <span>Post Activity</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Activity Timeline */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Interaction Timeline</h4>
              <div className="mt-3 space-y-3">
                {selectedLeadDetails.activities?.length > 0 ? (
                  selectedLeadDetails.activities.map((a: any) => (
                    <div key={a.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{a.subject}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(a.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-600">{a.details}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Logged by: {a.createdByName || 'System'}</span>
                        <span className="rounded bg-sky-100 px-1.5 py-0.2 text-sky-800 font-medium">
                          {a.activityType}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3">No activity recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record Inbound Lead</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Vikramaditya Roy"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2 text-xs focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98300 44556"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2 text-xs focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    placeholder="vikram@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2 text-xs focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Project Preference</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2 text-xs focus:border-sky-500 focus:outline-hidden"
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2 text-xs"
                  >
                    <option value="Website">Website</option>
                    <option value="MagicBricks">MagicBricks</option>
                    <option value="99acres">99acres</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Channel Partner">Channel Partner</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Unit Type</label>
                  <select
                    value={formData.unitPreference}
                    onChange={(e) => setFormData({ ...formData, unitPreference: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2 text-xs"
                  >
                    <option value="2 BHK">2 BHK</option>
                    <option value="3 BHK">3 BHK</option>
                    <option value="4 BHK">4 BHK</option>
                    <option value="Penthouse">Penthouse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Budget Range</label>
                  <input
                    type="text"
                    placeholder="₹80L - ₹1.2Cr"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Initial Remarks / Buyer Requirements</label>
                <textarea
                  rows={2}
                  placeholder="Looking for higher floor, corner 3 BHK with 2 covered car parkings"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 p-2 text-xs"
                />
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
                  className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving Lead...' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
