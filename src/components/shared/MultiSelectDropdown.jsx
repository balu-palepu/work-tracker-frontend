import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

const MultiSelectDropdown = ({
  options = [],
  selectedValues = [],
  onChange,
  placeholder = 'Select items',
  label = '',
  displayField = 'name',
  valueField = '_id',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option[displayField]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const removeValue = (value, e) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => v !== value));
  };

  const getSelectedOptions = () => {
    return options.filter(option => selectedValues.includes(option[valueField]));
  };

  const selectedOptions = getSelectedOptions();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Dropdown Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-gray-400 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 flex flex-wrap gap-2">
            {selectedOptions.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              selectedOptions.map(option => (
                <span
                  key={option[valueField]}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                >
                  {option[displayField]}
                  <button
                    onClick={(e) => removeValue(option[valueField], e)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Select All / Deselect All */}
          {filteredOptions.length > 0 && (
            <div className="px-3 py-1.5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const allFilteredValues = filteredOptions.map(o => o[valueField]);
                  const allSelected = allFilteredValues.every(v => selectedValues.includes(v));
                  if (allSelected) {
                    onChange(selectedValues.filter(v => !allFilteredValues.includes(v)));
                  } else {
                    const merged = [...new Set([...selectedValues, ...allFilteredValues])];
                    onChange(merged);
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {filteredOptions.every(o => selectedValues.includes(o[valueField]))
                  ? `Deselect All (${filteredOptions.length})`
                  : `Select All (${filteredOptions.length})`}
              </button>
              <span className="text-[10px] text-gray-400">{selectedValues.length} selected</span>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No results found
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = selectedValues.includes(option[valueField]);
                return (
                  <div
                    key={option[valueField]}
                    onClick={() => toggleOption(option[valueField])}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 hover:bg-blue-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-500 border-blue-300'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>

                    {/* Option Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {option[displayField]}
                      </p>
                      {option.email && (
                        <p className="text-xs text-gray-500 truncate">
                          {option.email}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {selectedValues.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all ({selectedValues.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
