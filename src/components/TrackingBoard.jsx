import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, ListTodo, Zap, CheckCircle2 } from 'lucide-react';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import TaskDetailsModal from './TaskDetailsModal';

const COLUMNS = [
  {
    id: 'todo',
    title: 'To Do',
    icon: ListTodo,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  {
    id: 'inprogress',
    title: 'In Progress',
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'completed',
    title: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
];

const TrackingBoard = ({
  tasks,
  loading,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onTaskStatusChange,
  assignees,
  teamId,
  projectId,
  initialTaskId,
  sprintEndDate
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('todo');
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [lastOpenedTaskId, setLastOpenedTaskId] = useState(null);

  const getTasksByStatus = (status) => {
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => a.position - b.position);
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const newPosition = destination.index;

    // Update task status
    onTaskStatusChange(draggableId, newStatus, newPosition, source.droppableId, source.index);
  };

  const handleCreateTask = (status) => {
    setEditingTask(null);
    setDefaultStatus(status);
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setDefaultStatus(task.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (taskData) => {
    try {
      if (editingTask) {
        await onTaskUpdate(editingTask._id, taskData);
      } else {
        await onTaskCreate({ ...taskData, status: defaultStatus });
      }
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      throw error;
    }
  };

  React.useEffect(() => {
    if (initialTaskId && initialTaskId !== lastOpenedTaskId) {
      setDetailTaskId(initialTaskId);
      setLastOpenedTaskId(initialTaskId);
    }
  }, [initialTaskId, lastOpenedTaskId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto">
          <div className="min-w-full inline-flex p-5 gap-6">
            {COLUMNS.map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              const IconComponent = column.icon;

              return (
                <div key={column.id} className="flex-1 min-w-[350px] flex flex-col">
                  {/* Column Header */}
                  <div className={`${column.bgColor} ${column.borderColor} border-2 rounded-t-xl px-4 py-3 flex items-center justify-between`}>
                    <div className="flex items-center space-x-2">
                      <IconComponent className={`w-5 h-5 ${column.color}`} />
                      <h3 className="font-bold text-gray-900">{column.title}</h3>
                      <span className="px-2 py-0.5 bg-white rounded-full text-xs font-semibold text-gray-600">
                        {columnTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCreateTask(column.id)}
                      className={`p-1.5 hover:bg-white rounded-lg transition-colors ${column.color}`}
                      title="Add task"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Droppable Area */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
                          ${column.bgColor} ${column.borderColor} border-2 border-t-0 rounded-b-xl p-3 space-y-3 overflow-y-auto overflow-x-hidden h-[750px]
                          ${snapshot.isDraggingOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
                        `}
                      >
                        {columnTasks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <IconComponent className="w-12 h-12 mb-2 opacity-30" />
                            <p className="text-sm font-medium">No tasks yet</p>
                            <p className="text-xs mt-1">Drag tasks here or click + to add</p>
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
                                    onEdit={() => handleEditTask(task)}
                                    onDelete={() => onTaskDelete(task._id)}
                                    onOpen={() => setDetailTaskId(task._id)}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingTask}
        assignees={assignees}
        sprintEndDate={sprintEndDate}
      />

      <TaskDetailsModal
        isOpen={!!detailTaskId}
        onClose={() => setDetailTaskId(null)}
        teamId={teamId}
        projectId={projectId}
        taskId={detailTaskId}
        assignees={assignees}
      />
    </>
  );
};

export default TrackingBoard;
