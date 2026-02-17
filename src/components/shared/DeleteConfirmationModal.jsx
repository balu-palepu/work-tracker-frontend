import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import BaseModal from './BaseModal';

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'item',
  loading = false
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (confirmText.trim() !== itemName.trim()) {
      setError(`Please type "${itemName}" exactly to confirm deletion`);
      return;
    }

    setError('');
    onConfirm();
  };

  const handleClose = () => {
    if (!loading) {
      setConfirmText('');
      setError('');
      onClose();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && confirmText.trim() === itemName.trim()) {
      handleConfirm();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={null}
      size="sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <div className="bg-red-100 rounded-full p-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Delete {itemType}
        </h2>
      </div>

      {/* Body */}
      <div className="px-6 pb-4 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800 font-medium mb-2">
            Warning: This action cannot be undone
          </p>
          <p className="text-sm text-red-700">
            This will permanently delete the {itemType} and all associated data.
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-700 mb-2">
            Please type <span className="font-semibold text-gray-900">{itemName}</span> to confirm deletion:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => {
              setConfirmText(e.target.value);
              setError('');
            }}
            onKeyPress={handleKeyPress}
            placeholder={itemName}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            autoFocus
          />
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
        <button
          onClick={handleClose}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading || confirmText.trim() !== itemName.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </BaseModal>
  );
};

export default DeleteConfirmationModal;
