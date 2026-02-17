import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { addDays, differenceInDays, format, startOfDay, startOfWeek } from 'date-fns';
import WorkItemIcon from '../shared/WorkItemIcon';

const ZOOM_LEVELS = [
  { id: 'day', label: 'Day', unitDays: 1, spanDays: 14 },
  { id: 'week', label: 'Week', unitDays: 7, spanDays: 56 },
  { id: 'month', label: 'Month', unitDays: 30, spanDays: 180 },
];

const WORK_ITEM_LABELS = {
  epic: 'Epic',
  feature: 'Feature',
  story: 'User Story',
  task: 'Task',
  bug: 'Bug',
  subtask: 'Subtask',
};

const SPRINT_COLORS = {
  active: { bg: 'bg-blue-100/70', border: 'border-blue-300', text: 'text-blue-800', barBg: '#3B82F6' },
  completed: { bg: 'bg-green-100/70', border: 'border-green-300', text: 'text-green-800', barBg: '#10B981' },
  planning: { bg: 'bg-gray-100/70', border: 'border-gray-300', text: 'text-gray-700', barBg: '#9CA3AF' },
  cancelled: { bg: 'bg-red-100/70', border: 'border-red-300', text: 'text-red-700', barBg: '#EF4444' },
};

const formatRange = (start, end) => `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;

const computeBar = (itemStart, itemEnd, windowStart, totalDays) => {
  const startOffset = differenceInDays(itemStart, windowStart);
  const durationDays = Math.max(differenceInDays(itemEnd, itemStart), 1);
  const leftRaw = (startOffset / totalDays) * 100;
  const widthRaw = (durationDays / totalDays) * 100;
  const left = Math.max(0, leftRaw);
  const width = Math.min(widthRaw - (left - leftRaw), 100 - left);
  return { left: `${left}%`, width: `${Math.max(width, 1)}%` };
};

const TimelineView = ({ tasks, onOpenTask, workflowStatuses = [], sprints = [], onSprintClick }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [startDate, setStartDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const zoom = ZOOM_LEVELS[zoomLevel];
  const windowStart = startOfDay(startDate);
  const windowEnd = startOfDay(addDays(startDate, zoom.spanDays));

  const statusMap = useMemo(() => {
    const map = new Map();
    workflowStatuses.forEach((status) => map.set(status.id, status));
    return map;
  }, [workflowStatuses]);

  const columns = useMemo(() => {
    const list = [];
    let current = new Date(windowStart);
    while (current < windowEnd) {
      list.push({
        date: new Date(current),
        label: zoom.unitDays === 1 ? format(current, 'MMM d') : format(current, 'MMM d'),
      });
      current = addDays(current, zoom.unitDays);
    }
    return list;
  }, [windowStart, windowEnd, zoom.unitDays]);

  const monthBands = useMemo(() => {
    if (!columns.length) return [];
    const bands = [];
    columns.forEach((col, idx) => {
      const key = format(col.date, 'yyyy-MM');
      const label = format(col.date, 'MMM yyyy');
      const previous = bands[bands.length - 1];
      if (!previous || previous.key !== key) {
        bands.push({ key, label, start: idx, end: idx });
      } else {
        previous.end = idx;
      }
    });
    return bands;
  }, [columns]);

  // Compute sprint bars
  const sprintBars = useMemo(() => {
    if (!sprints.length) return [];
    return sprints
      .map((sprint) => {
        const sStart = sprint.startDate ? startOfDay(new Date(sprint.startDate)) : null;
        const sEnd = sprint.endDate ? startOfDay(new Date(sprint.endDate)) : null;
        if (!sStart || !sEnd) return null;
        const isVisible = !(sEnd < windowStart || sStart > windowEnd);
        if (!isVisible) return null;
        const bar = computeBar(sStart, sEnd, windowStart, zoom.spanDays);
        const colors = SPRINT_COLORS[sprint.status] || SPRINT_COLORS.planning;
        return { sprint, bar, colors };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.sprint.startDate) - new Date(b.sprint.startDate));
  }, [sprints, windowStart, windowEnd, zoom.spanDays]);

  const laneData = useMemo(() => {
    const inTimeline = [];
    const unscheduled = [];

    tasks.forEach((task) => {
      const rawStart = task.startDate ? startOfDay(new Date(task.startDate)) : null;
      const rawEnd = task.dueDate ? startOfDay(new Date(task.dueDate)) : null;

      if (!rawStart && !rawEnd) {
        unscheduled.push(task);
        return;
      }

      const taskStart = rawStart || rawEnd;
      const taskEnd = rawEnd || addDays(taskStart, 1);
      if (!taskStart || !taskEnd) {
        unscheduled.push(task);
        return;
      }

      const isVisible = !(taskEnd < windowStart || taskStart > windowEnd);
      if (!isVisible) return;

      const bar = computeBar(taskStart, taskEnd, windowStart, zoom.spanDays);
      const status = statusMap.get(task.status);
      inTimeline.push({
        task,
        statusLabel: status?.label || task.status || 'Unknown',
        color: status?.color || '#3B82F6',
        bar,
      });
    });

    inTimeline.sort((a, b) => {
      const aDate = new Date(a.task.startDate || a.task.dueDate || 0).getTime();
      const bDate = new Date(b.task.startDate || b.task.dueDate || 0).getTime();
      return aDate - bDate;
    });

    return { inTimeline, unscheduled };
  }, [tasks, windowStart, windowEnd, zoom.spanDays, statusMap]);

  const todayMarker = useMemo(() => {
    const today = startOfDay(new Date());
    const offset = differenceInDays(today, windowStart);
    const percent = (offset / zoom.spanDays) * 100;
    if (percent < 0 || percent > 100) return null;
    return `${percent}%`;
  }, [windowStart, zoom.spanDays]);

  const handleNavigate = (direction) => {
    const jump = Math.round(zoom.spanDays / 2);
    setStartDate((prev) => addDays(prev, direction === 'next' ? jump : -jump));
  };

  const hasSprints = sprintBars.length > 0;
  const hasContent = tasks.length > 0 || hasSprints;

  if (!hasContent) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
        <CalendarDays className="w-10 h-10 mx-auto mb-3 text-gray-400" />
        <p className="text-sm font-medium">No work items or sprints to show in timeline</p>
        <p className="text-xs mt-1">Create items with start or due dates to build roadmap visibility.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => handleNavigate('prev')} className="p-1.5 rounded-lg hover:bg-gray-200">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="px-3 py-1 text-xs rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200"
            >
              Today
            </button>
            <button type="button" onClick={() => handleNavigate('next')} className="p-1.5 rounded-lg hover:bg-gray-200">
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700">{formatRange(windowStart, windowEnd)}</span>
          </div>

          <div className="inline-flex rounded-lg border border-gray-300 bg-white overflow-hidden">
            {ZOOM_LEVELS.map((level, index) => (
              <button
                key={level.id}
                type="button"
                onClick={() => setZoomLevel(index)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  zoomLevel === index ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
          {hasSprints && <span>Sprints: {sprintBars.length}</span>}
          <span>Scheduled: {laneData.inTimeline.length}</span>
          <span>Unscheduled: {laneData.unscheduled.length}</span>
        </div>
      </div>

      <div className="flex min-h-[460px]">
        {/* Left panel */}
        <div className="w-56 sm:w-64 lg:w-80 border-r border-gray-200 flex-shrink-0">
          {/* Column headers spacer */}
          <div className="h-7 bg-gray-100 border-b border-gray-200" />
          <div className="h-10 bg-gray-50 border-b border-gray-200 px-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Item</span>
            <span className="text-[10px] text-gray-400">{laneData.inTimeline.length + sprintBars.length} rows</span>
          </div>

          {/* Sprint rows in left panel */}
          {hasSprints && (
            <>
              <div className="h-7 px-3 flex items-center text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50/50 border-b border-gray-200">
                Sprints
              </div>
              {sprintBars.map(({ sprint, colors }) => (
                <button
                  key={sprint._id}
                  type="button"
                  onClick={() => onSprintClick?.(sprint._id)}
                  className="w-full h-10 border-b border-gray-100 px-3 flex items-center gap-2 hover:bg-blue-50/40 text-left transition-colors group"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ backgroundColor: colors.barBg }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 truncate font-medium group-hover:text-blue-600">{sprint.name}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                    {sprint.status}
                  </span>
                </button>
              ))}
            </>
          )}

          {/* Task rows in left panel */}
          {laneData.inTimeline.length > 0 && (
            <>
              <div className="h-7 px-3 flex items-center text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 border-b border-gray-200">
                Work Items
              </div>
              {laneData.inTimeline.map(({ task, color }) => {
                const typeLabel = WORK_ITEM_LABELS[task.workItemType] || 'Task';
                return (
                  <button
                    key={task._id}
                    type="button"
                    onClick={() => onOpenTask(task._id)}
                    className="w-full h-14 border-b border-gray-100 px-3 flex items-center gap-2 hover:bg-blue-50/40 text-left transition-colors group"
                  >
                    <div className="w-0.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <WorkItemIcon type={task.workItemType} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 truncate font-medium group-hover:text-blue-600 transition-colors">{task.title}</p>
                      <p className="text-[11px] text-gray-500 truncate">{typeLabel}</p>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* Unscheduled items */}
          {laneData.unscheduled.length > 0 && (
            <>
              <div className="h-8 px-3 flex items-center justify-between text-[11px] font-semibold text-gray-500 bg-amber-50 border-b border-gray-200">
                <span>Unscheduled</span>
                <span className="text-[10px] font-medium text-amber-600">{laneData.unscheduled.length}</span>
              </div>
              {laneData.unscheduled.slice(0, 6).map((task) => (
                <button
                  key={task._id}
                  type="button"
                  onClick={() => onOpenTask(task._id)}
                  className="w-full h-10 border-b border-gray-100 px-3 flex items-center gap-2 text-gray-500 hover:bg-gray-50 text-left"
                >
                  <WorkItemIcon type={task.workItemType} size="xs" />
                  <p className="text-sm truncate">{task.title}</p>
                </button>
              ))}
              {laneData.unscheduled.length > 6 && (
                <div className="h-8 px-3 flex items-center text-[10px] text-gray-400">
                  +{laneData.unscheduled.length - 6} more
                </div>
              )}
            </>
          )}
        </div>

        {/* Right panel - timeline bars */}
        <div className="flex-1 overflow-x-auto">
          {/* Month header */}
          <div className="h-7 bg-gray-100 border-b border-gray-200 flex">
            {monthBands.map((band) => {
              const span = band.end - band.start + 1;
              return (
                <div
                  key={band.key}
                  className="border-r border-gray-200 px-2 flex items-center text-[10px] font-semibold uppercase tracking-wide text-gray-500"
                  style={{ width: `${(span / columns.length) * 100}%` }}
                >
                  {band.label}
                </div>
              );
            })}
          </div>

          {/* Day/week column headers */}
          <div className="h-10 bg-gray-50 border-b border-gray-200 flex">
            {columns.map((col, idx) => (
              <div
                key={`${col.date.toISOString()}-${idx}`}
                className="flex-shrink-0 border-r border-gray-200 flex items-center justify-center text-[11px] text-gray-600 font-medium"
                style={{ width: `${100 / columns.length}%`, minWidth: '76px' }}
              >
                {col.label}
              </div>
            ))}
          </div>

          {/* Timeline content */}
          <div className="relative">
            {/* Today marker */}
            {todayMarker && (
              <div className="absolute top-0 bottom-0 z-20 pointer-events-none" style={{ left: todayMarker }}>
                <div className="w-0.5 h-full bg-red-400" />
                <div className="absolute -top-0.5 -translate-x-1/2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Today
                </div>
              </div>
            )}

            {/* Sprint bars */}
            {hasSprints && (
              <>
                <div className="h-7 border-b border-gray-200 bg-blue-50/30" />
                {sprintBars.map(({ sprint, bar, colors }) => (
                  <div key={sprint._id} className="h-10 border-b border-gray-100 relative bg-white">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {columns.map((_, idx) => (
                        <div
                          key={`sprint-grid-${sprint._id}-${idx}`}
                          className="flex-shrink-0 border-r border-gray-100"
                          style={{ width: `${100 / columns.length}%`, minWidth: '76px' }}
                        />
                      ))}
                    </div>
                    {/* Sprint bar */}
                    <button
                      type="button"
                      onClick={() => onSprintClick?.(sprint._id)}
                      className="absolute top-1.5 h-7 rounded-md px-2 text-xs font-semibold truncate hover:opacity-80 shadow-sm border flex items-center gap-1"
                      style={{
                        left: bar.left,
                        width: bar.width,
                        backgroundColor: colors.barBg + '25',
                        borderColor: colors.barBg + '60',
                        color: colors.barBg,
                      }}
                      title={`${sprint.name} (${sprint.status}) - ${format(new Date(sprint.startDate), 'MMM d')} to ${format(new Date(sprint.endDate), 'MMM d')}`}
                    >
                      {sprint.name}
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* Work item section header spacer */}
            {laneData.inTimeline.length > 0 && (
              <div className="h-7 border-b border-gray-200 bg-gray-50/60" />
            )}

            {/* Work item bars */}
            {laneData.inTimeline.map(({ task, bar, statusLabel, color }, index) => (
              <div key={task._id} className={`h-14 border-b border-gray-100 relative ${index % 2 ? 'bg-white' : 'bg-gray-50/40'}`}>
                <div className="absolute inset-0 flex">
                  {columns.map((_, idx) => (
                    <div
                      key={`${task._id}-grid-${idx}`}
                      className="flex-shrink-0 border-r border-gray-100"
                      style={{ width: `${100 / columns.length}%`, minWidth: '76px' }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenTask(task._id)}
                  className="absolute top-3 h-8 rounded-md px-2 text-white text-xs font-semibold truncate hover:opacity-90 shadow-sm"
                  style={{ left: bar.left, width: bar.width, backgroundColor: color }}
                  title={`${task.title} - ${statusLabel}`}
                >
                  {task.title}
                </button>
              </div>
            ))}

            {/* Unscheduled placeholders */}
            {laneData.unscheduled.length > 0 && (
              <>
                <div className="h-8 border-b border-gray-200 bg-gray-100" />
                {laneData.unscheduled.slice(0, 6).map((task) => (
                  <div key={`blank-${task._id}`} className="h-10 border-b border-gray-100 bg-gray-50/40" />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
