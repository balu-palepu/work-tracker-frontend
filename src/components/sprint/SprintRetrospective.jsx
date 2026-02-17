import React, { useState } from 'react';
import { MessageSquare, Plus, X, CheckCircle, ThumbsUp, AlertTriangle, ListChecks } from 'lucide-react';

const SprintRetrospective = ({ sprint, onSubmit }) => {
  const hasRetro = !!sprint?.retrospective?.completedAt;

  const [whatWentWell, setWhatWentWell] = useState(sprint?.retrospective?.whatWentWell || '');
  const [whatNeedImprovement, setWhatNeedImprovement] = useState(sprint?.retrospective?.whatNeedImprovement || '');
  const [actionItems, setActionItems] = useState(sprint?.retrospective?.actionItems || []);
  const [newAction, setNewAction] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addActionItem = () => {
    if (!newAction.trim()) return;
    setActionItems([...actionItems, newAction.trim()]);
    setNewAction('');
  };

  const removeActionItem = (index) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!whatWentWell.trim() && !whatNeedImprovement.trim() && actionItems.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit({ whatWentWell, whatNeedImprovement, actionItems });
    } catch {
      // handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  if (hasRetro) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-bold text-gray-900">Sprint Retrospective</h2>
          <span className="text-xs text-gray-400 ml-2">
            Completed {new Date(sprint.retrospective.completedAt).toLocaleDateString()}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-l-4 border-green-400 pl-4">
            <div className="flex items-center gap-1.5 mb-2">
              <ThumbsUp className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-900">What Went Well</h3>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{sprint.retrospective.whatWentWell || 'Nothing noted.'}</p>
          </div>
          <div className="border-l-4 border-orange-400 pl-4">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-semibold text-gray-900">What Needs Improvement</h3>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{sprint.retrospective.whatNeedImprovement || 'Nothing noted.'}</p>
          </div>
        </div>
        {sprint.retrospective.actionItems?.length > 0 && (
          <div className="mt-6 border-l-4 border-blue-400 pl-4">
            <div className="flex items-center gap-1.5 mb-2">
              <ListChecks className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Action Items</h3>
            </div>
            <ul className="space-y-1.5">
              {sprint.retrospective.actionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-bold text-gray-900">Sprint Retrospective</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ThumbsUp className="w-4 h-4 text-green-600" />
            <label className="text-sm font-semibold text-gray-900">What Went Well</label>
          </div>
          <textarea
            value={whatWentWell}
            onChange={(e) => setWhatWentWell(e.target.value)}
            placeholder="What worked well in this sprint..."
            rows={4}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none border-l-4 border-l-green-400"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <label className="text-sm font-semibold text-gray-900">What Needs Improvement</label>
          </div>
          <textarea
            value={whatNeedImprovement}
            onChange={(e) => setWhatNeedImprovement(e.target.value)}
            placeholder="What could be improved..."
            rows={4}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none border-l-4 border-l-orange-400"
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-2">
          <ListChecks className="w-4 h-4 text-blue-600" />
          <label className="text-sm font-semibold text-gray-900">Action Items</label>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <input
            value={newAction}
            onChange={(e) => setNewAction(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addActionItem()}
            placeholder="Add an action item..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent border-l-4 border-l-blue-400"
          />
          <button
            onClick={addActionItem}
            disabled={!newAction.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {actionItems.length > 0 && (
          <ul className="space-y-2">
            {actionItems.map((item, i) => (
              <li key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                <span className="flex-1 text-sm text-gray-700">{item}</span>
                <button onClick={() => removeActionItem(i)} className="p-0.5 text-gray-400 hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Saving...' : 'Save Retrospective'}
        </button>
      </div>
    </div>
  );
};

export default SprintRetrospective;
