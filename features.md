# Leaf It Alone 3D - Features List

## 1. Inventory System (The Bag)
- Players start with a free, basic Bag that has a capacity of **20 Leaves**.
- When the Bag is full, a UI warning "Bag Full!" appears, and leaves can no longer be clicked.
- **Upgrades:** The capacity can be upgraded dynamically in the Shop (e.g., 20 -> 50 -> 100 -> 500).

## 2. Picking Power (The Hands/Tools)
- Players start with a picking power of **1** (clicking a leaf collects exactly 1 leaf).
- **Upgrades:** The picking power can be upgraded in the Shop (e.g., 1 -> 2 -> 3... up to 10).
- If the Picking Power is greater than 1, a single click will pull multiple nearby leaves into the bag simultaneously (visualized with a satisfying vacuum/magnet effect).

## 3. Economy (Coins & The Compost Bin)
- The garden features a centralized **Compost Bin**.
- Clicking the Compost Bin instantly empties the player's Bag and rewards Coins (e.g., 1 Leaf = 1 Coin, with potential for combo multipliers later).

## 4. Monetization (CrazyGames SDK)
- A **Rewarded Ad** button is prominently displayed in the UI ("Watch Ad for +500 Coins!").
- Clicking this triggers the `showRewardedAd` function from the CrazyGames SDK.
- Upon completion, the player's Coin balance instantly increases.

## 5. 3D Environment (React Three Fiber)
- **Spawning:** A spawner system drops new leaf objects randomly within the grass bounds over time, up to a maximum cap (e.g., 200 leaves maximum to preserve performance).
- **Interactivity:** Raycasting is used so players can click directly on the 3D meshes to collect them.
- **Aesthetics:** Low-poly models, warm lighting, and soft shadows create a cozy, relaxing atmosphere.
