import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useEffect } from 'react';
import * as THREE from 'three';

import Environment from './components/scene/Environment';
import House from './components/scene/House';
import Trees from './components/scene/Trees';
import Leaves from './components/scene/Leaves';
import CompostBin from './components/scene/CompostBin';
import BagPickup, { handleBagClick } from './components/scene/BagPickup';
import FPPlayer from './components/scene/Player';
import HUD from './components/ui/HUD';
import ShopPanel from './components/ui/ShopPanel';
import SettingsPanel from './components/ui/SettingsPanel';
import Notifications from './components/ui/Notifications';
import StartScreen from './components/ui/StartScreen';
import { startBackgroundMusic } from './audio/SoundSystem';
import { useGameStore, GAME_PHASES } from './store';
import './index.css';

/* ─────────────────────────────────────────────
   Loading screen shown while Canvas suspends
   ───────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #0e0c0b, #1a1208)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#f5ede0', fontFamily: "'Inter', system-ui, sans-serif", zIndex: 999,
    }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>🍂</div>
      <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '3px', marginBottom: '8px' }}>
        LEAF IT ALONE
      </div>
      <div style={{ color: 'rgba(245,237,224,0.45)', fontSize: '14px' }}>
        Building the garden…
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Crosshair (only in game)
   ───────────────────────────────────────────── */
function Crosshair() {
  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '20px', height: '20px', pointerEvents: 'none', zIndex: 10,
    }}>
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', marginTop: '-1px', background: 'rgba(255,255,255,0.9)' }} />
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', marginLeft: '-1px', background: 'rgba(255,255,255,0.9)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: '4px', height: '4px', marginTop: '-2px', marginLeft: '-2px', background: 'rgba(255,255,255,0.5)', borderRadius: '50%' }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   "Click anywhere to lock mouse" overlay
   ───────────────────────────────────────────── */
function ClickToPlay() {
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const onChange = () => setLocked(!!document.pointerLockElement);
    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, []);
  if (locked) return null;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.68)', zIndex: 50, pointerEvents: 'none',
      fontFamily: "'Inter', system-ui, sans-serif", color: '#fff',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '10px' }}>🍂</div>
      <div style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '3px', marginBottom: '6px' }}>
        LEAF IT ALONE
      </div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '28px' }}>
        A peaceful autumn garden
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)',
        borderRadius: '16px', padding: '22px 38px', textAlign: 'center', maxWidth: '420px',
      }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
          🖱️ Click anywhere to start
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 2.1 }}>
          <div><b>W A S D</b> — Move around the garden</div>
          <div><b>Mouse</b> — Look around (FPS)</div>
          <div><b>Left Click</b> — Interact / Collect leaf</div>
          <div><b>TAB</b> — Open inventory &amp; shop</div>
          <div><b>ESC</b> — Pause / Release cursor</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Tip: find the bag
   ───────────────────────────────────────────── */
function OnboardingTip() {
  const gamePhase = useGameStore(s => s.gamePhase);
  if (gamePhase !== GAME_PHASES.PICKUP_BAG) return null;
  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, calc(-50% + 130px))',
      background: 'rgba(205, 127, 50, 0.92)',
      color: '#1a0d00', fontWeight: 800, fontSize: '16px',
      padding: '12px 28px', borderRadius: '30px',
      boxShadow: '0 4px 24px rgba(205,127,50,0.4)',
      pointerEvents: 'none', zIndex: 20,
      fontFamily: "'Inter', system-ui, sans-serif",
      textAlign: 'center', animation: 'pulse 1.8s infinite',
    }}>
      🎒 Walk to the glowing bag and click it to start!
    </div>
  );
}

/* ─────────────────────────────────────────────
   3D Scene contents
   ───────────────────────────────────────────── */
function Scene() {
  const pickupBag = useGameStore(s => s.pickupBag);
  const addNotification = useGameStore(s => s.addNotification);

  useEffect(() => {
    window.__pickupBag = () => handleBagClick(pickupBag, addNotification);
    return () => { delete window.__pickupBag; };
  }, [pickupBag, addNotification]);

  return (
    <>
      <Environment />
      <House />
      <Trees />
      <Leaves />
      <CompostBin />
      <BagPickup />
      <FPPlayer />
    </>
  );
}

/* ─────────────────────────────────────────────
   GameView — Canvas + all HUD overlays
   Mounts ONLY when phase !== start_menu
   ───────────────────────────────────────────── */
function GameView() {
  // Start relaxing background music as soon as the game boots
  useEffect(() => {
    // Small delay to let AudioContext initialise after user gesture
    const t = setTimeout(() => startBackgroundMusic(), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#87ceeb' }}>
      <Suspense fallback={<LoadingScreen />}>
        <Canvas
          shadows
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
          camera={{ fov: 75, near: 0.1, far: 400, position: [0, 1.72, -2.5] }}
        >
          <Scene />
        </Canvas>
      </Suspense>

      <ClickToPlay />
      <Crosshair />
      <OnboardingTip />
      <HUD />
      <ShopPanel />
      <SettingsPanel />
      <Notifications />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Root App — pure conditional router
   StartScreen and GameView never coexist
   ───────────────────────────────────────────── */
export default function App() {
  const gamePhase = useGameStore(s => s.gamePhase);
  const isStartMenu = gamePhase === GAME_PHASES.START_MENU;

  return (
    <>
      {isStartMenu  && <StartScreen />}
      {!isStartMenu && <GameView />}
    </>
  );
}
