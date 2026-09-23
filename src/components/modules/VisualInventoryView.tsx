import React, { useEffect, useState } from 'react';
import {
  Layers,
  Building,
  Filter,
  CheckCircle,
  Clock,
  Lock,
  DollarSign,
  Info,
  Maximize2,
  Tag,
  FileCheck2,
} from 'lucide-react';
import { apiFetch, formatCurrency } from '../../services/apiClient.ts';
import { CurrentUser, Unit, Project } from '../../types/index.ts';

interface VisualInventoryViewProps {
  user: CurrentUser | null;
  onNavigate: (module: string, params?: any) => void;
}

export const VisualInventoryView: React.FC<VisualInventoryViewProps> = ({ user, onNavigate }) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedBedrooms, setSelectedBedrooms] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadInventory = async () => {
    try {
      setLoading(true);
      let query = '';
      const params = new URLSearchParams();
      if (selectedProjectId) params.append('projectId', selectedProjectId);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedBedrooms) params.append('bedrooms', selectedBedrooms);
      query = params.toString() ? `?${params.toString()}` : '';

      const [unitList, projList] = await Promise.all([
        apiFetch(`/api/inventory/units${query}`),
        apiFetch('/api/projects'),
      ]);
      setUnits(unitList);
      setProjects(projList);
      if (!selectedProjectId && projList.length > 0) {
        setSelectedProjectId(String(projList[0].id));
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [selectedProjectId, selectedStatus, selectedBedrooms]);

  const handleUnitStatusChange = async (unitId: number, newStatus: string) => {
    try {
      setActionLoading(true);
      await apiFetch(`/api/inventory/units/${unitId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setSelectedUnit(null);
      loadInventory();
    } catch (err: any) {
      alert(err.message || 'Failed to update unit status');
    } finally {
      setActionLoading(false);
    }
  };

  // Group units by tower and then by floor in descending order (top floor to ground)
  const groupedByTower: Record<string, Record<number, Unit[]>> = {};
  units.forEach((u) => {
    const towerName = u.towerName || 'Tower A';
    if (!groupedByTower[towerName]) {
      groupedByTower[towerName] = {};
    }
    const floor = u.floorNumber || 1;
    if (!groupedByTower[towerName][floor]) {
      groupedByTower[towerName][floor] = [];
    }
    groupedByTower[towerName][floor].push(u);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100';
      case 'Enquiry':
        return 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100';
      case 'Hold':
        return 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100';
      case 'Blocked':
        return 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';
      case 'Negotiation':
        return 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100';
      case 'Booked':
      case 'Agreement':
      case 'Sold':
        return 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-500';
      case 'Enquiry':
        return 'bg-sky-500';
      case 'Hold':
        return 'bg-amber-500';
      case 'Blocked':
        return 'bg-slate-400';
      case 'Negotiation':
        return 'bg-purple-500';
      case 'Booked':
      case 'Agreement':
      case 'Sold':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  };

  // Inventory stats calculation
  const totalUnitsCount = units.length;
  const availableCount = units.filter((u) => u.status === 'Available').length;
  const enquiryCount = units.filter((u) => u.status === 'Enquiry' || u.status === 'Negotiation').length;
  const holdCount = units.filter((u) => u.status === 'Hold').length;
  const soldCount = units.filter((u) => ['Booked', 'Agreement', 'Sold'].includes(u.status)).length;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-900">Visual Inventory Matrix</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Interactive architectural layout across towers, floors and configurations
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:outline-hidden"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={selectedBedrooms}
              onChange={(e) => setSelectedBedrooms(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs text-slate-700 focus:border-sky-500 focus:outline-hidden"
            >
              <option value="">All BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4 BHK</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs text-slate-700 focus:border-sky-500 focus:outline-hidden"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Enquiry">Enquiry</option>
              <option value="Hold">Hold</option>
              <option value="Booked">Booked</option>
              <option value="Sold">Sold</option>
            </select>
          </div>
        </div>

        {/* Legend & Stats Banner */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4 text-xs">
          {/* Status Color Legend */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Available ({availableCount})
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
              Enquiry ({enquiryCount})
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Hold ({holdCount})
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              Booked / Sold ({soldCount})
            </span>
          </div>

          <div className="text-slate-500 text-xs font-semibold">
            Total Units: <strong className="text-slate-800">{totalUnitsCount}</strong>
          </div>
        </div>
      </div>

      {/* Visual Building Towers */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        </div>
      ) : Object.keys(groupedByTower).length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
          No units match the selected filters.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByTower).map(([towerName, floorsMap]) => {
            const sortedFloors = Object.keys(floorsMap)
              .map(Number)
              .sort((a, b) => b - a); // Top floor first

            return (
              <div key={towerName} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-sky-600" />
                    <h3 className="text-sm font-bold text-slate-900">{towerName}</h3>
                  </div>
                  <span className="text-xs text-slate-400">Click unit to view pricing & reserve</span>
                </div>

                {/* Floor by Floor Grid */}
                <div className="mt-4 space-y-3">
                  {sortedFloors.map((floorNum) => (
                    <div key={floorNum} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      {/* Floor Indicator Label */}
                      <div className="w-20 shrink-0 rounded bg-slate-100 px-2 py-1 text-center font-mono text-xs font-bold text-slate-700">
                        Floor {floorNum}
                      </div>

                      {/* Units on this floor */}
                      <div className="flex flex-wrap gap-2 flex-1">
                        {floorsMap[floorNum].map((unit) => (
                          <button
                            key={unit.id}
                            onClick={() => setSelectedUnit(unit)}
                            className={`flex flex-col justify-between rounded-lg border p-2.5 text-left transition shadow-2xs w-[calc(50%-0.3rem)] sm:w-40 cursor-pointer ${getStatusColor(
                              unit.status
                            )}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs">Unit {unit.unitNumber}</span>
                              <span className={`h-2 w-2 rounded-full ${getStatusDot(unit.status)}`} />
                            </div>
                            <div className="mt-1 text-[11px] opacity-85">
                              {unit.bedrooms} BHK • {unit.carpetArea} sqft
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold">
                              <span>{formatCurrency(unit.totalPrice)}</span>
                              <span className="text-[10px] font-normal uppercase opacity-75">{unit.status}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unit Detail & Action Modal */}
      {selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Unit {selectedUnit.unitNumber}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusColor(
                      selectedUnit.status
                    )}`}
                  >
                    {selectedUnit.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {selectedUnit.projectName} • {selectedUnit.towerName || 'Tower A'} • Floor {selectedUnit.floorNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedUnit(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Specifications Grid */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-2 text-center">
                <span className="text-slate-400 block text-[10px]">Bedrooms</span>
                <span className="font-bold text-slate-800">{selectedUnit.bedrooms} BHK</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 text-center">
                <span className="text-slate-400 block text-[10px]">Bathrooms</span>
                <span className="font-bold text-slate-800">{selectedUnit.bathrooms}</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 text-center">
                <span className="text-slate-400 block text-[10px]">Carpet Area</span>
                <span className="font-bold text-slate-800">{selectedUnit.carpetArea} sq.ft.</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 text-center">
                <span className="text-slate-400 block text-[10px]">Facing</span>
                <span className="font-bold text-slate-800">{selectedUnit.facing || 'East'}</span>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Financial Consideration</h4>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Consideration:</span>
                  <span className="font-medium text-slate-800">{formatCurrency(selectedUnit.basePrice)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Base Rate:</span>
                  <span>₹{Number(selectedUnit.pricePerSqft).toLocaleString('en-IN')}/sq.ft.</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Other Development Charges:</span>
                  <span className="font-medium text-slate-800">{formatCurrency(selectedUnit.otherCharges)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                  <span>Total Consideration:</span>
                  <span className="text-sky-700">{formatCurrency(selectedUnit.totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-5 space-y-2">
              {['Available', 'Enquiry', 'Hold'].includes(selectedUnit.status) ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => {
                      const u = selectedUnit;
                      setSelectedUnit(null);
                      onNavigate('bookings', { prefillUnitId: u.id, prefillProjectId: u.projectId, prefillConsideration: u.totalPrice });
                    }}
                    className="flex-1 rounded-lg bg-sky-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition"
                  >
                    + Create Booking / Reservation
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleUnitStatusChange(selectedUnit.id, selectedUnit.status === 'Hold' ? 'Available' : 'Hold')}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {selectedUnit.status === 'Hold' ? 'Release to Available' : 'Place on Hold'}
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleUnitStatusChange(selectedUnit.id, 'Enquiry')}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Mark Enquiry
                  </button>
                </div>
              ) : (
                <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-center justify-between">
                  <span>This unit is currently <strong>{selectedUnit.status}</strong> and locked against double booking.</span>
                  <button
                    onClick={() => {
                      const u = selectedUnit;
                      setSelectedUnit(null);
                      onNavigate('bookings');
                    }}
                    className="font-bold underline text-rose-800 ml-2"
                  >
                    View Booking
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
