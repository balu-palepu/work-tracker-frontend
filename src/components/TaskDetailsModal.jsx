import React, { useEffect, useMemo, useState } from 'react';
import { X, MessageSquare, User } from 'lucide-react';
import taskService from '../services/taskService';

const TaskDetailsModal = ({ isOpen, onClose, teamId, projectId, taskId, assignees = [] }) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentMentions, setCommentMentions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && teamId && projectId && taskId) {
      loadTask();
    }
  }, [isOpen, teamId, projectId, taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTask(teamId, projectId, taskId);
      setTask(response.data);
    } catch (error) {
      console.error('Error loading task details:', error);
      setTask(null);
    } finally {
      setLoading(false);
    }
  };

  const mentionOptions = useMemo(() => {
    const parts = commentText.trim().split(/\s+/);
    const last = parts[parts.length - 1] || '';
    if (!last.startsWith('@')) return [];
    const query = last.slice(1).toLowerCase();
    if (!query) return [];
    return assignees
      .filter((member) => member.name?.toLowerCase().includes(query))
      .slice(0, 6);
  }, [commentText, assignees]);

  const insertMention = (member) => {
    const parts = commentText.trim().split(/\s+/);
    parts[parts.length - 1] = `@${member.name}`;
    const nextText = `${parts.join(' ')} `;
    setCommentText(nextText);
    setCommentMentions((prev) => {
      if (prev.includes(member._id)) return prev;
      return [...prev, member._id];
    });
  };

  const getMentionIdsFromText = (text) => {
    if (!text || !assignees.length) return [];
    const lowerText = text.toLowerCase();
    return assignees
      .filter((member) => member.name && lowerText.includes(`@${member.name.toLowerCase()}`))
      .map((member) => member._id);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    if (!teamId || !projectId || !taskId) return;

    try {
      setSubmitting(true);
      const derivedMentions = getMentionIdsFromText(commentText);
      const combinedMentions = Array.from(new Set([...commentMentions, ...derivedMentions]));
      await taskService.addTaskComment(teamId, projectId, taskId, {
        text: commentText,
        mentions: combinedMentions
      });
      setCommentText('');
      setCommentMentions([]);
      await loadTask();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Task Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center text-gray-500">Loading task...</div>
          ) : task ? (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                  <span>Status: {task.status}</span>
                  <span>Priority: {task.priority}</span>
                  <span>Assignee: {task.assignedTo?.name || 'Unassigned'}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-900">Conversation</h4>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {task.comments && task.comments.length > 0 ? (
                    task.comments.map((comment, index) => (
                      <div key={comment._id || index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-3 w-3 text-blue-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {comment.user?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No comments yet.</p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add a comment
                  </label>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Enter @ to mention a teammate"
                  />
                  {mentionOptions.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                      {mentionOptions.map((member) => (
                        <button
                          key={member._id}
                          type="button"
                          onClick={() => insertMention(member)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          @{member.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end mt-3">
                    <button
                      type="button"
                      onClick={handleSubmitComment}
                      disabled={submitting || !commentText.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500">Task not found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
