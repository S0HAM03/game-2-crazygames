import { useGameStore } from '../../store';

export default function ShopPanel() {
  const isShopOpen = useGameStore(s => s.isShopOpen);
  const setShopOpen = useGameStore(s => s.setShopOpen);
  const coins = useGameStore(s => s.coins);
  const leavesInBag = useGameStore(s => s.leavesInBag);
  const bagLevel = useGameStore(s => s.bagLevel);
  const powerLevel = useGameStore(s => s.powerLevel);
  const upgradeBag = useGameStore(s => s.upgradeBag);
  const upgradePower = useGameStore(s => s.upgradePower);
  const vacuumPowerLevel = useGameStore(s => s.vacuumPowerLevel);
  const upgradeVacuumPower = useGameStore(s => s.upgradeVacuumPower);
  const hasVacuum = useGameStore(s => s.hasVacuum);
  const rewardCoins = useGameStore(s => s.rewardCoins);
  const addNotification = useGameStore(s => s.addNotification);

  const BAG_TIERS = [
    { capacity: 20, cost: 0 },
    { capacity: 50, cost: 80 },
    { capacity: 100, cost: 200 },
    { capacity: 150, cost: 450 },
    { capacity: 200, cost: 800 },
    { capacity: 250, cost: 1500 },
    { capacity: 300, cost: 3000 },
  ];
  const POWER_TIERS = [
    { power: 1, cost: 0 },
    { power: 2, cost: 100 },
    { power: 3, cost: 250 },
    { power: 4, cost: 500 },
    { power: 5, cost: 900 },
    { power: 7, cost: 1500 },
    { power: 10, cost: 3000 },
  ];
  const VACUUM_TIERS = [
    { power: 15, cost: 0 },
    { power: 25, cost: 1000 },
    { power: 35, cost: 2500 },
    { power: 45, cost: 5000 },
    { power: 55, cost: 10000 },
  ];

  const bagCapacity = BAG_TIERS[bagLevel].capacity;
  const nextBag = BAG_TIERS[bagLevel + 1];
  const nextPower = POWER_TIERS[powerLevel + 1];
  const nextVacuumPower = VACUUM_TIERS[vacuumPowerLevel + 1];
  const fillPct = Math.min(100, Math.round((leavesInBag / bagCapacity) * 100));

  const handleWatchAd = () => {
    addNotification('📺 Watching ad...');
    setTimeout(() => {
      rewardCoins(500);
      addNotification('🎉 +500 🪙 Ad Reward!');
    }, 1800);
  };

  if (!isShopOpen) return null;

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.68)',
        zIndex: 100, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
      onClick={() => setShopOpen(false)}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #181926, #12131e)',
          border: '1px solid rgba(255,200,50,0.25)',
          borderRadius: '22px',
          padding: '28px 32px',
          width: '420px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          color: '#fff',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>🎒 Inventory & Shop</h2>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>Press <b>TAB</b> or <b>ESC</b> to close</div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffe066' }}>🪙 {coins.toLocaleString()}</div>
        </div>

        {/* ── INVENTORY VISUAL SECTION ABOVE SHOP ───────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#ffe066', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📦 Leaf Storage
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: leavesInBag >= bagCapacity ? '#ff5252' : '#81c784' }}>
              {leavesInBag} / {bagCapacity} Leaves ({fillPct}%)
            </div>
          </div>

          {/* Fill Progress Bar */}
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{
              height: '100%',
              width: `${fillPct}%`,
              background: leavesInBag >= bagCapacity ? '#ff5252' : 'linear-gradient(90deg, #66bb6a, #ffe066)',
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }} />
          </div>

          {/* Visual Leaf Slot Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: '5px',
            background: 'rgba(0,0,0,0.25)',
            padding: '10px',
            borderRadius: '10px',
          }}>
            {Array.from({ length: Math.min(20, bagCapacity) }).map((_, i) => {
              const isFilled = i < Math.ceil((leavesInBag / bagCapacity) * 20);
              return (
                <div
                  key={i}
                  style={{
                    height: '24px',
                    borderRadius: '5px',
                    background: isFilled ? 'rgba(230, 126, 34, 0.85)' : 'rgba(255,255,255,0.06)',
                    border: isFilled ? '1px solid #d35400' : '1px dashed rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px',
                    transition: 'all 0.2s ease',
                  }}
                  title={isFilled ? 'Leaf collected' : 'Empty slot'}
                >
                  {isFilled ? '🍂' : ''}
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '8px', textAlign: 'right' }}>
            Est. Deposit Value: <b style={{ color: '#ffe066' }}>🪙 {leavesInBag} Coins</b>
          </div>
        </div>

        {/* ── UPGRADE CARDS SECTION ─────────────────────────────────── */}
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>
          ⚡ Equipment Upgrades
        </h3>

        {/* Bag Upgrade */}
        <UpgradeCard
          icon="🎒"
          title="Bag Capacity"
          currentLabel={`${BAG_TIERS[bagLevel].capacity} leaves`}
          nextLabel={nextBag ? `→ ${nextBag.capacity} leaves` : 'MAX'}
          cost={nextBag?.cost}
          canAfford={nextBag && coins >= nextBag.cost}
          onUpgrade={() => {
            if (!nextBag) return;
            upgradeBag();
            addNotification(`🎒 Bag upgraded to ${nextBag.capacity} leaves!`);
          }}
          level={bagLevel}
          maxLevel={BAG_TIERS.length - 1}
        />

        {/* Picking Power */}
        <UpgradeCard
          icon="✋"
          title="Picking Power"
          currentLabel={`${POWER_TIERS[powerLevel].power} leaf/click`}
          nextLabel={nextPower ? `→ ${nextPower.power} leaves/click` : 'MAX'}
          cost={nextPower?.cost}
          canAfford={nextPower && coins >= nextPower.cost}
          onUpgrade={() => {
            if (!nextPower) return;
            upgradePower();
            addNotification(`✋ Power upgraded to ${nextPower.power} leaves/click!`);
          }}
          level={powerLevel}
          maxLevel={POWER_TIERS.length - 1}
        />

        {/* Vacuum Power */}
        {hasVacuum && (
          <UpgradeCard
            icon="💨"
            title="Vacuum Power"
            currentLabel={`${VACUUM_TIERS[vacuumPowerLevel].power} leaves/sec`}
            nextLabel={nextVacuumPower ? `→ ${nextVacuumPower.power} leaves/sec` : 'MAX'}
            cost={nextVacuumPower?.cost}
            canAfford={nextVacuumPower && coins >= nextVacuumPower.cost}
            onUpgrade={() => {
              if (!nextVacuumPower) return;
              upgradeVacuumPower();
              addNotification(`💨 Vacuum upgraded to ${nextVacuumPower.power} leaves/sec!`);
            }}
            level={vacuumPowerLevel}
            maxLevel={VACUUM_TIERS.length - 1}
          />
        )}

        {/* Watch Ad */}
        <button
          onClick={handleWatchAd}
          style={{
            width: '100%', padding: '14px',
            background: 'linear-gradient(135deg, #ffe066, #ff9800)',
            border: 'none', borderRadius: '12px',
            color: '#1a1a2e', fontWeight: 800, fontSize: '15px',
            cursor: 'pointer', marginTop: '6px',
            boxShadow: '0 4px 16px rgba(255,152,0,0.4)',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.02)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        >
          📺 Watch Ad → +500 🪙
        </button>

        <button
          onClick={() => setShopOpen(false)}
          style={{
            width: '100%', marginTop: '12px', padding: '10px',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '10px', color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer', fontSize: '14px',
          }}
        >
          ✕ Close Shop (TAB)
        </button>
      </div>
    </div>
  );
}

function UpgradeCard({ icon, title, currentLabel, nextLabel, cost, canAfford, onUpgrade, level, maxLevel }) {
  const isMax = level >= maxLevel;
  const levelPct = Math.round((level / maxLevel) * 100);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '14px', padding: '14px 16px', marginBottom: '14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '3px' }}>{icon} {title}</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{currentLabel}</div>
          {!isMax && <div style={{ color: '#ffe066', fontSize: '12px', marginTop: '2px' }}>{nextLabel}</div>}
        </div>
        <button
          onClick={onUpgrade}
          disabled={!canAfford || isMax}
          style={{
            padding: '9px 16px', borderRadius: '10px', border: 'none',
            background: isMax ? '#333' : canAfford ? 'linear-gradient(135deg, #4caf50, #2e7d32)' : '#333',
            color: isMax || !canAfford ? 'rgba(255,255,255,0.4)' : '#fff',
            fontWeight: 700, fontSize: '13px',
            cursor: isMax || !canAfford ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {isMax ? '✅ MAX' : `🪙 ${cost}`}
        </button>
      </div>

      <div style={{ marginTop: '10px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${levelPct}%`,
          background: 'linear-gradient(90deg, #4caf50, #ffe066)',
          borderRadius: '2px', transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}
