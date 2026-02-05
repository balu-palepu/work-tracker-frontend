import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

const TableHeader = ({ columns, sortField, sortOrder, onSort }) => {
  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-blue-600" />
    );
  };

  return (
    <thead className="bg-gray-50">
      <tr>
        {columns.map((column) => (
          <th
            key={column.field}
            scope="col"
            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
              column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
            }`}
            onClick={() => column.sortable && onSort(column.field)}
          >
            <div className="flex items-center gap-2">
              <span>{column.label}</span>
              {column.sortable && getSortIcon(column.field)}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default TableHeader;
