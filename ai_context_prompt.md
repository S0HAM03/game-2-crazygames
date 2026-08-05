# AI Context Prompt: Leaf It Alone 3D

> **INSTRUCTION FOR FUTURE AI AGENTS:** Read this entire file before making any changes to the project. It outlines the absolute source of truth for the game's architecture, state management, and design philosophy.

## 1. Project Overview
- **Name:** Leaf It Alone 3D
- **Framework:** Vite + React 18 + React Three Fiber (`@react-three/fiber`, `@react-three/drei`)
- **State Manager:** Zustand
- **Target Platform:** CrazyGames (Web Portal)

## 2. Global State Architecture (Zustand)
The entire game state is managed centrally in a Zustand store. Do NOT use local `useState` for anything related to the core economy.
- `coins`: (integer) Current money balance.
- `leavesInBag`: (integer) Current leaves held by the player.
- `bagCapacity`: (integer) Max leaves the player can hold (Starts at 20, upgradable).
- `pickingPower`: (integer) Number of leaves picked up per click (Starts at 1, max 10, upgradable).
- **Actions:** `addLeaf()`, `sellLeaves()`, `upgradeBag()`, `upgradePower()`, `rewardCoins(amount)`.

## 3. 3D Scene Architecture (`Garden.jsx`)
- The camera is an isometric or high-angle static view of a garden.
- **Leaves:** Leaves are rendered using `InstancedMesh` (for high performance) or simple mapped `mesh` components. When a leaf is clicked, it triggers the `addLeaf()` store action and plays a CSS/Spring pop animation before disappearing.
- **The Spawner:** A `useFrame` or `setInterval` system spawns new leaves over time on the ground plane, up to a defined maximum to preserve 60FPS.

## 4. UI Architecture (`GameUI.jsx`)
- UI is built using standard React HTML/CSS overlays on top of the R3F `<Canvas>`.
- The UI MUST be responsive.
- **Components:**
  - Status Bar: Shows Coins and `leavesInBag / bagCapacity`.
  - Upgrade Shop Modal: Buttons to trigger `upgradeBag()` and `upgradePower()`.
  - CrazyGames SDK Button: Prompts `showRewardedAd()` to trigger `rewardCoins(500)`.

## 5. Design Philosophy
- **Performance First:** Since this is a web game, keep geometry low-poly. Do not use extremely high-res textures. Use simple materials (`meshStandardMaterial` with colors).
- **Satisfying Feedback:** Every action must feel good. Clicking a leaf should make a sound and have a visual pop. Selling leaves should trigger a coin shower effect or satisfying sound.
- **CrazyGames Compliance:** Never link to external sites. Always ensure the screen resizes perfectly. Use the SDK wrapper for all ads.
