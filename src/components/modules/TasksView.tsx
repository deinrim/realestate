import React, { useEffect, useState } from 'react';
import { CheckSquare, Plus, Clock, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../services/apiClient.ts';
import { CurrentUser, TaskItem } from '../../types/index.ts';

interface TasksViewProps {
  user: CurrentUser | null;
}

export const TasksView: React.FC<TasksViewProps> = ({ user }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'Medium',
  });

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/tasks');
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'Medium',
      });
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  const handleToggleStatus = async (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    try {
      await apiFetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      loadTasks();
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-900">Department Tasks & Follow-ups</h2>
          </div>
          <p className="text-xs text-slate-500">
            Internal action items across Sales, Legal, Accounts, and Project Handover teams
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-sky-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="space-y-2.5">
          {tasks.map((t) => {
            const isDone = t.status === 'Completed';
            return (
              <div
                key={t.id}
                className={`flex items-start justify-between rounded-lg border p-3.5 transition text-xs ${
                  isDone ? 'border-slate-100 bg-slate-50/50 opacity-60' : 'border-slate-200 bg-white hover:border-sky-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => handleToggleStatus(t.id, t.status)}
                    className="mt-0.5 h-4 w-4 rounded text-sky-600 cursor-pointer"
                  />
                  <div>
                    <span className={`font-bold text-slate-900 ${isDone ? 'line-through text-slate-400' : ''}`}>
                      {t.title}
                    </span>
                    {t.description && (
                      <p className="mt-0.5 text-slate-500 text-[11px]">{t.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400">
                      <span>Due: {t.dueDate || 'No deadline'}</span>
                      <span>•</span>
                      <span>Assigned to: {t.assignedUserName || 'Me'}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    t.priority === 'High' || t.priority === 'Urgent'
                      ? 'bg-rose-50 text-rose-700'
                      : t.priority === 'Medium'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {t.priority}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Create Task</h3>
            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Review revised draft for Solus Tower A"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-200 p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="mt-1 w-full rounded border border-slate-200 p-2"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block">Details / Context</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 p-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded border border-slate-200 px-3 py-1.5 text-slate-600">Cancel</button>
                <button type="submit" className="rounded bg-sky-600 px-3 py-1.5 font-bold text-white hover:bg-sky-700">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
