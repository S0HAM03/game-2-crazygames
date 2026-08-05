import { useGameStore } from '../../store';

export default function SettingsPanel() {
  const isSettingsOpen = useGameStore(s => s.isSettingsOpen);
  const setSettingsOpen = useGameStore(s => s.setSettingsOpen);
  
  const musicVolume = useGameStore(s => s.musicVolume);
  const sfxVolume = useGameStore(s => s.sfxVolume);
  const mouseSensitivity = useGameStore(s => s.mouseSensitivity);

  const setMusicVolume = useGameStore(s => s.setMusicVolume);
  const setSfxVolume = useGameStore(s => s.setSfxVolume);
  const setMouseSensitivity = useGameStore(s => s.setMouseSensitivity);

  if (!isSettingsOpen) return null;

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        zIndex: 200, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
      onClick={() => setSettingsOpen(false)}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #1f2130, #13141f)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '28px 32px',
          width: '360px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          color: '#fff',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 800 }}>⚙️ Settings</h2>

        {/* Music Volume */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600 }}>Music Volume</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{Math.round(musicVolume * 100)}%</span>
          </div>
          <input 
            type="range" min="0" max="0.5" step="0.01"
            value={musicVolume}
            onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#4caf50' }}
          />
        </div>

        {/* SFX Volume */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600 }}>SFX Volume</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{Math.round(sfxVolume * 100)}%</span>
          </div>
          <input 
            type="range" min="0" max="1" step="0.01"
            value={sfxVolume}
            onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#2196f3' }}
          />
        </div>

        {/* Mouse Sensitivity */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600 }}>Mouse Sensitivity</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{Math.round((mouseSensitivity / 0.0022) * 100)}%</span>
          </div>
          <input 
            type="range" min="0.0005" max="0.005" step="0.0001"
            value={mouseSensitivity}
            onChange={(e) => setMouseSensitivity(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#ff9800' }}
          />
        </div>

        <button
          onClick={() => setSettingsOpen(false)}
          style={{
            width: '100%', padding: '12px',
            background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
            border: 'none', borderRadius: '10px',
            color: '#fff', fontWeight: 800, fontSize: '15px',
            cursor: 'pointer',
            transition: 'transform 0.1s',
          }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.02)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        >
          Save & Close
        </button>
      </div>
    </div>
  );
}
