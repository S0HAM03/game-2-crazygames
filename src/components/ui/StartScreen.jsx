import { useState, useEffect } from 'react';
import { useGameStore, GAME_PHASES } from '../../store';

/* ─────────────────────────────────────────────
   Mystic Grove UI Styles (as requested)
   ───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap');

  :root {
    --bg-deep: #0f1b14;
    --bg-mid: #17281d;
    --moss: #3f6a4f;
    --moss-soft: #4c7a5e;
    --gold: #d4a93a;
    --gold-soft: #e8c877;
    --parchment: #e8dfc7;
    --twilight: #5b4b8a;
    --ink: #0a120c;
  }

  .mg-root {
    position: fixed; inset: 0; z-index: 9999;
    font-family: 'EB Garamond', serif;
    color: var(--parchment);
    overflow: hidden;
    background: radial-gradient(ellipse at 50% 0%, #1c3324 0%, var(--bg-deep) 55%, #060b07 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }

  /* soft moonlight glow */
  .mg-moon-glow {
    position: absolute; top: -10%; left: 50%; transform: translateX(-50%);
    width: 60vw; height: 60vw; max-width: 800px; max-height: 800px;
    background: radial-gradient(circle, rgba(212,169,58,0.14) 0%, rgba(212,169,58,0) 65%);
    filter: blur(2px);
    pointer-events: none;
  }

  /* layered tree silhouettes for depth */
  .mg-layer { position: absolute; left: 0; right: 0; bottom: 0; pointer-events: none; }
  .mg-layer svg { width: 100%; height: auto; display: block; }
  .mg-layer-back { opacity: 0.55; animation: mg-sway 18s ease-in-out infinite; }
  .mg-layer-mid { opacity: 0.8; animation: mg-sway 12s ease-in-out infinite reverse; }
  .mg-layer-front { opacity: 1; animation: mg-sway 9s ease-in-out infinite; }
  @keyframes mg-sway {
    0%,100% { transform: translateX(0px); }
    50%     { transform: translateX(6px); }
  }

  /* fireflies */
  .mg-firefly {
    position: absolute;
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--gold-soft);
    box-shadow: 0 0 6px 2px rgba(232,200,119,0.9), 0 0 14px 6px rgba(212,169,58,0.35);
    animation-name: mg-drift, mg-glow;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    opacity: 0;
    pointer-events: none;
  }
  @keyframes mg-drift {
    0%   { transform: translate(0,0); }
    25%  { transform: translate(18px,-24px); }
    50%  { transform: translate(-10px,-46px); }
    75%  { transform: translate(-24px,-18px); }
    100% { transform: translate(0,0); }
  }
  @keyframes mg-glow {
    0%,100% { opacity: 0; }
    30%     { opacity: 0.9; }
    60%     { opacity: 0.4; }
    80%     { opacity: 0.95; }
  }

  /* content stage */
  .mg-stage {
    position: relative; z-index: 5;
    height: 100%; width: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 6vh 5vw;
  }

  .mg-crest {
    width: 64px; height: 64px; margin-bottom: 18px;
    opacity: 0.9;
  }

  h1.mg-title {
    font-family: 'Cinzel', serif;
    font-weight: 700;
    font-size: clamp(2.4rem, 5.5vw, 4.2rem);
    letter-spacing: 0.06em;
    color: var(--gold);
    text-shadow: 0 0 24px rgba(212,169,58,0.35), 0 2px 0 rgba(0,0,0,0.4);
    margin: 0;
    text-align: center;
  }
  p.mg-subtitle {
    font-family: 'EB Garamond', serif;
    font-style: italic;
    font-size: clamp(0.95rem, 1.6vw, 1.15rem);
    color: var(--moss-soft);
    letter-spacing: 0.08em;
    margin: 6px 0 2.4rem 0;
  }

  nav.mg-menu {
    display: flex; flex-direction: column; gap: 14px;
    width: min(380px, 85vw);
  }

  .mg-menu-btn {
    position: relative;
    font-family: 'Cinzel', serif;
    font-weight: 500;
    font-size: 1rem;
    letter-spacing: 0.14em;
    text-decoration: none;
    text-transform: uppercase;
    color: var(--parchment);
    text-align: center;
    padding: 14px 22px;
    border: 1px solid rgba(212,169,58,0.35);
    border-radius: 3px;
    background: linear-gradient(180deg, rgba(76,122,94,0.14), rgba(15,27,20,0.5));
    backdrop-filter: blur(2px);
    cursor: pointer;
    transition: border-color 0.35s ease, color 0.35s ease, background 0.35s ease, letter-spacing 0.35s ease;
  }
  .mg-menu-btn::before, .mg-menu-btn::after {
    content: "";
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--gold);
    opacity: 0; transition: opacity 0.35s ease, transform 0.35s ease;
  }
  .mg-menu-btn::before { left: 10px; }
  .mg-menu-btn::after { right: 10px; }
  .mg-menu-btn:hover, .mg-menu-btn:focus-visible {
    color: var(--gold-soft);
    border-color: var(--gold);
    letter-spacing: 0.22em;
    background: linear-gradient(180deg, rgba(76,122,94,0.28), rgba(15,27,20,0.65));
    outline: none;
  }
  .mg-menu-btn:hover::before, .mg-menu-btn:hover::after,
  .mg-menu-btn:focus-visible::before, .mg-menu-btn:focus-visible::after {
    opacity: 1;
  }
  .mg-menu-btn.primary {
    border-color: var(--gold);
    background: linear-gradient(180deg, rgba(212,169,58,0.18), rgba(15,27,20,0.55));
    font-size: 1.08rem;
  }

  /* Modal Overlay for Settings & About */
  .mg-modal {
    position: absolute; inset: 0; z-index: 20;
    background: rgba(8, 14, 10, 0.92);
    backdrop-filter: blur(10px);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 30px;
    animation: mg-fadein 0.3s ease;
  }
  @keyframes mg-fadein { from { opacity: 0; } to { opacity: 1; } }

  .mg-modal-card {
    max-width: 520px; width: 100%;
    border: 1px solid var(--gold);
    border-radius: 6px;
    background: linear-gradient(180deg, rgba(23,40,29,0.9), rgba(15,27,20,0.95));
    padding: 28px 36px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.6);
  }

  .mg-modal-title {
    font-family: 'Cinzel', serif;
    font-size: 1.8rem; color: var(--gold);
    margin: 0 0 16px 0; text-align: center;
  }

  footer.mg-credit {
    position: absolute; bottom: 18px; width: 100%; text-align: center;
    font-size: 0.72rem; letter-spacing: 0.12em; color: rgba(232,223,199,0.35);
    font-family: 'EB Garamond', serif;
  }

  @media (prefers-reduced-motion: reduce){
    .mg-layer, .mg-firefly { animation: none !important; }
  }
