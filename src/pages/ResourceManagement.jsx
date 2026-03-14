import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Zap, Users, RefreshCw, Plus, X,
  AlertTriangle, CheckCircle, TrendingUp, Search,
} from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import resourceService from '../services/resourceService';
import projectService from '../services/projectService';
import { getMemberDesignation } from '../utils/memberSpecialties';
import MultiSelectDropdown from '../components/shared/MultiSelectDropdown';

const ROLE_LABELS = { admin: 'Admin', Manager: 'Manager', member: 'Member', viewer: 'Viewer', SME: 'SME' };
const formatRole = (role) => ROLE_LABELS[role] || role || 'Member';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const ROLE_FILTER_OPTIONS = [
  { value: 'member', label: 'Members' },
  { value: 'Manager', label: 'Managers' },
  { value: 'admin', label: 'Admins' },
  { value: 'viewer', label: 'SMEs' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'partial', label: 'Partial' },
  { value: 'full', label: 'Full' },
  { value: 'over', label: 'Over' },
];

const capacityColor = (pct) => {
  if (pct > 100) return { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700', label: 'Over-allocated' };
  if (pct === 100) return { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', label: 'Fully Allocated' };
  if (pct >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', label: 'Fully Allocated' };
  if (pct >= 50) return { bar: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700', label: 'Partially Allocated' };
  return { bar: 'bg-red-400', text: 'text-red-600', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700', label: 'Low Allocation' };
};

const AssignModal = ({ member, projects, onClose, onAssign, loading }) => {
  const remaining = Math.max(0, 100 - (member?.usedPercentage || 0));
  const fullyAllocated = remaining === 0;
  const defaultAlloc = Math.min(20, Math.floor(remaining / 5) * 5 || 5);

  const [projectId, setProjectId] = useState('');
  const [allocPct, setAllocPct] = useState(defaultAlloc);

  const existing = member?.allocations?.map((a) => a.project?._id || a.project) || [];
  const available = projects.filter((p) => !existing.includes(p._id));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!projectId) { toast.error('Select a project'); return; }
    if (allocPct < 1 || allocPct > remaining) { toast.error(`Allocation exceeds remaining capacity (${remaining}%)`); return; }
    onAssign({ userId: member.user?._id || member._id, projectId, allocationPercentage: allocPct });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Assign to Project</h3>
            <p className="text-sm text-gray-500 mt-0.5">{member?.user?.name || member?.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        {fullyAllocated ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Fully Allocated</p>
            <p className="text-sm text-gray-500">{member?.user?.name || member?.name} is already at 100% capacity. Remove an existing allocation before adding a new one.</p>
            <button onClick={onClose} className="mt-4 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm">
              <span className="text-amber-700 font-medium">Remaining capacity</span>
              <span className="font-bold text-amber-800">{remaining}%</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
              {available.length === 0 ? (
                <p className="text-sm text-gray-500 italic">All projects already assigned</p>
              ) : (
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Select a project…</option>
                  {available.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allocation: <span className="font-bold text-gray-900">{allocPct}%</span>
              </label>
              <input
                type="range" min={5} max={remaining} step={5}
                value={allocPct}
                onChange={(e) => setAllocPct(Number(e.target.value))}
                className="w-full accent-gray-900"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>5%</span><span>{remaining}%</span></div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={loading || available.length === 0} className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                {loading ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const MemberCard = ({ member, projects, onAssign, onRemove, canEdit }) => {
  const used = member.usedPercentage || 0;
  const colors = capacityColor(used);
  const allocations = member.allocations || [];
  const speciality = getMemberDesignation(member);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      {/* Top row: avatar + name + badge */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {(member.user?.name || member.name || '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{member.user?.name || member.name}</p>
            <p className="text-xs text-gray-400 truncate">
              {formatRole(member.role)}{speciality ? ` · ${speciality}` : ''}
            </p>
          </div>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${colors.badge}`}>
          {Math.round(used)}%
        </span>
      </div>

      {/* Capacity bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${colors.bar}`}
          style={{ width: `${Math.min(used, 100)}%` }}
        />
      </div>

      {/* Allocations */}
      {allocations.length === 0 ? (
        <p className="text-xs text-gray-400 italic mb-3">No project allocations</p>
      ) : (
        <div className="space-y-1.5 mb-3">
          {allocations.map((alloc, i) => {
            const proj = projects.find((p) => p._id === (alloc.project?._id || alloc.project));
            return (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: proj?.color || '#6b7280' }} />
                  <span className="text-xs text-gray-600 truncate">{proj?.name || alloc.project?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-[11px] font-medium text-gray-500">
                    {alloc.allocatedPercentage || Math.round((alloc.allocatedDays / (member.availableDays || 1)) * 100)}%
                  </span>
                  {canEdit && (
                    <button onClick={() => onRemove(member, alloc)} className="p-0.5 rounded hover:bg-red-50">
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign button */}
      {canEdit && (
        <button
          onClick={() => onAssign(member)}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Assign to Project
        </button>
      )}
    </div>
  );
};

const ResourceManagement = () => {
  const { teamId } = useParams();
  const { currentTeam, isAdmin, teamMembership } = useTeam();
  const { user } = useAuth();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [roleFilters, setRoleFilters] = useState([]);
  const [statusFilters, setStatusFilters] = useState([]);
  const [specialityFilter, setSpecialityFilter] = useState('');
  const [search, setSearch] = useState('');

  const isManagerRole = teamMembership?.role === 'Manager';
  const canEdit = isAdmin() || isManagerRole;
  const tid = teamId || currentTeam?._id;

  const load = useCallback(async () => {
    if (!tid) return;
    setLoading(true);
    try {
      const [resData, projData] = await Promise.all([
        resourceService.getResourceOverview(tid, { month, year }),
        projectService.getProjects(tid),
      ]);
      setMembers(resData.data || []);
      setProjects(projData.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error loading resources');
    } finally {
      setLoading(false);
    }
  }, [tid, month, year]);

  useEffect(() => { load(); }, [load]);

  const handleAssign = async ({ userId, projectId, allocationPercentage }) => {
    setAssignLoading(true);
    try {
      await resourceService.assignResource(tid, { userId, projectId, allocationPercentage, month, year });
      toast.success('Resource assigned successfully');
      setAssignTarget(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error assigning resource');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemove = async (member, alloc) => {
    try {
      await resourceService.removeAllocation(tid, {
        userId: member.user?._id || member._id,
        projectId: alloc.project?._id || alloc.project,
        month,
        year,
      });
      toast.success('Allocation removed');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error removing allocation');
    }
  };

  const specialityOptions = Array.from(
    new Set(
      members
        .map((member) => getMemberDesignation(member))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  // Filter members
  const filteredMembers = members.filter((m) => {
    const name = (m.user?.name || m.name || '').toLowerCase();
    const speciality = getMemberDesignation(m).toLowerCase();
    const used = m.usedPercentage || 0;
    const searchTerm = search.toLowerCase();
    if (search && !name.includes(searchTerm) && !speciality.includes(searchTerm)) return false;
    if (roleFilters.length > 0 && !roleFilters.includes(m.role)) return false;
    if (specialityFilter && getMemberDesignation(m) !== specialityFilter) return false;
    if (statusFilters.length > 0) {
      const matchesStatus = statusFilters.some((status) => {
        if (status === 'low') return used < 50;
        if (status === 'partial') return used >= 50 && used < 80;
        if (status === 'full') return used >= 80 && used <= 100;
        if (status === 'over') return used > 100;
        return false;
      });
      if (!matchesStatus) return false;
    }
    return true;
  });

  const hasActiveFilters =
    Boolean(search) ||
    roleFilters.length > 0 ||
    statusFilters.length > 0 ||
    Boolean(specialityFilter);

  // Stats
  const total = members.length;
  const overAllocated = members.filter((m) => (m.usedPercentage || 0) > 100).length;
  const available = members.filter((m) => (m.usedPercentage || 0) < 60).length;
  const avgUtil = total ? Math.round(members.reduce((s, m) => s + (m.usedPercentage || 0), 0) / total) : 0;

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resource Management</h1>
              <p className="text-sm text-gray-500">Manage team capacity and project assignments</p>
            </div>
          </div>

          {/* Month / Year selector */}
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white font-medium"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white font-medium"
            >
              {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={load} className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50">
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Members', value: total, icon: Users, color: 'bg-blue-50 text-blue-600' },
            { label: 'Avg Utilization', value: `${avgUtil}%`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Available', value: available, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
            { label: 'Over-allocated', value: overAllocated, icon: AlertTriangle, color: overAllocated > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex-1 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by member or speciality…"
                className="outline-none text-sm bg-transparent w-full"
              />
            </div>
            <div className="min-w-[220px] flex-1">
              <MultiSelectDropdown
                options={ROLE_FILTER_OPTIONS}
                selectedValues={roleFilters}
                onChange={setRoleFilters}
                placeholder="All Members"
                displayField="label"
                valueField="value"
              />
            </div>
            <div className="min-w-[220px] flex-1">
              <MultiSelectDropdown
                options={STATUS_FILTER_OPTIONS}
                selectedValues={statusFilters}
                onChange={setStatusFilters}
                placeholder="All Status"
                displayField="label"
                valueField="value"
              />
            </div>
            <select
              value={specialityFilter}
              onChange={(e) => setSpecialityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white min-w-[180px]"
            >
              <option value="">All Specialities</option>
              {specialityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch('');
                setRoleFilters([]);
                setStatusFilters([]);
                setSpecialityFilter('');
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 bg-white flex items-center gap-1.5 whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading resource data…</p>
            </div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No team members found</p>
            <p className="text-sm text-gray-400 mt-1">
              {hasActiveFilters ? 'Try clearing filters' : 'No bandwidth reports submitted for this period'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.user?._id || member._id}
                member={member}
                projects={projects}
                onAssign={setAssignTarget}
                onRemove={handleRemove}
                canEdit={canEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Assign modal */}
      {assignTarget && (
        <AssignModal
          member={assignTarget}
          projects={projects}
          onClose={() => setAssignTarget(null)}
          onAssign={handleAssign}
          loading={assignLoading}
        />
      )}
    </div>
  );
};

export default ResourceManagement;
