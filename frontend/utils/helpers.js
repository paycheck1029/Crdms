export const getInitials = (name) => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getAvatarColor = (name) => {
  const hash = Array.from(name || '').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    { bg: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', fg: 'var(--accent)' },
    { bg: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)', fg: '#a855f7' },
    { bg: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.2)', fg: '#ec4899' },
    { bg: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', fg: '#10b981' }
  ];
  return colors[hash % colors.length];
};

// Robust path parser solving backslash (Windows) vs forward slash (Linux/GCP) download url problems
export const getFilenameFromPath = (filePath) => {
  if (!filePath) return '';
  return filePath.replace(/\\/g, '/').split('/').pop();
};

export const formatCurrency = (val) => {
  if (val === undefined || val === null) return 'N/A';
  if (val >= 100000) {
    return `${(val / 100000).toFixed(1)} Lakhs`;
  }
  return val.toLocaleString();
};

export const formatNoticePeriod = (days) => {
  if (days === undefined || days === null) return 'N/A';
  if (days === 0) return 'Immediate';
  if (days >= 30) {
    const months = Math.round(days / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  }
  return `${days} days`;
};

export default {
  getInitials,
  getAvatarColor,
  getFilenameFromPath,
  formatCurrency,
  formatNoticePeriod
};
