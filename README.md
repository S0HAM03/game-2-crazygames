# 🍂 Leaf It Alone - 3D Web Game

A relaxing, cozy, high-fidelity 3D first-person garden simulator built with **React 18**, **Three.js**, **React Three Fiber**, and **Zustand**. Clean up your autumn garden by sweeping leaves into piles with a wooden broom, collecting them by hand or high-powered vacuum, managing your speedrun timer, and competing on the worldwide speedrun leaderboard!

---

## 🌟 Key Features

- **Mystic Grove Start Screen:** High-end, human-crafted atmospheric menu screen with dual-layered forest silhouettes, moon glow, floating fireflies, and seamless navigation.
- **Single Tool Equip System:** Realistic tool slot system allowing players to switch between hands, **Wooden Broom** (`Hotkey 1`), and **Vacuum Cleaner** (`Hotkey 2`).
- **Realistic 3D Wooden Broom & Sweeping Mechanics:** Includes a 3D wooden broom asset, smooth sweeping arc animation, camera-directional force physics, obstacle boundary collisions, and tight volumetric 3D leaf piling.
- **8-Hour Speedrun Timer & Global Leaderboard:**
  - Real-time **8-Hour Countdown Timer** widget in the HUD.
  - Automatic **Game Over (Time Expired)** if the 8-hour limit ends before the garden is cleaned.
  - **Victory Overlay Screen:** Shows formatted completion time, calculated **Worldwide Speedrun Rank** (e.g. `#14`), stats summary, and interactive global leaderboard table upon cleaning all 4,400 leaves.
- **Fallen Autumn Leaf Palette:** Natural light autumn fallen leaf tones (Golden Amber, Birch Yellow, Fallen Oak Tan, Warm Ochre, Chestnut Red, Crimson Maple) with zero artificial greens.
- **High-Detail 3D Tree Assets:** Realistic multi-forked trunk geometry, bark bump mapping, root buttresses, and multi-layered foliage canopies strictly positioned outside the house footprint.
- **Precision Aligned Double Gates:** Mathematically aligned driveway vehicle double gate (`X = -8.0`) and main pedestrian path gate (`X = 0.0`) sitting flush on the front fence boundary (`Z = 14.5`).
- **Lawn & Landscaping:** High-detail 512×512 multi-tone autumn turf texture with clover specks, soil patches, dark flower borders, stone pathways, piano flower beds, mailbox, birdbath, and garden benches.

---

## 🛠️ Technology Stack

- **React 18**
- **Vite** (Next-gen frontend build tool)
- **Three.js** & **React Three Fiber** (`@react-three/fiber`, `@react-three/drei`)
- **Zustand** (Global state management with persistence middleware)
- **Web Audio API & Speech Synthesis** (Voiceover & generative background music)

---

## 🎮 Controls

| Key / Action       | Description                                              |
| ------------------ | -------------------------------------------------------- |
| **W, A, S, D**     | Move around the world                                    |
| **Mouse Move**     | Look around (requires clicking to lock FPS camera)       |
| **Left Click**     | Sweep leaves (with Broom equipped) / Collect / Interact  |
| **Right Click**    | Use Vacuum Cleaner (must be purchased & equipped)        |
| **1**              | Equip / Unequip Wooden Broom                             |
| **2**              | Equip / Unequip Vacuum Cleaner                           |
| **Tab**            | Open / Close Inventory, Upgrades & Shop Panel            |
| **ESC**            | Release cursor / Pause                                   |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/S0HAM03/game-2-crazygames.git
   ```
2. Navigate into the project directory:
   ```bash
   cd game-2-crazygames
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
Start the Vite development server:
```bash
npm run dev
```
Open your browser at `http://localhost:5173` to play!

---

## 📜 Game Mechanics

1. **The Objective:** Collect all 4,400 fallen leaves in your garden before the 8-hour time limit ends.
2. **Tools & Upgrades:** Purchase the Wooden Broom (80 🪙) to sweep leaves into piles, or the Vacuum Cleaner (500 🪙) for fast collection. Upgrade your Bag Capacity and Suction Power in the Shop (`TAB`).
3. **Compost Bin:** Empty your leaf bag at the Compost Bin near the front gate to earn coins.
4. **Energy Management:** Rest in bed or drink Energy Drinks to maintain full movement speed.
