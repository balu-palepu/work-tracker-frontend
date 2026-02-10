import React, { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';

/**
 * Reusable download report button with dropdown for multiple options
 */
const DownloadReportButton = ({
  label = 'Download',
  options = [],
  onDownload,
  disabled = false,
  className = '',
  variant = 'default', // 'default', 'primary', 'secondary'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (option) => {
    if (downloading) return;

    setDownloading(true);
    setIsOpen(false);

    try {
      if (option.action) {
        await option.action();
      } else if (onDownload) {
        await onDownload(option);
      }
      toast.success(`${option.label || 'Report'} downloaded successfully`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error.response?.data?.message || 'Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const baseClasses = 'inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
  };

  // Single button mode (no dropdown)
  if (options.length === 0 && onDownload) {
    return (
      <button
        onClick={() => handleDownload({})}
        disabled={disabled || downloading}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      >
        <Download className="h-4 w-4" />
        <span>{downloading ? 'Downloading...' : label}</span>
      </button>
    );
  }

  // Single option mode
  if (options.length === 1) {
    return (
      <button
        onClick={() => handleDownload(options[0])}
        disabled={disabled || downloading}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      >
        <Download className="h-4 w-4" />
        <span>{downloading ? 'Downloading...' : options[0].label || label}</span>
      </button>
    );
  }

  // Dropdown mode for multiple options
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || downloading}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      >
        <Download className="h-4 w-4" />
        <span>{downloading ? 'Downloading...' : label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
            {options.map((option, index) => (
              <button
                key={option.key || index}
                onClick={() => handleDownload(option)}
                disabled={option.disabled}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {option.icon && <span className="text-gray-400">{option.icon}</span>}
                <div>
                  <div className="font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-gray-500">{option.description}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DownloadReportButton;
