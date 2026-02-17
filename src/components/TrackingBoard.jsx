import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, ListTodo, Zap, CheckCircle2, Circle } from 'lucide-react';
import TaskCard from './TaskCard';

const DEFAULT_COLUMNS = [
  { id: 'todo', label: 'To Do', category: 'todo', color: '#6B7280', order: 0 },
  { id: 'inprogress', label: 'In Progress', category: 'inprogress', color: '#3B82F6', order: 1 },
  { id: 'resolved', label: 'Completed/Closed', category: 'completed', color: '#10B981', order: 2 },
];

const LEGACY_STATUS_MAP = {
  'new': 'todo',
  'active': 'inprogress',
  'todo': 'todo',
  'inprogress': 'inprogress',
  'done': 'resolved',
  'resolved': 'resolved',
  'completed': 'resolved',
  'closed': 'resolved',
};

const CATEGORY_STYLES = {
  todo: { icon: ListTodo, textColor: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
  inprogress: { icon: Zap, textColor: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  completed: { icon: CheckCircle2, textColor: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
};

const WIP_LIMIT = 10;

const COMPLETED_STATUSES = ['resolved', 'completed', 'closed', 'done'];

const TrackingBoard = ({
  tasks,
  loading,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onTaskStatusChange,
  onInlineTaskCreate,
  assignees,
  teamId,
  projectId,
  initialTaskId,
  sprintEndDate,
  workflowStatuses,
  workItemTypes,
  parentTasks,
  onNavigateToCreate,
  onNavigateToTask,
  onNavigateToComplete,
}) => {
  const [inlineCreateColumn, setInlineCreateColumn] = useState(null);
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineCreating, setInlineCreating] = useState(false);

  // Build columns from workflow statuses
  const columns = useMemo(() => {
    const statuses = workflowStatuses?.length ? workflowStatuses : DEFAULT_COLUMNS;
    return [...statuses]
      .filter((s) => s.id !== 'closed')
      .map((s) => {
        if (s.id === 'new') return { ...s, id: 'todo', label: 'To Do' };
        if (s.id === 'active') return { ...s, id: 'inprogress', label: 'In Progress' };
        if (s.id === 'resolved') return { ...s, label: 'Completed/Closed' };
        return s;
      })
      .sort((a, b) => a.order - b.order);
  }, [workflowStatuses]);

  // Compute subtask data from task list
  const { subtaskMap, taskTitleMap } = useMemo(() => {
    const sMap = {};
    const tMap = {};
    tasks.forEach((t) => {
      tMap[t._id] = t.title;
      const parentId = typeof t.parentTask === 'object' ? t.parentTask?._id : t.parentTask;
      if (parentId) {
        if (!sMap[parentId]) sMap[parentId] = { total: 0, completed: 0 };
        sMap[parentId].total++;
        if (COMPLETED_STATUSES.includes(String(t.status || '').toLowerCase())) {
          sMap[parentId].completed++;
        }
      }
    });
    return { subtaskMap: sMap, taskTitleMap: tMap };
  }, [tasks]);

  // Map task status to column
  const getTaskColumn = (task) => {
    const status = task.status;
    if (status === 'closed') return 'resolved';
    if (columns.some(c => c.id === status)) return status;
    if (LEGACY_STATUS_MAP[status]) return LEGACY_STATUS_MAP[status];
    return columns[0]?.id || 'todo';
  };

  const getTasksByColumn = (columnId, laneTasks) => {
    return laneTasks
      .filter(task => getTaskColumn(task) === columnId)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  };

  const isCompletedColumn = (columnId) => {
    const col = columns.find(c => c.id === columnId);
    return col?.category === 'completed';
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Extract actual column ID (remove lane prefix if present)
    const newStatus = destination.droppableId.split('__').pop();
    const sourceStatus = source.droppableId.split('__').pop();

    if (isCompletedColumn(newStatus) && !isCompletedColumn(sourceStatus)) {
      if (onNavigateToComplete) {
        onNavigateToComplete(draggableId, newStatus);
        return;
      }
    }

    onTaskStatusChange(draggableId, newStatus, destination.index, sourceStatus, source.index);
  };

  const handleCreateTask = () => {
    if (onNavigateToCreate) {
      onNavigateToCreate();
    }
  };

  const handleOpenTask = (taskId) => {
    if (onNavigateToTask) {
      onNavigateToTask(taskId);
    }
  };

  const handleInlineCreate = async (columnId) => {
    if (!inlineTitle.trim() || !onInlineTaskCreate) return;
    setInlineCreating(true);
    try {
      await onInlineTaskCreate({ title: inlineTitle.trim(), status: columnId, workItemType: 'task' });
      setInlineTitle('');
      setInlineCreateColumn(null);
    } catch {
      // error handled by parent
    } finally {
      setInlineCreating(false);
    }
  };

  const getParentTitle = (task) => {
    const parentId = typeof task.parentTask === 'object' ? task.parentTask?._id : task.parentTask;
    if (!parentId) return undefined;
    if (typeof task.parentTask === 'object' && task.parentTask?.title) return task.parentTask.title;
    return taskTitleMap[parentId];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderColumns = () => (
    <div className="min-w-full inline-flex p-4 gap-4">
      {columns.map((column) => {
        const columnTasks = getTasksByColumn(column.id, tasks);
        const categoryStyle = CATEGORY_STYLES[column.category] || CATEGORY_STYLES.todo;
        const columnSP = columnTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        const droppableId = column.id;

        return (
          <div key={column.id} className="flex-1 min-w-[300px] flex flex-col">
            {/* Column Header */}
            <div className={`${categoryStyle.bgColor} ${categoryStyle.borderColor} border-2 rounded-t-xl px-4 py-3 ${column.category === 'inprogress' ? 'tracking-board-inprogress tracking-board-inprogress-header' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="font-bold text-gray-900 text-sm">{column.label}</h3>
                  <span className="px-2 py-0.5 bg-white rounded-full text-xs font-semibold text-gray-600">
                    {columnTasks.length}
                  </span>
                  {columnSP > 0 && (
                    <span className="text-[10px] text-gray-400 font-medium">{columnSP} SP</span>
                  )}
                  {column.category === 'inprogress' && columnTasks.length > WIP_LIMIT && (
                    <span className="text-[10px] text-red-500 font-bold animate-pulse">WIP!</span>
                  )}
                </div>
                <button
                  onClick={handleCreateTask}
                  className={`p-1.5 hover:bg-white rounded-lg transition-colors ${categoryStyle.textColor}`}
                  title="Add task"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {tasks.length > 0 && (
                <div className="w-full h-0.5 bg-gray-200/60 rounded-full mt-2">
                  <div
                    className="h-0.5 rounded-full transition-all"
                    style={{ width: `${(columnTasks.length / Math.max(tasks.length, 1)) * 100}%`, backgroundColor: column.color }}
                  />
                </div>
              )}
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={droppableId}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    ${categoryStyle.bgColor} ${categoryStyle.borderColor} border-2 border-t-0 rounded-b-xl p-3 space-y-3 overflow-y-auto overflow-x-hidden h-[calc(100vh-400px)] min-h-[400px]
                    ${column.category === 'inprogress' ? 'tracking-board-inprogress tracking-board-inprogress-body' : ''}
                    ${snapshot.isDraggingOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
                  `}
                >
                  {columnTasks.length === 0 && !snapshot.isDraggingOver ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                      <Circle className="w-10 h-10 mb-2 opacity-30" />
                      <p className="text-xs font-medium">No items</p>
                    </div>
                  ) : (
                    columnTasks.map((task, index) => {
                      const sub = subtaskMap[task._id];
                      return (
                        <Draggable
                          key={task._id}
                          draggableId={task._id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskCard
                                task={task}
                                isDragging={snapshot.isDragging}
                                onEdit={() => handleOpenTask(task._id)}
                                onDelete={() => onTaskDelete(task._id)}
                                onOpen={() => handleOpenTask(task._id)}
                                subtaskCount={sub?.total || 0}
                                completedSubtasks={sub?.completed || 0}
                                parentTaskTitle={getParentTitle(task)}
                              />
                            </div>
                          )}
                        </Draggable>
                      );
                    })
                  )}
                  {provided.placeholder}

                  {/* Inline Quick Create */}
                  {onInlineTaskCreate && (
                    <>
                      {inlineCreateColumn === column.id ? (
                        <div className="bg-white border-2 border-blue-300 rounded-xl p-3 shadow-sm">
                          <input
                            autoFocus
                            value={inlineTitle}
                            onChange={(e) => setInlineTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && inlineTitle.trim()) handleInlineCreate(column.id);
                              if (e.key === 'Escape') { setInlineCreateColumn(null); setInlineTitle(''); }
                            }}
                            placeholder="What needs to be done?"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={inlineCreating}
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleInlineCreate(column.id)}
                              disabled={inlineCreating || !inlineTitle.trim()}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                              {inlineCreating ? 'Adding...' : 'Add'}
                            </button>
                            <button
                              onClick={() => { setInlineCreateColumn(null); setInlineTitle(''); }}
                              className="px-3 py-1.5 text-gray-500 text-xs hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setInlineCreateColumn(column.id); setInlineTitle(''); }}
                          className="w-full py-2 text-sm text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> New Item
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        );
      })}
    </div>
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto">
        {renderColumns()}
      </div>
    </DragDropContext>
  );
};

export default TrackingBoard;
