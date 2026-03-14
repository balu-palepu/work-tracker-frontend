import React, { useMemo } from 'react';
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

const TrackingBoard = ({
  tasks,
  loading,
  onTaskDelete,
  onTaskStatusChange,
  workflowStatuses,
  onNavigateToCreate,
  onNavigateToTask,
  onNavigateToComplete,
}) => {

  // Build columns from workflow statuses
  const columns = useMemo(() => {
    const statuses = workflowStatuses?.length ? workflowStatuses : DEFAULT_COLUMNS;
    return [...statuses]
      .filter((s) => s.id !== 'closed')
      .map((s) => {
        if (s.id === 'new') return { ...s, id: 'todo', label: 'To Do', category: 'todo' };
        if (s.id === 'active') return { ...s, id: 'inprogress', label: 'In Progress', category: 'inprogress' };
        if (s.id === 'resolved') return { ...s, label: 'Completed/Closed', category: 'completed' };
        // Normalise category so headers always get the right style
        const cat = s.category;
        if (!cat || !CATEGORY_STYLES[cat]) {
          if (s.id === 'todo' || s.id === 'backlog') return { ...s, category: 'todo' };
          if (s.id === 'inprogress' || s.id === 'in_progress') return { ...s, category: 'inprogress' };
          return { ...s, category: 'completed' };
        }
        return s;
      })
      .sort((a, b) => a.order - b.order);
  }, [workflowStatuses]);

  // Build title map for parent breadcrumbs
  const taskTitleMap = useMemo(() => {
    const tMap = {};
    tasks.forEach((t) => { tMap[t._id] = t.title; });
    return tMap;
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
                    columnTasks.map((task, index) => (
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
                              parentTaskTitle={getParentTitle(task)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}

                  {/* New Item → navigate to create page */}
                  {onNavigateToCreate && (
                    <button
                      onClick={handleCreateTask}
                      className="w-full py-2 text-sm text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> New Item
                    </button>
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
