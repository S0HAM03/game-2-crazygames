import { useGameStore } from '../../store';

export default function Notifications() {
  const notifications = useGameStore(s => s.notifications);

  return (
    <div style={{
      position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
      pointerEvents: 'none', zIndex: 200,
    }}>
      {notifications.map((n) => (
        <div
          key={n.id}
          style={{
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '18px',
            fontWeight: 700,
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            animation: 'floatUp 2s forwards',
            whiteSpace: 'nowrap',
          }}
        >
          {n.text}
        </div>
      ))}
    </div>
  );
}
