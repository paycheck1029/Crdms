export const STATUS_STYLE_MAP = {
  Applied: { bg: 'rgba(96, 165, 250, 0.05)', border: '1px solid rgba(96, 165, 250, 0.2)', color: '#60a5fa' },
  Screening: { bg: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)', color: '#fbbf24' },
  Interview: { bg: 'rgba(192, 132, 252, 0.05)', border: '1px solid rgba(192, 132, 252, 0.2)', color: '#c084fc' },
  Interviewing: { bg: 'rgba(192, 132, 252, 0.05)', border: '1px solid rgba(192, 132, 252, 0.2)', color: '#c084fc' },
  Offered: { bg: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', color: 'var(--success)' },
  Hired: { bg: 'var(--accent-dim)', border: '1px solid var(--accent-border-soft)', color: 'var(--status-hired)' },
  Rejected: { bg: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.2)', color: '#f87171' },
  Selected: { bg: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981' },
  Joining: { bg: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', color: '#06b6d4' },
  Pending: { bg: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#f59e0b' }
};

export const FUNNEL_ORDER = ['Applied', 'Screening', 'Interviewing', 'Offered', 'Hired', 'Rejected', 'Selected', 'Joining', 'Pending'];

export default {
  STATUS_STYLE_MAP,
  FUNNEL_ORDER
};
