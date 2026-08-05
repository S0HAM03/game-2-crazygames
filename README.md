# Leaf Collect - 3D Web Game

A relaxing, cozy 3D first-person web game built with **React**, **Three.js**, and **React Three Fiber**. Clean up your messy garden by picking up scattered leaves, upgrading your equipment, managing your energy levels, and eventually utilizing a high-powered leaf vacuum to get the yard spotless!

## 🌟 Features

- **Immersive 3D First-Person Mechanics:** Full pointer-lock camera controls and smooth player movement.
- **Dynamic Physics & Instancing:** Hundreds of leaves rendered efficiently using Three.js `InstancedMesh` with dynamic vacuum suction physics.
- **Upgrades & Progression:** Visit the in-game Shop to upgrade your Bag Capacity, Hand-Picking Power, and Vacuum Suction Power.
- **Energy System:** Players must manage their stamina. Energy depletes over time and affects movement speed—recover energy by resting in bed or eating snacks in the kitchen.
- **Dynamic Proximity UI:** Sleek, glassmorphism tooltips and labels smoothly fade in and out based on player distance from interactive objects.
- **Immersive Audio:** Features soft, relaxing generative synth-pad music, satisfying leaf-popping sound effects, and realistic vacuum hums utilizing the Web Audio API.

## 🛠️ Technology Stack

- **React 18**
- **Vite** (Build Tool)
- **Three.js** & **React Three Fiber** (`@react-three/fiber`, `@react-three/drei`)
- **Zustand** (Global State Management)

## 🎮 Controls

| Key / Action       | Description                                  |
| ------------------ | -------------------------------------------- |
| **W, A, S, D**     | Move around the world                        |
| **Mouse Move**     | Look around (requires clicking to lock)      |
| **Left Click**     | Collect a leaf / Interact with objects       |
| **Right Click**    | Use the Leaf Vacuum (must be equipped)       |
| **Tab**            | Open / Close the Shop and Upgrades Menu      |
| **E**              | Dev Cheat: Instantly collect 100% of leaves  |

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
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
To start the Vite development server, run:
```bash
npm run dev
```
Open your browser to `http://localhost:5173` to play the game!

## 📜 Mechanics Overview

- **The Goal:** Collect all the leaves scattered across the yard and deposit them in the Compost Bin to win.
- **The Bag:** You can only carry a limited amount of leaves at a time. Upgrade your bag in the shop to carry more.
- **The Vacuum:** Once unlocked, the vacuum allows for rapid area-of-effect collection but drains its own battery. Recharge it at the garage!
- **Energy:** Passive energy drain slows you down. Drink an Energy Drink or sleep in your bed to recover.
