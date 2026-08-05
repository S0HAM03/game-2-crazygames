import { useState } from 'react';
import { useGameStore } from '../store';
import { ShoppingBag, Zap, HandCoins, Video } from 'lucide-react';

export default function GameUI() {
  const coins = useGameStore(state => state.coins);
  const leavesInBag = useGameStore(state => state.leavesInBag);
  const bagCapacity = useGameStore(state => state.bagCapacity);
  const pickingPower = useGameStore(state => state.pickingPower);
  const bagUpgradeCost = useGameStore(state => state.bagUpgradeCost);
  const powerUpgradeCost = useGameStore(state => state.powerUpgradeCost);
  
  const upgradeBag = useGameStore(state => state.upgradeBag);
  const upgradePower = useGameStore(state => state.upgradePower);
  const rewardCoins = useGameStore(state => state.rewardCoins);

  const [shopOpen, setShopOpen] = useState(false);

  const handleWatchAd = () => {
    // Simulated CrazyGames SDK call
    console.log("[CrazyGames SDK] Requesting rewarded ad...");
    setTimeout(() => {
      console.log("[CrazyGames SDK] Ad complete, rewarding 500 coins.");
      rewardCoins(500);
      setShopOpen(false);
    }, 1500); // simulate ad duration
  };

  const isBagFull = leavesInBag >= bagCapacity;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none'
    }}>
      
      {/* Top Status Bar */}
      <div style={{
        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '20px', pointerEvents: 'auto', background: 'rgba(255,255,255,0.9)',
        padding: '10px 20px', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        fontFamily: 'sans-serif', fontWeight: 'bold'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309' }}>
          <HandCoins size={20} />
          Coins: {coins}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isBagFull ? '#ef4444' : '#15803d' }}>
          <ShoppingBag size={20} />
          Bag: {leavesInBag} / {bagCapacity}
          {isBagFull && <span style={{fontSize:'12px', marginLeft:'5px'}}>(FULL! Go to Bin)</span>}
        </div>
      </div>

      {/* Shop Button */}
      <button 
        onClick={() => setShopOpen(true)}
        style={{
          position: 'absolute', bottom: 20, right: 20, pointerEvents: 'auto',
          background: '#3b82f6', color: 'white', border: 'none', borderRadius: '50%',
          width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
        }}
      >
        <Zap size={24} />
      </button>

      {/* Shop Modal */}
      {shopOpen && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'auto', fontFamily: 'sans-serif'
        }}>
          <div style={{
            background: 'white', padding: '30px', borderRadius: '15px', width: '300px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{marginTop:0, marginBottom:'20px'}}>Upgrade Shop</h2>
            
            <div style={{ marginBottom: '15px', padding: '10px', background: '#f3f4f6', borderRadius: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Bag Capacity (Lvl {Math.floor((bagCapacity-20)/10) + 1})</div>
              <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '10px' }}>Current: {bagCapacity} leaves</div>
              <button 
                onClick={upgradeBag}
                disabled={coins < bagUpgradeCost}
                style={{ width: '100%', padding: '8px', cursor: coins >= bagUpgradeCost ? 'pointer' : 'not-allowed' }}
              >
                Upgrade (Cost: {bagUpgradeCost})
              </button>
            </div>

            <div style={{ marginBottom: '20px', padding: '10px', background: '#f3f4f6', borderRadius: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Picking Power (Lvl {pickingPower})</div>
              <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '10px' }}>Current: {pickingPower} / click</div>
              <button 
                onClick={upgradePower}
                disabled={coins < powerUpgradeCost || pickingPower >= 10}
                style={{ width: '100%', padding: '8px', cursor: (coins >= powerUpgradeCost && pickingPower < 10) ? 'pointer' : 'not-allowed' }}
              >
                {pickingPower >= 10 ? "MAX LEVEL" : `Upgrade (Cost: ${powerUpgradeCost})`}
              </button>
            </div>

            <button 
              onClick={handleWatchAd}
              style={{ width: '100%', padding: '10px', background: '#eab308', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Video size={18} /> Watch Ad (+500 Coins)
            </button>

            <button 
              onClick={() => setShopOpen(false)}
              style={{ width: '100%', padding: '10px', marginTop: '10px', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
