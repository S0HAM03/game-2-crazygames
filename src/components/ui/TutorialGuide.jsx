import { useState, useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────
   Tutorial step definitions
   Each step activates in order.
   flag: the tutorialFlag key that marks it done.
   ───────────────────────────────────────────── */
const STEPS = [
  {
    flag: 'equippedBag',
    icon: '🎒',
    title: 'Grab Your Bag',
    desc: 'Walk to the glowing bag under the red maple tree and click it to equip.',
    controls: [
      { key: 'W A S D', label: 'Move around' },
      { key: 'LMB', label: 'Click to interact' },
    ],
    color: '#d4863a',
  },
  {
    flag: 'sweptLeaves',
    icon: '🍂',
    title: 'Collect Leaves',
    desc: 'Click individual leaves to pick them up by hand. Your bag fills up as you collect.',
    controls: [
      { key: 'LMB', label: 'Pick up a leaf' },
      { key: 'Hold LMB', label: 'Sweep with broom' },
    ],
    color: '#e08040',
  },
  {
    flag: 'visitedGarage',
    icon: '🔧',
    title: 'Visit the Garage',
    desc: 'Head to the Garage Workshop to buy tools — upgrade your bag, broom, or vacuum.',
    controls: [
      { key: 'TAB', label: 'Open Inventory & Shop' },
    ],
    color: '#6fa8dc',
  },
  {
    flag: 'soldLeaves',
    icon: '🪙',
    title: 'Sell Your Leaves',
    desc: 'Walk to the Compost Bin near the front gate. Click it to sell everything in your bag for coins.',
    controls: [
      { key: 'LMB', label: 'Click the Compost Bin' },
    ],
    color: '#78c270',
  },
];

/* ─────────────────────────────────────────────
   CSS injected once
   ───────────────────────────────────────────── */
const CSS = `
  @keyframes tg-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes tg-complete {
    0%  { transform: scale(1); }
    50% { transform: scale(1.04); }
    100%{ transform: scale(1); }
  }
  @keyframes tg-pulse-dot {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }
  .tg-root {
    position: absolute;
    bottom: 88px;
    right: 20px;
    width: 300px;
    font-family: 'Inter', system-ui, sans-serif;
    pointer-events: none;
    z-index: 100;
    animation: tg-in 0.3s ease-out;
  }
  .tg-card {
    background: rgba(10, 8, 6, 0.80);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 12px 40px rgba(0,0,0,0.55);
  }
  .tg-accent-bar {
    height: 3px;
    transition: background 0.4s;
  }
  .tg-body {
    padding: 16px 18px 14px;
  }
  .tg-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  .tg-icon-wrap {
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }
  .tg-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .tg-title {
    font-size: 15px;
    font-weight: 700;
    color: #f5ede0;
    line-height: 1.2;
  }
  .tg-desc {
    font-size: 12.5px;
    color: rgba(245, 237, 224, 0.62);
    line-height: 1.6;
    margin-bottom: 12px;
  }
  .tg-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 14px;
  }
  .tg-control {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: rgba(245,237,224,0.55);
  }
  .tg-key {
    background: rgba(255,255,255,0.09);
    border: 1px solid rgba(255,255,255,0.15);
    border-bottom: 2px solid rgba(255,255,255,0.22);
    border-radius: 5px;
    padding: 2px 7px;
    font-size: 10px;
    font-weight: 700;
    color: rgba(255,255,255,0.85);
    letter-spacing: 0.4px;
    white-space: nowrap;
  }
  .tg-progress-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .tg-steps-dots {
    display: flex;
    gap: 5px;
    flex: 1;
  }
  .tg-dot {
    height: 4px;
    border-radius: 2px;
    flex: 1;
    transition: background 0.3s, transform 0.3s;
  }
  .tg-step-count {
    font-size: 10px;
    font-weight: 700;
    color: rgba(245,237,224,0.35);
    white-space: nowrap;
    letter-spacing: 0.5px;
  }
  .tg-completed {
    padding: 16px 18px;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: tg-complete 0.4s ease;
  }
  .tg-live-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    animation: tg-pulse-dot 1.8s infinite;
  }
`;

export default function TutorialGuide({ tutorialFlags }) {
  const [dismissed, setDismissed] = useState(false);
  const [prevStep, setPrevStep] = useState(0);
  const [completing, setCompleting] = useState(false);
  const stylesRef = useRef(false);

  // Inject CSS once
  useEffect(() => {
    if (stylesRef.current) return;
    stylesRef.current = true;
    const el = document.createElement('style');
    el.id = 'tg-styles';
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);

  // Find the current active step (first incomplete flag)
  const completedCount = STEPS.filter(s => tutorialFlags[s.flag]).length;
  const allDone = completedCount === STEPS.length;

  const currentStepIndex = STEPS.findIndex(s => !tutorialFlags[s.flag]);
  const step = currentStepIndex >= 0 ? STEPS[currentStepIndex] : null;

  // Animate step completion
  useEffect(() => {
    if (completedCount > prevStep) {
      setCompleting(true);
      const t = setTimeout(() => setCompleting(false), 600);
      setPrevStep(completedCount);
      return () => clearTimeout(t);
    }
    setPrevStep(completedCount);
  }, [completedCount]);

  // Auto-dismiss after all done
  useEffect(() => {
    if (allDone) {
      const t = setTimeout(() => setDismissed(true), 4000);
      return () => clearTimeout(t);
    }
  }, [allDone]);

  if (dismissed) return null;

  const accentColor = allDone ? '#78c270' : (step?.color ?? '#d4863a');

  return (
    <div className="tg-root">
      <div className="tg-card">
        <div className="tg-accent-bar" style={{ background: accentColor }} />

        {allDone ? (
          <div className="tg-completed">
            <div style={{ fontSize: 28, lineHeight: 1 }}>🌟</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f5ede0', marginBottom: 2 }}>
                All Tasks Complete!
              </div>
              <div style={{ fontSize: 12, color: 'rgba(245,237,224,0.5)' }}>
                You know the basics. Go clean that yard!
              </div>
            </div>
          </div>
        ) : (
          <div className="tg-body">
            {/* Header */}
            <div className="tg-header">
              <div
                className="tg-icon-wrap"
                style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}44` }}
              >
                {step.icon}
              </div>
              <div>
                <div className="tg-label" style={{ color: accentColor }}>
                  <span className="tg-live-dot" style={{ display: 'inline-block', background: accentColor, marginRight: 5 }} />
                  OBJECTIVE
                </div>
                <div className="tg-title">{step.title}</div>
              </div>
            </div>

            {/* Description */}
            <div className="tg-desc">{step.desc}</div>

            {/* Controls */}
            {step.controls.length > 0 && (
              <div className="tg-controls">
                {step.controls.map((c, i) => (
                  <div key={i} className="tg-control">
                    <span className="tg-key">{c.key}</span>
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Progress */}
            <div className="tg-progress-row">
              <div className="tg-steps-dots">
                {STEPS.map((s, i) => (
                  <div
                    key={i}
                    className="tg-dot"
                    style={{
                      background: tutorialFlags[s.flag]
                        ? accentColor
                        : i === currentStepIndex
                          ? `${accentColor}66`
                          : 'rgba(255,255,255,0.08)',
                      transform: i === currentStepIndex ? 'scaleY(1.5)' : 'scaleY(1)',
                    }}
                  />
                ))}
              </div>
              <div className="tg-step-count">{completedCount}/{STEPS.length}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
