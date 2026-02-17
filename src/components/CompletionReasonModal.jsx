import React, { useState } from 'react';
import BaseModal from './shared/BaseModal';

const CompletionReasonModal = ({ isOpen, onClose, onSubmit, taskTitle, targetStatus }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ completionReason: reason });
      setReason('');
    } catch (error) {
      console.error('Completion submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Mark as ${targetStatus || 'Complete'}`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Task:</span> {taskTitle}
          </p>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Closing Comment
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter Closing Comment"
            rows={3}
            maxLength={500}
            required
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <span className="text-xs text-gray-500 self-center">Comment required to close</span>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Complete'}
            </button>
          </div>
        </div>
      </form>
    </BaseModal>
  );
};

export default CompletionReasonModal;
