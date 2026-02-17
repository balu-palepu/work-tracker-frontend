import React, { useState, useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, isWithinInterval,
  format, addMonths, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import WorkItemIcon from '../shared/WorkItemIcon';

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SprintCalendarView = ({
  tasks = [],
  sprintStartDate,
  sprintEndDate,
  workflowStatuses = [],
  onOpenTask,
}) => {
  const sprintStart = sprintStartDate ? new Date(sprintStartDate) : null;
  const sprintEnd = sprintEndDate ? new Date(sprintEndDate) : null;

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (sprintStart) return startOfMonth(sprintStart);
    return startOfMonth(new Date());
  });

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const tasksByDate = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const key = format(new Date(task.dueDate), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(task);
    });
    return map;
  }, [tasks]);

  const unscheduledTasks = useMemo(() => tasks.filter((t) => !t.dueDate), [tasks]);
  const scheduledCount = tasks.length - unscheduledTasks.length;

  const sprintInterval =
    sprintStart && sprintEnd ? { start: sprintStart, end: sprintEnd } : null;

  const today = new Date();

  const getStatusColor = (task) => {
    const ws = workflowStatuses.find((s) => s.id === task.status);
    return ws?.color || '#6B7280';
  };

  const getStatusCategory = (task) => {
    const ws = workflowStatuses.find((s) => s.id === task.status);
    return ws?.category || 'todo';
  };

  return (
    <div className="space-y-4">
      {/* Calendar card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Month navigation header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="text-center">
            <h3 className="text-sm font-bold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            {sprintStart && sprintEnd && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                Sprint: {format(sprintStart, 'MMM d')} - {format(sprintEnd, 'MMM d, yyyy')}
              </p>
            )}
          </div>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Stats row */}
        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-4 text-[11px] text-gray-500 bg-white">
          <span>{tasks.length} total items</span>
          <span>{scheduledCount} scheduled</span>
          <span>{unscheduledTasks.length} unscheduled</span>
          <button
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
            className="ml-auto text-blue-600 hover:text-blue-800 font-medium"
          >
            Today
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {DAY_HEADERS.map((day) => (
            <div key={day} className="px-2 py-2 text-[11px] font-semibold text-gray-500 text-center uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayTasks = tasksByDate.get(key) || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isInSprint = sprintInterval ? isWithinInterval(day, sprintInterval) : true;
            const isToday = isSameDay(day, today);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <div
                key={key}
                className={`min-h-[110px] border-b border-r border-gray-100 p-1 transition-colors ${
                  !isCurrentMonth
                    ? 'bg-gray-50 opacity-40'
                    : isInSprint
                      ? isWeekend ? 'bg-gray-50/50' : 'bg-white'
                      : 'bg-gray-50'
                } ${isToday ? 'ring-2 ring-inset ring-blue-400' : ''}`}
              >
                {/* Date number */}
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={`text-xs font-medium inline-flex items-center justify-center ${
                      isToday
                        ? 'bg-blue-600 text-white w-6 h-6 rounded-full'
                        : !isCurrentMonth
                          ? 'text-gray-300'
                          : 'text-gray-500'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[9px] font-bold text-gray-400">{dayTasks.length}</span>
                  )}
                </div>

                {/* Task chips */}
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((task) => {
                    const color = getStatusColor(task);
                    const category = getStatusCategory(task);
                    return (
                      <button
                        key={task._id}
                        onClick={() => onOpenTask(task._id)}
                        className="w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded truncate flex items-center gap-1 hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: color + '15',
                          borderLeft: `2px solid ${color}`,
                        }}
                        title={task.title}
                      >
                        <WorkItemIcon type={task.workItemType} size={10} />
                        <span
                          className="truncate"
                          style={{ color: category === 'completed' ? '#6B7280' : '#1F2937' }}
                        >
                          {task.title}
                        </span>
                      </button>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <span className="text-[9px] text-gray-400 px-1">+{dayTasks.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unscheduled tasks */}
      {unscheduledTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">
              Unscheduled Items ({unscheduledTasks.length})
            </span>
            <span className="text-[10px] text-amber-500 ml-1">No due date assigned</span>
          </div>
          <div className="p-3 flex flex-wrap gap-1.5">
            {unscheduledTasks.map((task) => {
              const color = getStatusColor(task);
              return (
                <button
                  key={task._id}
                  onClick={() => onOpenTask(task._id)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border hover:shadow-sm transition-shadow max-w-[220px] truncate"
                  style={{
                    borderColor: color + '40',
                    backgroundColor: color + '08',
                  }}
                >
                  <WorkItemIcon type={task.workItemType} size={12} />
                  <span className="truncate text-gray-800">{task.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintCalendarView;
