import React from 'react';

const EVENT_ICONS = {
  Created: '🆕',
  Updated: '📝',
  Assigned: '👤',
  'Interview Scheduled': '📅',
  'Interview Completed': '✅',
  'Offer Sent': '✉️',
  Rejected: '❌',
  Hired: '🎉'
};

export const TimelineWidget = ({ timeline = [] }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
        No timeline activity logs recorded for this candidate.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--border)', marginTop: '0.5rem' }}>
      {timeline.map((item, index) => {
        const icon = EVENT_ICONS[item.event] || '🔹';
        const dateStr = new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        
        return (
          <div key={item.id || index} style={{ position: 'relative', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            {/* Timeline Dot Indicator */}
            <div style={{
              position: 'absolute',
              left: '-17px',
              top: '2px',
              background: 'var(--bg-surface)',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              border: '2px solid var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }} />

            <div style={{ fontSize: '1.2rem', lineHeight: 1 }}>{icon}</div>
            
            <div style={{ flexGrow: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {item.event}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {dateStr}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem', marginBottom: 0 }}>
                {item.details}
              </p>
              {item.performed_by_username && (
                <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: '600', display: 'block', marginTop: '0.1rem' }}>
                  by @{item.performed_by_username}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineWidget;
