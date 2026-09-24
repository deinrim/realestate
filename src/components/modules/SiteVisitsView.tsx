import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Clock, Car, User, CheckCircle2, Star } from 'lucide-react';
import { apiFetch } from '../../services/apiClient.ts';
import { CurrentUser, SiteVisit, Project, Lead } from '../../types/index.ts';

interface SiteVisitsViewProps {
  user: CurrentUser | null;
}

export const SiteVisitsView: React.FC<SiteVisitsViewProps> = ({ user }) => {
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    leadId: '',
    projectId: '',
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: '11:00 AM',
    numberOfVisitors: 2,
    transportRequired: false,
  });

  const loadVisits = async () => {
    try {
      setLoading(true);
      const [visitData, projData, leadData] = await Promise.all([
        apiFetch('/api/site-visits'),
        apiFetch('/api/projects'),
        apiFetch('/api/leads'),
      ]);
      setVisits(visitData);
      setProjects(projData);
      setLeads(leadData);
      if (projData.length > 0 && !formData.projectId) {
        setFormData((prev) => ({ ...prev, projectId: String(projData[0].id) }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/site-visits', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      loadVisits();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule visit');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-stone-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-700" />
            <h2 className="text-lg font-bold text-stone-900">Site Visits & Property Tours</h2>
          </div>
          <p className="text-xs text-stone-500">
            Coordinate sample flat walkthroughs, site pick-ups, and prospective buyer tours
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Site Visit</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-2">Visitor / Lead</th>
                <th className="py-3 px-2">Project</th>
                <th className="py-3 px-2">Date & Slot</th>
                <th className="py-3 px-2">Visitors</th>
                <th className="py-3 px-2">Transport</th>
                <th className="py-3 px-2">Sales Officer</th>
                <th className="py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="py-3 px-2">
                    <div className="font-bold text-slate-900">{v.leadName || 'Direct Walk-in'}</div>
                    <div className="text-[11px] text-slate-500">{v.leadMobile}</div>
                  </td>
                  <td className="py-3 px-2 font-medium text-slate-800">{v.projectName}</td>
                  <td className="py-3 px-2 text-slate-700">
                    <div className="font-semibold">{v.visitDate}</div>
                    <div className="text-[11px] text-slate-400">{v.visitTime}</div>
                  </td>
                  <td className="py-3 px-2 text-slate-700">{v.numberOfVisitors} Persons</td>
                  <td className="py-3 px-2">
                    {v.transportRequired ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        <Car className="h-3 w-3" /> Cab Required
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Own Transport</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-slate-600">{v.executiveName || 'Assigned on Site'}</td>
                  <td className="py-3 px-2">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Schedule Site Visit Tour</h3>
              <button onClick={() => setShowModal(false)} className="rounded p-1 text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block">Lead / Buyer Contact</label>
                <select
                  value={formData.leadId}
                  onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 p-2"
                >
                  <option value="">Select Existing Lead</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.mobile})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block">Destination Project *</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 p-2"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.visitDate}
                    onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block">Time Slot *</label>
                  <input
                    type="text"
                    required
                    value={formData.visitTime}
                    onChange={(e) => setFormData({ ...formData, visitTime: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="transportReq"
                  checked={formData.transportRequired}
                  onChange={(e) => setFormData({ ...formData, transportRequired: e.target.checked })}
                  className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="transportReq" className="text-stone-700 font-medium">
                  Provide Developer Cab Pickup & Drop
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded border border-stone-200 px-3 py-1.5 text-stone-600 hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-amber-700 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-amber-800 transition"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
