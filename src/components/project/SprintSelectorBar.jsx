import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Calendar, ChevronDown, ChevronRight, ExternalLink, Zap, CheckCircle2, XCircle, Clock } from 'lucide-react';
import useClickOutside from '../../hooks/useClickOutside';

const STATUS_CONFIG = {
  active: { label: 'Active', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  planning: { label: 'Planning', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  completed: { label: 'Done', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-400' },
};

const SprintSelectorBar = ({
  sprints = [],
  activeSprint,
  selectedSprintId,
  onSprintSelect,
  backlogCount = 0,
  onManageSprints,
  onOpenSprintBoard,
  formatDate,
  sprintLoading,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const dropdownRef = useRef(null);
  useClickOutside(dropdownRef, useCallback(() => setIsOpen(false), []));

  const grouped = useMemo(() => {
    const active = sprints.filter((s) => s.status === 'active');
    const planning = sprints.filter((s) => s.status === 'planning');
    const completed = sprints.filter((s) => s.status === 'completed');
    const cancelled = sprints.filter((s) => s.status === 'cancelled');
    return { active, planning, completed, cancelled };
  }, [sprints]);

  const selectedSprint = sprints.find((s) => s._id === selectedSprintId);

  const label =
    selectedSprintId === 'backlog'
      ? 'Backlog'
      : selectedSprintId === 'all'
        ? 'All Tasks'
        : selectedSprint?.name || 'Select Sprint';

  const statusCfg = selectedSprint ? STATUS_CONFIG[selectedSprint.status] : null;

  const handleSelect = (id) => {
    onSprintSelect(id);
    setIsOpen(false);
  };

  const renderSprintRow = (sprint) => {
    const cfg = STATUS_CONFIG[sprint.status] || STATUS_CONFIG.planning;
    const isSelected = sprint._id === selectedSprintId;
    return (
      <button
        key={sprint._id}
        onClick={() => handleSelect(sprint._id)}
        className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors ${isSelected ? 'sprint-selected-row' : ''}`}
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm truncate ${isSelected ? 'font-semibold sprint-selected-text' : 'text-gray-800'}`}>
            {sprint.name}
          </p>
          <p className="text-[10px] text-gray-400">
            {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
          </p>
        </div>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>
          {cfg.label}
        </span>
      </button>
    );
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sprint dropdown trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="max-w-[200px] truncate">{label}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden">
                {sprintLoading ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">Loading sprints...</div>
                ) : (
                  <>
                    {/* Active sprints */}
                    {grouped.active.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 bg-green-50 border-b border-green-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Active
                          </span>
                        </div>
                        {grouped.active.map(renderSprintRow)}
                      </div>
                    )}

                    {/* Planning sprints */}
                    {grouped.planning.length > 0 && (
                      <div className="border-t border-gray-100">
                        <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Planning
                          </span>
                        </div>
                        {grouped.planning.map(renderSprintRow)}
                      </div>
                    )}

                    {/* Completed sprints (collapsible) */}
                    {grouped.completed.length > 0 && (
                      <div className="border-t border-gray-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowCompleted(!showCompleted); }}
                          className="w-full px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between hover:bg-gray-100"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Completed ({grouped.completed.length})
                          </span>
                          <ChevronRight className={`w-3 h-3 text-gray-400 transition-transform ${showCompleted ? 'rotate-90' : ''}`} />
                        </button>
                        {showCompleted && grouped.completed.map(renderSprintRow)}
                      </div>
                    )}

                    {/* Cancelled sprints */}
                    {grouped.cancelled.length > 0 && showCompleted && (
                      <div className="border-t border-gray-100">
                        <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Cancelled
                          </span>
                        </div>
                        {grouped.cancelled.map(renderSprintRow)}
                      </div>
                    )}

                    {sprints.length === 0 && (
                      <div className="px-4 py-4 text-center text-sm text-gray-400">No sprints yet</div>
                    )}

                    {/* Divider + special options */}
                    <div className="border-t border-gray-200">
                      <button
                        onClick={() => handleSelect('backlog')}
                        className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 text-sm ${selectedSprintId === 'backlog' ? 'sprint-selected-row font-semibold sprint-selected-text' : 'text-gray-700'}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                        Backlog
                        {backlogCount > 0 && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{backlogCount}</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleSelect('all')}
                        className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 text-sm ${selectedSprintId === 'all' ? 'sprint-selected-row font-semibold sprint-selected-text' : 'text-gray-700'}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                        All Tasks
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Selected sprint compact info */}
          {selectedSprint && (
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${statusCfg?.bg} ${statusCfg?.text}`}>
                {statusCfg?.label}
              </span>
              <span>{formatDate(selectedSprint.startDate)} - {formatDate(selectedSprint.endDate)}</span>
              <div className="flex items-center gap-1.5">
                <div className="w-20 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(selectedSprint.progress || 0, 100)}%` }}
                  />
                </div>
                <span className="font-medium text-gray-700">{selectedSprint.progress || 0}%</span>
              </div>
              <span>
                {selectedSprint.metrics?.completedStoryPoints || 0}/{selectedSprint.metrics?.totalStoryPoints || 0} SP
              </span>
              {selectedSprint.status === 'active' && selectedSprint.daysRemaining != null && (
                <span className="font-semibold text-blue-600">{selectedSprint.daysRemaining}d left</span>
              )}
              <button
                onClick={() => onOpenSprintBoard(selectedSprint._id)}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
              >
                Open Board <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Right side */}
          <div className="ml-auto">
            <button
              onClick={onManageSprints}
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Manage Sprints
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprintSelectorBar;
