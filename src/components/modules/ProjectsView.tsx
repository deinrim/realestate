import React, { useEffect, useState } from 'react';
import {
  Building,
  Plus,
  Search,
  MapPin,
  Calendar,
  Layers,
  FileCheck2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { apiFetch } from '../../services/apiClient.ts';
import { CurrentUser, Project } from '../../types/index.ts';

interface ProjectsViewProps {
  user: CurrentUser | null;
  onNavigate: (module: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ user, onNavigate }) => {
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    projectType: 'Residential',
    location: '',
    address: '',
    city: 'Kolkata',
    state: 'West Bengal',
    description: '',
    reraNumber: '',
    reraDate: '',
    developerDetails: '',
    startDate: '',
    expectedCompletion: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/projects');
      setProjectsList(res);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowCreateModal(false);
      setFormData({
        name: '',
        code: '',
        projectType: 'Residential',
        location: '',
        address: '',
        city: 'Kolkata',
        state: 'West Bengal',
        description: '',
        reraNumber: '',
        reraDate: '',
        developerDetails: '',
        startDate: '',
        expectedCompletion: '',
      });
      loadProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspectProject = async (projId: number) => {
    try {
      const details = await apiFetch(`/api/projects/${projId}`);
      setSelectedProject(details);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = projectsList.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Projects & Developments</h2>
          <p className="text-xs text-slate-500">
            Manage residential, commercial and township properties with RERA compliance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search projects..."
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
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((proj) => (
          <div
            key={proj.id}
            className="flex flex-col justify-between rounded-xl border border-stone-200/90 bg-white p-5 shadow-xs hover:border-amber-400 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="rounded bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-800 border border-amber-200/60">
                  {proj.code}
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  {proj.status}
                </span>
              </div>

              <h3 className="mt-2 text-base font-bold text-stone-900 leading-snug">{proj.name}</h3>

              <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
                <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{proj.location}, {proj.city}</span>
              </div>

              {proj.reraNumber && (
                <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                  <FileCheck2 className="h-3.5 w-3.5 shrink-0" />
                  <span>RERA: {proj.reraNumber}</span>
                </div>
              )}

              {proj.description && (
                <p className="mt-2 text-xs text-stone-500 line-clamp-2">{proj.description}</p>
              )}

              {/* Stats pill row */}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-[#FAF8F5] p-2.5 text-center text-xs border border-stone-200/70">
                <div>
                  <span className="block font-bold text-stone-800">{proj.towersCount || 1}</span>
                  <span className="text-[10px] text-stone-400">Towers</span>
                </div>
                <div>
                  <span className="block font-bold text-stone-800">{proj.totalUnits || 0}</span>
                  <span className="text-[10px] text-stone-400">Total Units</span>
                </div>
                <div>
                  <span className="block font-bold text-emerald-700">{proj.availableUnits || 0}</span>
                  <span className="text-[10px] text-stone-400">Available</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <button
                onClick={() => handleInspectProject(proj.id)}
                className="text-xs font-semibold text-amber-800 hover:text-amber-900"
              >
                Inspect Towers & Units
              </button>
              <button
                onClick={() => onNavigate('inventory')}
                className="flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-amber-800"
              >
                <span>Visual Matrix</span>
                <Layers className="h-3.5 w-3.5 text-amber-700" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Project Inspection Drawer / Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedProject.project.name}</h3>
                <p className="text-xs text-slate-500">Code: {selectedProject.project.code} • RERA: {selectedProject.project.reraNumber || 'Applied'}</p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Towers Section */}
            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Towers & Blocks</h4>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {selectedProject.towers.map((t: any) => (
                  <div key={t.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">{t.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{t.code}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                      <span>Floors: {t.totalFloors}</span>
                      <span>Total Units: {t.totalUnits}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Units list */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Inventory Units ({selectedProject.units.length})</h4>
                <button
                  onClick={() => {
                    setSelectedProject(null);
                    onNavigate('inventory');
                  }}
                  className="text-xs font-semibold text-amber-800 hover:text-amber-900"
                >
                  Open in Visual Matrix →
                </button>
              </div>

              <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase font-semibold text-slate-500 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Unit Number</th>
                      <th className="py-2 px-3">Floor</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Super Built-Up</th>
                      <th className="py-2 px-3">Total Consideration</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedProject.units.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-800">Unit {u.unitNumber}</td>
                        <td className="py-2 px-3 text-slate-600">Floor {u.floorNumber}</td>
                        <td className="py-2 px-3 text-slate-600">{u.bedrooms} BHK</td>
                        <td className="py-2 px-3 text-slate-600">{u.superBuiltUpArea} sq.ft.</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">₹{Number(u.totalPrice).toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              u.status === 'Available'
                                ? 'bg-emerald-50 text-emerald-700'
                                : u.status === 'Booked'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Register New Real Estate Project</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Skyline Signature Heights"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 text-xs focus:border-amber-600 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Project Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SKY-SGN"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 text-xs font-mono uppercase focus:border-amber-600 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Type</label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 text-xs focus:border-amber-600 focus:bg-white focus:outline-hidden"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Township">Integrated Township</option>
                    <option value="Plots">Plotted Development</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Location / Landmark *</label>
                  <input
                    type="text"
                    required
                    placeholder="New Town Action Area II"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 text-xs focus:border-amber-600 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Kolkata"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 text-xs focus:border-amber-600 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">RERA Registration Number</label>
                  <input
                    type="text"
                    placeholder="e.g. WBRERA/P/KOL/2024/00099"
                    value={formData.reraNumber}
                    onChange={(e) => setFormData({ ...formData, reraNumber: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 text-xs focus:border-amber-600 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Expected Handover Date</label>
                  <input
                    type="date"
                    value={formData.expectedCompletion}
                    onChange={(e) => setFormData({ ...formData, expectedCompletion: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 text-xs focus:border-amber-600 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Short Overview / Highlights</label>
                <textarea
                  rows={2}
                  placeholder="Luxury 3 & 4 BHK apartments with club amenities and panoramic city views"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-200 bg-[#FAF8F5] p-2 text-xs focus:border-amber-600 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-800 disabled:opacity-50 transition"
                >
                  {submitting ? 'Creating Project...' : 'Register Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