`;

export default function StartScreen() {
  const gamePhase = useGameStore(s => s.gamePhase);

  const hasBag          = useGameStore(s => s.hasBag);
  const coins           = useGameStore(s => s.coins);
  const totalCollected  = useGameStore(s => s.totalCollected);
  const hasBroom        = useGameStore(s => s.hasBroom);
  const hasVacuum       = useGameStore(s => s.hasVacuum);

  const musicVolume     = useGameStore(s => s.musicVolume);
  const sfxVolume       = useGameStore(s => s.sfxVolume);
  const mouseSensitivity = useGameStore(s => s.mouseSensitivity);
  const setMusicVolume  = useGameStore(s => s.setMusicVolume);
  const setSfxVolume    = useGameStore(s => s.setSfxVolume);
  const setMouseSensitivity = useGameStore(s => s.setMouseSensitivity);

  const [activeModal, setActiveModal] = useState(null); // 'settings' | 'about' | null

  const hasSave = hasBag || coins > 0 || hasBroom || hasVacuum || totalCollected > 0;

  // Inject CSS once
  useEffect(() => {
    if (document.getElementById('mg-styles')) return;
    const el = document.createElement('style');
    el.id = 'mg-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
  }, []);

  if (gamePhase !== GAME_PHASES.START_MENU) return null;

  /* ── Handlers ── */
  const goToGame = (fresh = false) => {
    if (fresh) {
      localStorage.removeItem('leaf-collect-save');
      useGameStore.setState({
        hasBag: false, coins: 0, leavesInBag: 0,
        bagLevel: 0, powerLevel: 0, vacuumPowerLevel: 0,
        totalCollected: 0, hasVacuum: false, hasBroom: false, activeTool: 'none',
        collectedLeafIds: [], tutorialFlags: {
          equippedBag: false, sweptLeaves: false, soldLeaves: false, visitedGarage: false,
        },
      });
      useGameStore.setState({ gamePhase: GAME_PHASES.PICKUP_BAG });
    } else if (hasBag) {
      useGameStore.setState({ gamePhase: GAME_PHASES.PLAYING });
      setTimeout(() => {
        const state = useGameStore.getState();
        state.triggerVoiceOver(
          "Welcome back. Looks like there's still plenty of leaves out here.",
          "Welcome back. Looks like there's still plenty of leaves out here."
        );
      }, 500);
    } else {
      useGameStore.setState({ gamePhase: GAME_PHASES.PICKUP_BAG });
    }
  };

  const handlePlay = () => goToGame(false);
  const handleStart = () => goToGame(false);
  const handleNewGame = () => {
    if (window.confirm('⚠️ Start a New Game? This will reset all your coins, tools, and save progress.')) {
      goToGame(true);
    }
  };

  // Fireflies generation
  const fireflies = Array.from({ length: 22 }, (_, i) => {
    const left = Math.random() * 100;
    const bottom = 5 + Math.random() * 55;
    const durDrift = 6 + Math.random() * 6;
    const durGlow = 3 + Math.random() * 3;
    const delay = Math.random() * 8;

    return (
      <div
        key={i}
        className="mg-firefly"
        style={{
          left: `${left}vw`,
          bottom: `${bottom}vh`,
          animationDuration: `${durDrift}s, ${durGlow}s`,
          animationDelay: `${delay}s, ${delay}s`,
        }}
      />
    );
  });

  return (
    <div className="mg-root">
      <div className="mg-moon-glow" />

      {/* Layer 1 - Back Trees */}
      <div className="mg-layer mg-layer-back">
        <svg viewBox="0 0 1200 260" preserveAspectRatio="none">
          <path fill="#12211a" d="M0 260V140c40-30 90 10 130-10s70-50 120-40 60 40 110 20 90-60 140-40 70 50 120 30 100-50 150-30 90 45 140 25 90-40 130-15 100 40 140 15v285H0z"/>
        </svg>
      </div>

      {/* Layer 2 - Mid Trees */}
      <div className="mg-layer mg-layer-mid">
        <svg viewBox="0 0 1200 220" preserveAspectRatio="none">
          <path fill="#0e1c14" d="M0 220V110c50-35 100 15 150-5s80-45 130-30 70 35 120 15 100-55 150-35 80 45 130 25 100-45 150-20 90 40 130 15 100 35 140 10v210H0z"/>
        </svg>
      </div>

      {/* Layer 3 - Front Trees */}
      <div className="mg-layer mg-layer-front">
        <svg viewBox="0 0 1200 180" preserveAspectRatio="none">
          <path fill="#08120c" d="M0 180V90c60-40 110 20 160-5s90-50 140-25 80 35 130 10 110-50 160-25 90 40 140 15 100-40 150-15 90 30 130 5v205H0z"/>
        </svg>
      </div>

      {/* Fireflies */}
      <div>{fireflies}</div>

      {/* Main Stage */}
      <div className="mg-stage">
        <svg className="mg-crest" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" stroke="#d4a93a" strokeWidth="1.4" opacity="0.7"/>
          <path d="M32 12 L38 26 L52 28 L41 38 L44 52 L32 44 L20 52 L23 38 L12 28 L26 26 Z" stroke="#d4a93a" strokeWidth="1.3" fill="none" opacity="0.85"/>
        </svg>

        <h1 className="mg-title">Leaf It Alone</h1>
        <p className="mg-subtitle">a whisper in the autumn woods</p>

        <nav className="mg-menu">
          <button className="mg-menu-btn primary" onClick={handlePlay}>Play</button>
          <button className="mg-menu-btn" onClick={handleStart}>Start</button>
          <button className="mg-menu-btn" onClick={handleNewGame}>New Game</button>
          <button className="mg-menu-btn" onClick={() => setActiveModal('settings')}>Settings</button>
          <button className="mg-menu-btn" onClick={() => setActiveModal('about')}>About</button>
        </nav>
      </div>

      {/* Settings Modal */}
      {activeModal === 'settings' && (
        <div className="mg-modal">
          <div className="mg-modal-card">
            <h2 className="mg-modal-title">Settings</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.95rem' }}>
                  <span>🎵 Music Volume</span>
                  <span style={{ color: 'var(--gold)' }}>{Math.round(musicVolume * 100)}%</span>
                </label>
                <input
                  type="range" min="0" max="0.5" step="0.01"
                  value={musicVolume}
                  onChange={e => setMusicVolume(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--gold)' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.95rem' }}>
                  <span>🔊 Sound Effects</span>
                  <span style={{ color: 'var(--gold)' }}>{Math.round(sfxVolume * 100)}%</span>
                </label>
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={sfxVolume}
                  onChange={e => setSfxVolume(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--gold)' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.95rem' }}>
                  <span>🖱️ Mouse Sensitivity</span>
                  <span style={{ color: 'var(--gold)' }}>{Math.round((mouseSensitivity / 0.0022) * 100)}%</span>
                </label>
                <input
                  type="range" min="0.0005" max="0.005" step="0.0001"
                  value={mouseSensitivity}
                  onChange={e => setMouseSensitivity(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--gold)' }}
                />
              </div>

              <button
                className="mg-menu-btn"
                style={{ marginTop: 12 }}
                onClick={() => setActiveModal(null)}
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {activeModal === 'about' && (
        <div className="mg-modal">
          <div className="mg-modal-card">
            <h2 className="mg-modal-title">About Leaf It Alone</h2>
            <div style={{ fontSize: '1rem', lineHeight: 1.7, color: 'rgba(232,223,199,0.85)', marginBottom: 20 }}>
              <p style={{ margin: '0 0 12px 0' }}>
                <strong style={{ color: 'var(--gold)' }}>Leaf It Alone</strong> is a peaceful first-person garden simulator. Sweep, collect, and sell leaves at your own pace.
              </p>
              <p style={{ margin: '0 0 12px 0' }}>
                Upgrade your bag, broom, and vacuum cleaner. Enjoy the relaxing acoustic soundtrack and crisp autumn breeze.
              </p>
            </div>
            <button
              className="mg-menu-btn"
              onClick={() => setActiveModal(null)}
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}

      <footer className="mg-credit">MISTWOOD STUDIOS &nbsp;·&nbsp; v1.0</footer>
    </div>
  );
}
