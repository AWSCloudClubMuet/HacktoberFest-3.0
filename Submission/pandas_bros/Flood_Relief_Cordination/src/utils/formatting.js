export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'PKR 0';
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-PK').format(num);
};

export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusBadgeClass = (status) => {
  const statusMap = {
    Active: 'badge-success',
    Full: 'badge-warning',
    Closed: 'badge-neutral',
    High: 'badge-danger',
    Medium: 'badge-warning',
    Low: 'badge-info',
    Pending: 'badge-warning',
    'In Transit': 'badge-info',
    Delivered: 'badge-success',
    Cancelled: 'badge-neutral',
    Cash: 'badge-info',
    'In-Kind': 'badge-success',
  };
  return statusMap[status] || 'badge-neutral';
};

export const getPriorityColor = (priority) => {
  const colors = {
    High: 'text-red-600 bg-red-50',
    Medium: 'text-amber-600 bg-amber-50',
    Low: 'text-blue-600 bg-blue-50',
  };
  return colors[priority] || 'text-slate-600 bg-slate-50';
};

export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};