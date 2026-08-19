import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const GAME_PHASES = { START_MENU: 'start_menu', PICKUP_BAG: 'pickup_bag', PLAYING: 'playing' };

const UPGRADE_CONFIGS = {
  bag: [
    { capacity: 20, cost: 0 },
    { capacity: 50, cost: 80 },
    { capacity: 100, cost: 200 },
    { capacity: 150, cost: 450 },
    { capacity: 200, cost: 800 },
    { capacity: 250, cost: 1500 },
    { capacity: 300, cost: 3000 },
  ],
  power: [
    { power: 1, cost: 0 },
    { power: 2, cost: 100 },
    { power: 3, cost: 250 },
    { power: 4, cost: 500 },
    { power: 5, cost: 900 },
    { power: 7, cost: 1500 },
    { power: 10, cost: 3000 },
  ],
  vacuumPower: [
    { power: 15, cost: 0 },
    { power: 25, cost: 1000 },
    { power: 35, cost: 2500 },
    { power: 45, cost: 5000 },
    { power: 55, cost: 10000 },
  ],
};

export const useGameStore = create(
  persist(
    (set, get) => ({
      gamePhase: GAME_PHASES.START_MENU,
      hasBag: false,
  coins: 0,
  leavesInBag: 0,

  pickupBag: () => set({ hasBag: true, gamePhase: GAME_PHASES.PLAYING }),
  bagLevel: 0,
  powerLevel: 0,
  vacuumPowerLevel: 0,
  totalCollected: 0,
  isShopOpen: false,
  isSettingsOpen: false,
  isGameOver: false,
  notifications: [],
  collectedLeafIds: [],
  collectLeafIds: (ids) => set((state) => ({
    collectedLeafIds: [...state.collectedLeafIds, ...ids]
  })),

  subtitleText: '',
  tutorialFlags: {
    equippedBag: false,
    sweptLeaves: false,
    soldLeaves: false,
    visitedGarage: false
  },

  // 8-Hour Timer & Speedrun System (8 Hours = 28,800 Seconds)
  maxTimerSeconds: 28800,
  timerSeconds: 28800,
  elapsedSeconds: 0,
  isTimerExpired: false,
  isVictory: false,
  completionTime: 0,
  worldRank: null,

  tickTimer: (delta) => set((state) => {
    if (state.isGameOver || state.isVictory || state.gamePhase === GAME_PHASES.START_MENU) return state;
    
    const newTimer = Math.max(0, state.timerSeconds - delta);
    const newElapsed = state.elapsedSeconds + delta;
    
    if (newTimer <= 0 && !state.isTimerExpired) {
      return {
        timerSeconds: 0,
        elapsedSeconds: newElapsed,
        isTimerExpired: true,
        isGameOver: true,
      };
    }
    return {
      timerSeconds: newTimer,
      elapsedSeconds: newElapsed,
    };
  }),

  triggerVictory: () => set((state) => {
    const timeTaken = Math.round(state.elapsedSeconds);
    // Calculate realistic worldwide rank based on completion time
    let rank = Math.max(1, Math.floor((timeTaken / 240) + 1));
    if (rank > 99) rank = 99;

    return {
      isVictory: true,
      isGameOver: true,
      completionTime: timeTaken,
      worldRank: rank,
    };
  }),

  resetTimerAndGame: () => set({
    timerSeconds: 28800,
    elapsedSeconds: 0,
    isTimerExpired: false,
    isVictory: false,
    isGameOver: false,
    completionTime: 0,
    worldRank: null,
  }),
  setSubtitleText: (text) => set({ subtitleText: text }),
  completeTutorialFlag: (flag) => set((state) => ({
    tutorialFlags: { ...state.tutorialFlags, [flag]: true }
  })),
  triggerVoiceOver: (subtitle, textToSpeak) => {
    try {
      window.speechSynthesis.cancel();
    } catch(e) {}
    
    set({ subtitleText: subtitle });

    const utterance = new SpeechSynthesisUtterance(textToSpeak || subtitle);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural')));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    
    utterance.onend = () => {
      set({ subtitleText: '' });
    };
    utterance.onerror = () => {
      set({ subtitleText: '' });
    };
    
    window.speechSynthesis.speak(utterance);

    setTimeout(() => {
      if (get().subtitleText === subtitle) {
        set({ subtitleText: '' });
      }
    }, 8000);
  },

  setGameOver: (v) => set({ isGameOver: v }),
  resetYard: () => set((state) => ({
    isGameOver: false,
    energy: state.maxEnergy,
    leavesInBag: 0,
    vacuumBattery: state.hasVacuum ? state.maxVacuumBattery : 90,
    collectedLeafIds: [],
    tutorialFlags: {
      equippedBag: state.hasBag,
      sweptLeaves: false,
      soldLeaves: false,
      visitedGarage: false
    }
  })),

  // Settings
  musicVolume: 0.12,
  sfxVolume: 0.75,
  mouseSensitivity: 0.0022,

  setMusicVolume: (v) => set({ musicVolume: v }),
  setSfxVolume: (v) => set({ sfxVolume: v }),
  setMouseSensitivity: (v) => set({ mouseSensitivity: v }),

  getBagCapacity: () => UPGRADE_CONFIGS.bag[get().bagLevel].capacity,
  getPickingPower: () => UPGRADE_CONFIGS.power[get().powerLevel].power,
  getVacuumPower: () => UPGRADE_CONFIGS.vacuumPower[get().vacuumPowerLevel].power,
  getNextBagCost: () => {
    const next = get().bagLevel + 1;
    return next < UPGRADE_CONFIGS.bag.length ? UPGRADE_CONFIGS.bag[next].cost : null;
  },
  getNextPowerCost: () => {
    const next = get().powerLevel + 1;
    return next < UPGRADE_CONFIGS.power.length ? UPGRADE_CONFIGS.power[next].cost : null;
  },
  getNextVacuumPowerCost: () => {
    const next = get().vacuumPowerLevel + 1;
    return next < UPGRADE_CONFIGS.vacuumPower.length ? UPGRADE_CONFIGS.vacuumPower[next].cost : null;
  },

  addLeaves: (amount) => set((state) => {
    const capacity = UPGRADE_CONFIGS.bag[state.bagLevel].capacity;
    const space = capacity - state.leavesInBag;
    if (space <= 0) return state;
    const toAdd = Math.min(amount, space);
    return {
      leavesInBag: state.leavesInBag + toAdd,
      totalCollected: state.totalCollected + toAdd,
    };
  }),

  sellLeaves: () => set((state) => {
    if (state.leavesInBag === 0) return state;
    const earned = state.leavesInBag;
    return { coins: state.coins + earned, leavesInBag: 0 };
  }),

  upgradeBag: () => set((state) => {
    const nextLevel = state.bagLevel + 1;
    if (nextLevel >= UPGRADE_CONFIGS.bag.length) return state;
    const cost = UPGRADE_CONFIGS.bag[nextLevel].cost;
    if (state.coins < cost) return state;
    return { coins: state.coins - cost, bagLevel: nextLevel };
  }),

  upgradePower: () => set((state) => {
    const nextLevel = state.powerLevel + 1;
    if (nextLevel >= UPGRADE_CONFIGS.power.length) return state;
    const cost = UPGRADE_CONFIGS.power[nextLevel].cost;
    if (state.coins < cost) return state;
    return { coins: state.coins - cost, powerLevel: nextLevel };
  }),

  upgradeVacuumPower: () => set((state) => {
    const nextLevel = state.vacuumPowerLevel + 1;
    if (nextLevel >= UPGRADE_CONFIGS.vacuumPower.length) return state;
    const cost = UPGRADE_CONFIGS.vacuumPower[nextLevel].cost;
    if (state.coins < cost) return state;
    return { coins: state.coins - cost, vacuumPowerLevel: nextLevel };
  }),

  rewardCoins: (amount) => set((state) => ({ coins: state.coins + amount })),

  setShopOpen: (v) => {
    if (v) document.exitPointerLock();
    set({ isShopOpen: v, isSettingsOpen: false });
  },
  
  setSettingsOpen: (v) => {
    if (v) document.exitPointerLock();
    set({ isSettingsOpen: v, isShopOpen: false });
  },

  // Energy System
  energy: 100,
  maxEnergy: 100,
  sleep: () => set({ energy: 100 }),
  eatFood: (cost, restoreAmount) => set((state) => {
    if (state.coins < cost) return state;
    return { 
      coins: state.coins - cost, 
      energy: Math.min(state.maxEnergy, state.energy + restoreAmount) 
    };
  }),
  consumeEnergy: (amount) => set((state) => ({
    energy: Math.max(0, state.energy - amount)
  })),

  // Vacuum & Broom System
  hasVacuum: false,
  hasBroom: false,
  isVacuuming: false,
  isSweeping: false,
  vacuumBattery: 90,
  maxVacuumBattery: 90,
  consumeBattery: (amount) => set((state) => ({
    vacuumBattery: Math.max(0, state.vacuumBattery - amount)
  })),
  activeTool: 'none', // 'none' | 'broom' | 'vacuum'
  setActiveTool: (tool) => set({ activeTool: tool }),
  buyBattery: () => set((state) => {
    if (state.coins < 100 || state.vacuumBattery >= state.maxVacuumBattery) return state;
    return { coins: state.coins - 100, vacuumBattery: state.maxVacuumBattery };
  }),
  buyVacuum: () => set((state) => {
    if (state.coins < 500) return state;
    return { coins: state.coins - 500, hasVacuum: true, vacuumBattery: state.maxVacuumBattery, activeTool: 'vacuum' };
  }),
  buyBroom: () => set((state) => {
    if (state.coins < 80) return state;
    return { coins: state.coins - 80, hasBroom: true, activeTool: 'broom' };
  }),
  equipBroom: () => set((state) => {
    if (state.hasBroom) return { activeTool: 'broom' };
    return state;
  }),
  equipVacuum: () => set((state) => {
    if (state.hasVacuum) return { activeTool: 'vacuum' };
    return state;
  }),
  setVacuuming: (val) => set({ isVacuuming: val }),
  setSweeping: (val) => set({ isSweeping: val }),

  // Boost System
  isBoosted: false,
  boostTimeLeft: 0,
  buyEnergyDrink: () => set((state) => {
    if (state.coins < 50) return state;
    return { coins: state.coins - 50, isBoosted: true, boostTimeLeft: 15 }; // 15 seconds boost
  }),
  tickBoost: (delta) => set((state) => {
    if (!state.isBoosted) return state;
    const nextTime = state.boostTimeLeft - delta;
    if (nextTime <= 0) {
      return { isBoosted: false, boostTimeLeft: 0 };
    }
    return { boostTimeLeft: nextTime };
  }),

  addNotification: (text) => {
    const id = Date.now() + Math.random();
    set((state) => ({ notifications: [...state.notifications, { id, text }] }));
    setTimeout(() => {
      set((state) => ({ notifications: state.notifications.filter(n => n.id !== id) }));
    }, 2000);
  },
}),
{
  name: 'leaf-collect-save',

  partialize: (state) => ({
    coins: state.coins,
    hasVacuum: state.hasVacuum,
    hasBroom: state.hasBroom,
    bagLevel: state.bagLevel,
    powerLevel: state.powerLevel,
    vacuumPowerLevel: state.vacuumPowerLevel,
    totalCollected: state.totalCollected,
    hasBag: state.hasBag,
    leavesInBag: state.leavesInBag,
    collectedLeafIds: state.collectedLeafIds,
    tutorialFlags: state.tutorialFlags,
    activeTool: state.activeTool,
    timerSeconds: state.timerSeconds,
    elapsedSeconds: state.elapsedSeconds,
    isVictory: state.isVictory,
    completionTime: state.completionTime,
    worldRank: state.worldRank,
  }),
}

));
