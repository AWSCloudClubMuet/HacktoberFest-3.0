const Table = ({ 
  columns = [], 
  data = [], 
  keyField = 'id',
  onRowClick,
  className = '',
  emptyMessage = 'No data available',
  renderRowActions,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state py-12">
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`}>
      <table className="table" role="grid">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} scope="col" style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
            {renderRowActions && <th scope="col" className="w-32">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr 
              key={row[keyField]} 
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer' : ''}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row); }} : undefined}
            >
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {renderRowActions && (
                <td>
                  <div className="flex items-center gap-2">
                    {renderRowActions(row)}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;