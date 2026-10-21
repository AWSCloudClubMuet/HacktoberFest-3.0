import React from 'react';
import { Search, Inbox } from 'lucide-react';

export default function DataTable({ 
  columns = [], 
  data = [], 
  isLoading = false,
  emptyMessage = 'No matching records found',
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filterComponent,
  actionComponent
}) {
  return (
    <div className="data-table-container">
      {/* Table Toolbar */}
      {(onSearchChange || filterComponent || actionComponent) && (
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            {onSearchChange && (
              <div className="table-search-wrap">
                <Search size={16} className="table-search-icon" />
                <input
                  type="text"
                  className="table-search-input"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            )}
            {filterComponent}
          </div>
          {actionComponent && (
            <div className="table-toolbar-right">
              {actionComponent}
            </div>
          )}
        </div>
      )}

      {/* Table Surface */}
      <div className="table-responsive-wrapper">
        <table className="relief-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={col.key || idx} style={col.width ? { width: col.width } : undefined}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="table-state-cell">
                  <div className="table-loading-spinner" />
                  <span>Loading data...</span>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-state-cell empty">
                  <Inbox size={32} className="table-empty-icon" />
                  <p>{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={row.id || rowIndex}>
                  {columns.map((col, colIndex) => (
                    <td key={col.key || colIndex}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
