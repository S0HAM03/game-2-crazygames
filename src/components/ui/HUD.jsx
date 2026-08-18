import { useGameStore } from '../../store';

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
  const resetYard = useGameStore(s => s.resetYard);

  return (
    <>      {/* Victory Screen */}
      {isGameOver && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, color: 'white', fontFamily: "'Inter', 'Segoe UI', sans-serif",
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <div style={{
            background: 'rgba(25, 25, 30, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '60px 80px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <h1 style={{ 
              fontSize: '42px', color: '#ffffff', margin: '0 0 16px 0', 
              fontWeight: 800, letterSpacing: '-0.5px' 
            }}>
              Yard Spotless
            </h1>
            <p style={{ 
              fontSize: '18px', color: 'rgba(255,255,255,0.7)', marginBottom: '48px', 
              fontWeight: 400, lineHeight: '1.6' 
            }}>
              You have cleaned your garden! Now your mom will tell you another work to do...
            </p>
            <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
              <button
                onClick={resetYard}
                style={{
                  flex: 1, background: '#ffffff', border: 'none', borderRadius: '12px', padding: '16px 0',
                  color: '#000000', fontWeight: 600, fontSize: '16px', cursor: 'pointer',
                  transition: 'transform 0.2s, background 0.2s', pointerEvents: 'auto'
                }}
                onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.background = '#f0f0f0'; }}
                onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.background = '#ffffff'; }}
              >
                Play Again
              </button>
              <button
                onClick={() => window.close()}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', padding: '16px 0', color: '#fff',
                  fontWeight: 600, fontSize: '16px', cursor: 'pointer', transition: 'background 0.2s',
                  pointerEvents: 'auto'
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top HUD Bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 20px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 100%)',
        pointerEvents: 'none',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: '#fff',
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

        {/* Center: Title & Boost */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: '22px', letterSpacing: '2px', textShadow: '0 2px 8px rgba(0,0,0,0.7)', opacity: 0.9 }}>
            🍂 LEAF IT ALONE
          </div>
          {isBoosted && (
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#00ffff', marginTop: '4px', background: 'rgba(0,100,100,0.6)', padding: '4px 16px', borderRadius: '16px', textShadow: '0 0 10px #00ffff', animation: 'pulse 1s infinite' }}>
              ⚡ 2X BOOST ACTIVE ({Math.ceil(boostTimeLeft)}s)
            </div>
          )}
          {hasVacuum && !isBoosted && (
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#4caf50', marginTop: '4px', background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: '12px' }}>
              Hold RMB to Vacuum
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
    </>
  );
}
