export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr));
};

export const formatExperience = (years: number): string => {
  if (years === 0) return 'Débutant';
  if (years === 1) return '1 an';
  return `${years} ans`;
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    validated: 'Validé',
    rejected: 'Rejeté',
    deleted: 'Supprimé',
  };
  return labels[status] ?? status;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: '#f59e0b',
    validated: '#10b981',
    rejected: '#ef4444',
    deleted: '#6b7280',
  };
  return colors[status] ?? '#6b7280';
};

export const truncate = (str: string, maxLen: number): string =>
  str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;

export const buildQueryString = (params: Record<string, unknown>): string => {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return query ? `?${query}` : '';
};

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
