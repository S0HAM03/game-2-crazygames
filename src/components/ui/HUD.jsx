import { useGameStore } from '../../store';
import TutorialGuide from './TutorialGuide';
import EndGameOverlay from './EndGameOverlay';

function formatHHMMSS(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function HUD() {
  const coins = useGameStore(s => s.coins);
  const leavesInBag = useGameStore(s => s.leavesInBag);
  const bagLevel = useGameStore(s => s.bagLevel);
  const getPickingPower = useGameStore(s => s.getPickingPower);
  const getBagCapacity = useGameStore(s => s.getBagCapacity);
  const totalCollected = useGameStore(s => s.totalCollected);
  const bagCapacity = getBagCapacity();
  const pickingPower = getPickingPower();
  const setShopOpen = useGameStore(s => s.setShopOpen);
  const setSettingsOpen = useGameStore(s => s.setSettingsOpen);
  const fill = bagCapacity > 0 ? (leavesInBag / bagCapacity) * 100 : 0;
  const bagFull = leavesInBag >= bagCapacity;
  const energy = useGameStore(s => s.energy);
  const maxEnergy = useGameStore(s => s.maxEnergy);
  const hasVacuum = useGameStore(s => s.hasVacuum);
  const vacuumBattery = useGameStore(s => s.vacuumBattery);
  const maxVacuumBattery = useGameStore(s => s.maxVacuumBattery);
  const isBoosted = useGameStore(s => s.isBoosted);
  const boostTimeLeft = useGameStore(s => s.boostTimeLeft);
  const isGameOver = useGameStore(s => s.isGameOver);
  const timerSeconds = useGameStore(s => s.timerSeconds);
  
  const gamePhase = useGameStore(s => s.gamePhase);
  const subtitleText = useGameStore(s => s.subtitleText);
  const tutorialFlags = useGameStore(s => s.tutorialFlags);

  if (gamePhase === 'start_menu') return null;

  return (
    <>
      {/* End Game Victory / Failure Overlay */}
      <EndGameOverlay />

      {/* Top HUD Bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, transparent 100%)',
        pointerEvents: 'none',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#fff',
        zIndex: 50,
      }}>
        {/* Left: Bag & Energy status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Bag */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '17px', textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
              🎒 <span>{leavesInBag}</span><span style={{ opacity: 0.6 }}>/{bagCapacity}</span>
              {bagFull && <span style={{ color: '#ff5252', fontSize: '13px', background: 'rgba(255,82,82,0.2)', padding: '2px 8px', borderRadius: '8px' }}>FULL</span>}
            </div>
            <div style={{ width: '180px', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${fill}%`,
                background: bagFull ? '#ff5252' : 'linear-gradient(90deg, #66bb6a, #ffe066)',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Energy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px', textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
              ⚡ <span>{Math.round(energy)}</span><span style={{ opacity: 0.6 }}>/{maxEnergy}</span>
              {energy < 10 && <span style={{ color: '#ff5252', fontSize: '11px', animation: 'pulse 1s infinite' }}>LOW ENERGY</span>}
            </div>
            <div style={{ width: '180px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(energy / maxEnergy) * 100}%`,
                background: energy < 15 ? '#ff5252' : 'linear-gradient(90deg, #42a5f5, #29b6f6)',
                borderRadius: '4px',
                transition: 'width 0.2s ease',
              }} />
            </div>
          </div>

          {/* Vacuum Battery */}
          {hasVacuum && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px', textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
                🔋 <span>{Math.ceil(vacuumBattery)}</span><span style={{ opacity: 0.6 }}>s</span>
                {vacuumBattery <= 0 && <span style={{ color: '#ff5252', fontSize: '10px', animation: 'pulse 1s infinite' }}>EMPTY</span>}
              </div>
              <div style={{ width: '150px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(vacuumBattery / maxVacuumBattery) * 100}%`,
                  background: vacuumBattery < 20 ? '#ff5252' : '#e67e22',
                  borderRadius: '2px',
                  transition: 'width 0.2s linear',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Center: Title & 8-Hour Countdown Timer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '2px', textShadow: '0 2px 8px rgba(0,0,0,0.7)', opacity: 0.9 }}>
            🍂 LEAF IT ALONE
          </div>
          
          {/* 8-Hour Timer Badge */}
          <div style={{
            marginTop: '4px',
            background: timerSeconds < 1800 ? 'rgba(239,83,80,0.35)' : 'rgba(205,127,50,0.25)',
            border: `1px solid ${timerSeconds < 1800 ? '#ef5350' : 'rgba(205,127,50,0.5)'}`,
            borderRadius: '20px', padding: '4px 14px',
            fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px',
            color: timerSeconds < 1800 ? '#ff8a80' : '#ffe066',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            <span>⏳</span>
            <span>{formatHHMMSS(timerSeconds)}</span>
            <span style={{ fontSize: '10px', opacity: 0.6, letterSpacing: '1px' }}>REMAINING</span>
          </div>

          {isBoosted && (
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#00ffff', marginTop: '4px', background: 'rgba(0,100,100,0.6)', padding: '3px 14px', borderRadius: '16px', textShadow: '0 0 10px #00ffff', animation: 'pulse 1s infinite' }}>
              ⚡ 2X BOOST ({Math.ceil(boostTimeLeft)}s)
            </div>
          )}
        </div>

        {/* Right: Coins + Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div style={{ fontWeight: 700, fontSize: '18px', textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
            🪙 {coins.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            ✋ Power {pickingPower}x · 🍃 {totalCollected} total
          </div>
        </div>
      </div>


      {/* Shop and Settings buttons container */}
      <div style={{
        position: 'absolute', bottom: 24, right: 24,
        display: 'flex', gap: '12px'
      }}>
        {/* Settings button */}
        <button
          onClick={() => setSettingsOpen(true)}
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50px',
            color: '#fff', fontSize: '18px',
            width: '48px', height: '48px', cursor: 'pointer',
            transition: 'transform 0.15s, background 0.15s',
            pointerEvents: 'auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => { e.target.style.transform = 'scale(1.1)'; e.target.style.background = 'rgba(0,0,0,0.7)'; }}
          onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.background = 'rgba(0,0,0,0.5)'; }}
          title="Settings"
        >
          ⚙️
        </button>

        {/* Shop button */}
        <button
          onClick={() => setShopOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #ff9800, #f44336)',
            border: 'none', borderRadius: '50px',
            color: '#fff', fontWeight: 800, fontSize: '15px',
            padding: '14px 24px', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(244,67,54,0.5)',
            letterSpacing: '1px', textTransform: 'uppercase',
            transition: 'transform 0.15s, box-shadow 0.15s',
            pointerEvents: 'auto',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
          onMouseEnter={e => { e.target.style.transform = 'scale(1.06)'; e.target.style.boxShadow = '0 8px 28px rgba(244,67,54,0.6)'; }}
          onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 4px 20px rgba(244,67,54,0.5)'; }}
        >
          🎒 Inventory & Shop <span style={{ background: 'rgba(0,0,0,0.25)', padding: '2px 8px', borderRadius: '6px', fontSize: '12px' }}>TAB</span>
        </button>
      </div>

      {/* ESC / TAB hint */}
      <div style={{
        position: 'absolute', bottom: 24, left: 24,
        background: 'rgba(0,0,0,0.45)', borderRadius: '8px',
        padding: '8px 14px', color: 'rgba(255,255,255,0.75)',
        fontSize: '12px', pointerEvents: 'none',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div><b>TAB</b> — Open Inventory & Shop</div>
        <div><b>ESC</b> — Release Cursor</div>
      </div>

      {/* ── Modern Step Tutorial ── */}
      <TutorialGuide tutorialFlags={tutorialFlags} />

      {/* ── Voice-Over Subtitle ── */}
      {subtitleText && (
        <div style={{
          position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(8, 6, 5, 0.82)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '30px',
          padding: '11px 28px',
          color: 'rgba(255,255,255,0.95)',
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '0.2px',
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          maxWidth: '600px',
          pointerEvents: 'none',
          zIndex: 110,
          fontFamily: "'Inter', system-ui, sans-serif",
          animation: 'fadeIn 0.2s ease-out',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#cd7f32', flexShrink: 0, boxShadow: '0 0 6px #cd7f32' }} />
          {subtitleText}
        </div>
      )}
    </>
  );
}
