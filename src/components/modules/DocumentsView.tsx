import React, { useEffect, useState } from 'react';
import { FolderOpen, Plus, FileText, Download, ExternalLink } from 'lucide-react';
import { apiFetch } from '../../services/apiClient.ts';
import { CurrentUser } from '../../types/index.ts';

interface DocumentsViewProps {
  user: CurrentUser | null;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ user }) => {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Agreement of Sale',
    fileName: '',
    fileUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80',
    entityType: 'project',
  });

  const loadDocs = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/documents');
      setDocs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/documents', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      loadDocs();
    } catch (err: any) {
      alert(err.message || 'Failed to record document');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-stone-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-amber-700" />
            <h2 className="text-lg font-bold text-stone-900">Document Repository</h2>
          </div>
          <p className="text-xs text-stone-500">
            Centralized digital vault for RERA certificates, customer KYC, signed sale agreements, and NOCs
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <div key={d.id} className="rounded-lg border border-stone-200 p-4 hover:border-amber-400 bg-white transition text-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-50 text-amber-700 border border-amber-200/60">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-800 line-clamp-1">{d.title}</h4>
                    <span className="text-[10px] text-stone-400">{d.category}</span>
                  </div>
                </div>
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded p-1 text-stone-400 hover:text-amber-800"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{d.fileName}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(d.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Upload Digital Document</h3>
            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Srijan Solus RERA Sanctioned Master Plan"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 p-2"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 p-2"
                >
                  <option value="Agreement of Sale">Agreement of Sale</option>
                  <option value="Customer KYC">Customer KYC</option>
                  <option value="RERA Approval">RERA Approval</option>
                  <option value="Fire NOC">Fire NOC</option>
                  <option value="Possession Handover Certificate">Possession Handover Certificate</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block">File Name *</label>
                <input
                  type="text"
                  required
                  placeholder="solus_rera_approval_signed.pdf"
                  value={formData.fileName}
                  onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 p-2 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded border border-stone-200 px-3 py-1.5 text-stone-600 hover:bg-stone-50 font-medium">Cancel</button>
                <button type="submit" className="rounded bg-amber-700 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-amber-800 transition">Save Document</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
