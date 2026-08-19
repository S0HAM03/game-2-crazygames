import { useGameStore, GAME_PHASES } from '../../store';

function formatHHMMSS(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

const DUMMY_LEADERBOARD = [
  { rank: 1, name: 'MasterGardener_99', time: '00:48:12', position: 'Global #1' },
  { rank: 2, name: 'AutumnSweep_Pro',   time: '01:05:44', position: 'Global #2' },
  { rank: 3, name: 'LeafBuster_X',       time: '01:14:20', position: 'Global #3' },
  { rank: 4, name: 'GardenHero_UK',      time: '01:28:10', position: 'Global #4' },
  { rank: 5, name: 'Soham_G',            time: '01:35:50', position: 'Global #5' },
  { rank: 6, name: 'ZenCleaner',         time: '01:41:05', position: 'Global #6' },
];

export default function EndGameOverlay() {
  const isGameOver      = useGameStore(s => s.isGameOver);
  const isVictory       = useGameStore(s => s.isVictory);
  const isTimerExpired  = useGameStore(s => s.isTimerExpired);
  const completionTime  = useGameStore(s => s.completionTime);
  const worldRank       = useGameStore(s => s.worldRank);
  const coins           = useGameStore(s => s.coins);
  const totalCollected  = useGameStore(s => s.totalCollected);
  const resetTimerAndGame = useGameStore(s => s.resetTimerAndGame);

  if (!isGameOver) return null;

  const handleRestart = () => {
    localStorage.removeItem('leaf-collect-save');
    useGameStore.setState({
      hasBag: false, coins: 0, leavesInBag: 0,
      bagLevel: 0, powerLevel: 0, vacuumPowerLevel: 0,
      totalCollected: 0, hasVacuum: false, hasBroom: false, activeTool: 'none',
      collectedLeafIds: [], tutorialFlags: {
        equippedBag: false, sweptLeaves: false, soldLeaves: false, visitedGarage: false,
      },
    });
    resetTimerAndGame();
    useGameStore.setState({ gamePhase: GAME_PHASES.START_MENU });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(5, 8, 6, 0.92)',
      backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#f5ede0', fontFamily: "'Inter', system-ui, sans-serif",
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '640px', width: '100%',
        background: 'linear-gradient(145deg, #18221b, #0f1812)',
        border: `1px solid ${isVictory ? 'rgba(212,169,58,0.5)' : 'rgba(239,83,80,0.5)'}`,
        borderRadius: '24px',
        padding: '36px 40px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        textAlign: 'center',
      }}>
        {/* Header Icon & Title */}
        <div style={{ fontSize: '56px', marginBottom: '8px' }}>
          {isVictory ? '🏆' : '⌛'}
        </div>

        <h1 style={{
          fontFamily: "'Cinzel', Georgia, serif",
          fontSize: '2.2rem', fontWeight: 800,
          color: isVictory ? '#d4a93a' : '#ef5350',
          margin: '0 0 8px 0',
          letterSpacing: '1px',
        }}>
          {isVictory ? 'GARDEN CLEANED!' : 'TIME EXPIRED (8 HOURS)'}
        </h1>

        <p style={{
          fontSize: '15px', color: 'rgba(245,237,224,0.65)',
          margin: '0 0 28px 0', lineHeight: 1.6,
        }}>
          {isVictory
            ? 'You have successfully cleaned every fallen leaf in your garden! Check your speedrun rank and global position below.'
            : 'The 8-hour time limit ended before the garden was completely cleaned. The run has ended.'}
        </p>

        {/* Victory Stats Grid */}
        {isVictory && (
          <>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
              marginBottom: '28px',
            }}>
              <div style={{
                background: 'rgba(212,169,58,0.12)', border: '1px solid rgba(212,169,58,0.3)',
                borderRadius: '14px', padding: '14px',
              }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(245,237,224,0.5)', marginBottom: '4px' }}>
                  ⏱️ Time Taken
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f5ede0' }}>
                  {formatHHMMSS(completionTime)}
                </div>
              </div>

              <div style={{
                background: 'rgba(212,169,58,0.18)', border: '1px solid rgba(212,169,58,0.5)',
                borderRadius: '14px', padding: '14px',
              }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#d4a93a', marginBottom: '4px' }}>
                  🌍 Worldwide Rank
                </div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffe066' }}>
                  #{worldRank || 14}
                </div>
              </div>

              <div style={{
                background: 'rgba(212,169,58,0.12)', border: '1px solid rgba(212,169,58,0.3)',
                borderRadius: '14px', padding: '14px',
              }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(245,237,224,0.5)', marginBottom: '4px' }}>
                  🍂 Leaves Sold
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#78c270' }}>
                  4,400
                </div>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div style={{
              background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px', padding: '16px 20px', marginBottom: '28px',
              textAlign: 'left',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#d4a93a', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span>🌐 Worldwide Speedrun Leaderboard</span>
                <span>Top Cleaners</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                {DUMMY_LEADERBOARD.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                    borderRadius: '8px', background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(245,237,224,0.85)',
                  }}>
                    <span><b>#{item.rank}</b> {item.name}</span>
                    <span style={{ color: '#d4a93a', fontWeight: 700 }}>{item.time}</span>
                  </div>
                ))}

                {/* Player's Row Highlighted */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', padding: '10px 14px',
                  borderRadius: '8px', background: 'rgba(212,169,58,0.25)',
                  border: '1px solid #d4a93a', color: '#ffe066', fontWeight: 800,
                  marginTop: '4px',
                }}>
                  <span>⭐ #{worldRank || 14} You (Current Run)</span>
                  <span>{formatHHMMSS(completionTime)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Restart Button */}
        <button
          onClick={handleRestart}
          style={{
            width: '100%', padding: '16px',
            background: isVictory ? 'linear-gradient(135deg, #d4a93a, #b78728)' : 'linear-gradient(135deg, #ef5350, #c62828)',
            border: 'none', borderRadius: '12px',
            color: '#fff', fontSize: '16px', fontWeight: 800,
            letterSpacing: '1px', textTransform: 'uppercase',
            cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          🔄 Start New Run / Main Menu
        </button>
      </div>
    </div>
  );
}
