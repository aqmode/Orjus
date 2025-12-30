import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// Types
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  value: number;
  count: number;
  type: 'dpc' | 'dps' | 'energy_max' | 'energy_regen';
}

export interface Ability {
  id: string;
  name: string;
  icon: string;
  requiredRebirthLevel: number; // Уровень перерождения для открытия (2, 5, 10, 15)
  isUnlocked: boolean;
  
  // Перезарядка (улучшается через RP)
  cooldownLevel: number; // 0-5
  baseCooldown: number; // Базовый кулдаун 5 сек
  currentCooldown: number; // Текущий таймер кулдауна
  
  // DPS множитель (улучшается через RP)
  dpsLevel: number; // 0-5
  dpsMultipliers: number[]; // Множители для уровней 0-5
}

// Стоимость улучшений способностей (одинаковая для всех) - в RP
export const ABILITY_UPGRADE_COSTS = [1, 2, 4, 8, 16]; // Стоимость для уровней 1-5

// Сокращение перезарядки по уровням (накапливается)
export const COOLDOWN_REDUCTIONS = [0, 0.2, 0.4, 0.8, 1.6, 3.2]; // Уровень 0-5

export interface Material {
  id: string;
  name: string;
  count: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  materials: { materialId: string; count: number }[];
  result: { materialId: string; count: number };
  energyCost: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: number;
  type: 'essence' | 'dpc' | 'dps' | 'rebirth' | 'clicks' | 'materials' | 'abilities';
  points: number;
  unlocked: boolean;
}

export interface GameState {
  // Core stats
  essence: number;
  totalEssence: number;
  totalClicks: number;
  
  // Energy system
  energy: number;
  maxEnergy: number;
  energyRegenRate: number; // ms between regen ticks (lower = faster)
  
  // Damage
  baseDpc: number;
  baseDps: number;
  
  // Rebirth system
  rebirthLevel: number;
  rebirthPoints: number;
  rebirthMultiplier: number;
  
  // Upgrades
  upgrades: Upgrade[];
  autoBuyUpgrades: { [upgradeId: string]: boolean };
  
  // Abilities
  abilities: Ability[];
  selectedAbilityId: string | null;
  
  // Materials
  materials: Material[];
  totalMaterials: number;
  craftedItems: { [materialId: string]: number }; // Количество скрафченных предметов по ID
  
  // Achievements
  achievements: Achievement[];
  achievementPoints: number;
  
  // Game state
  lastSaveTime: number;
  lastTickTime: number;
}

// Initial Data
const initialUpgrades: Upgrade[] = [
  // DPC - урон за клик (основной источник дохода в начале)
  { id: 'dpc1', name: 'Малый удар', description: '+1 урона за клик', baseCost: 15, costMultiplier: 1.12, value: 1, count: 0, type: 'dpc' },
  { id: 'dpc2', name: 'Удар', description: '+5 урона за клик', baseCost: 100, costMultiplier: 1.13, value: 5, count: 0, type: 'dpc' },
  { id: 'dpc3', name: 'Сильный удар', description: '+25 урона за клик', baseCost: 500, costMultiplier: 1.14, value: 25, count: 0, type: 'dpc' },
  { id: 'dpc4', name: 'Огромный удар', description: '+100 урона за клик', baseCost: 3000, costMultiplier: 1.15, value: 100, count: 0, type: 'dpc' },
  { id: 'dpc5', name: 'Божественный удар', description: '+500 урона за клик', baseCost: 20000, costMultiplier: 1.16, value: 500, count: 0, type: 'dpc' },
  
  // DPS - пассивный доход (становится важнее со временем)
  { id: 'dps1', name: 'Малый тотем', description: '+1 урона в секунду', baseCost: 50, costMultiplier: 1.13, value: 1, count: 0, type: 'dps' },
  { id: 'dps2', name: 'Тотем', description: '+5 урона в секунду', baseCost: 300, costMultiplier: 1.14, value: 5, count: 0, type: 'dps' },
  { id: 'dps3', name: 'Сильный тотем', description: '+25 урона в секунду', baseCost: 1500, costMultiplier: 1.15, value: 25, count: 0, type: 'dps' },
  { id: 'dps4', name: 'Огромный тотем', description: '+100 урона в секунду', baseCost: 10000, costMultiplier: 1.16, value: 100, count: 0, type: 'dps' },
  { id: 'dps5', name: 'Божественный тотем', description: '+500 урона в секунду', baseCost: 75000, costMultiplier: 1.17, value: 500, count: 0, type: 'dps' },
  
  // Energy Max - увеличивает запас кликов
  { id: 'energy1', name: 'Расширение энергии', description: '+3 к макс. энергии', baseCost: 100, costMultiplier: 1.20, value: 3, count: 0, type: 'energy_max' },
  { id: 'energy2', name: 'Большой запас', description: '+5 к макс. энергии', baseCost: 500, costMultiplier: 1.22, value: 5, count: 0, type: 'energy_max' },
  { id: 'energy3', name: 'Огромный запас', description: '+10 к макс. энергии', baseCost: 2500, costMultiplier: 1.25, value: 10, count: 0, type: 'energy_max' },
  
  // Energy Regen - ускоряет восстановление (очень ценно)
  { id: 'regen1', name: 'Быстрое восстановление', description: '-2мс к регенерации', baseCost: 200, costMultiplier: 1.25, value: 2, count: 0, type: 'energy_regen' },
  { id: 'regen2', name: 'Ускоренный поток', description: '-3мс к регенерации', baseCost: 1000, costMultiplier: 1.28, value: 3, count: 0, type: 'energy_regen' },
  { id: 'regen3', name: 'Мгновенная регенерация', description: '-4мс к регенерации', baseCost: 5000, costMultiplier: 1.30, value: 4, count: 0, type: 'energy_regen' },
];

// 4 способности с прокачкой через очки перерождений (RP)
const initialAbilities: Ability[] = [
  { 
    id: 'ability1', 
    name: 'Удар Молнии', 
    icon: '⚡', 
    requiredRebirthLevel: 2,  // Открывается на 2 уровне перерождения
    isUnlocked: false,
    cooldownLevel: 0,
    baseCooldown: 5,
    currentCooldown: 0,
    dpsLevel: 0,
    dpsMultipliers: [1, 5, 7, 10, 13, 15]  // x1, x5, x7, x10, x13, x15
  },
  { 
    id: 'ability2', 
    name: 'Огненный шторм', 
    icon: '�', 
    requiredRebirthLevel: 5,  // Открывается на 5 уровне перерождения
    isUnlocked: false,
    cooldownLevel: 0,
    baseCooldown: 5,
    currentCooldown: 0,
    dpsLevel: 0,
    dpsMultipliers: [1, 7, 10, 15, 20, 23]  // x1, x7, x10, x15, x20, x23
  },
  { 
    id: 'ability3', 
    name: 'Взрыв Пустоты', 
    icon: '🌑', 
    requiredRebirthLevel: 10,  // Открывается на 10 уровне перерождения
    isUnlocked: false,
    cooldownLevel: 0,
    baseCooldown: 5,
    currentCooldown: 0,
    dpsLevel: 0,
    dpsMultipliers: [1, 15, 20, 23, 25, 30]  // x1, x15, x20, x23, x25, x30
  },
  { 
    id: 'ability4', 
    name: 'Небесный гнев', 
    icon: '✨', 
    requiredRebirthLevel: 15,  // Открывается на 15 уровне перерождения
    isUnlocked: false,
    cooldownLevel: 0,
    baseCooldown: 5,
    currentCooldown: 0,
    dpsLevel: 0,
    dpsMultipliers: [1, 16, 20, 25, 30, 35]  // x1, x16, x20, x25, x30, x35
  },
];

const initialMaterials: Material[] = [
  { id: 'wood', name: 'Дерево', count: 0, rarity: 'common' },
  { id: 'stone', name: 'Камень', count: 0, rarity: 'common' },
  { id: 'iron', name: 'Железо', count: 0, rarity: 'uncommon' },
  { id: 'gold', name: 'Золото', count: 0, rarity: 'rare' },
  { id: 'diamond', name: 'Алмаз', count: 0, rarity: 'rare' },
  { id: 'voidEssence', name: 'Эссенция Пустоты', count: 0, rarity: 'epic' },
  { id: 'emerald', name: 'Изумруд', count: 0, rarity: 'rare' },
  { id: 'ruby', name: 'Рубин', count: 0, rarity: 'rare' },
  { id: 'obsidian', name: 'Обсидиан', count: 0, rarity: 'rare' },
  { id: 'starShard', name: 'Осколок Звезды', count: 0, rarity: 'epic' },
  { id: 'core', name: 'Ядро', count: 0, rarity: 'legendary' },
  // Crafted materials
  { id: 'woodBlock', name: 'Деревянный брусок', count: 0, rarity: 'common' },
  { id: 'stoneBrick', name: 'Каменный кирпич', count: 0, rarity: 'common' },
  { id: 'ironIngot', name: 'Железный слиток', count: 0, rarity: 'uncommon' },
  { id: 'goldIngot', name: 'Золотой слиток', count: 0, rarity: 'rare' },
  { id: 'diamondShard', name: 'Алмазная крошка', count: 0, rarity: 'rare' },
  { id: 'voidCrystal', name: 'Кристалл Пустоты', count: 0, rarity: 'epic' },
  { id: 'starFragment', name: 'Фрагмент Звезды', count: 0, rarity: 'epic' },
  { id: 'voidCore', name: 'Ядро Пустоты', count: 0, rarity: 'legendary' },
];

// Craft recipes
export const craftRecipes: Recipe[] = [
  // Basic compression recipes
  { 
    id: 'woodBlock', 
    name: 'Деревянный брусок', 
    description: 'Сожми 9 деревяшек в брусок для компактного хранения',
    materials: [{ materialId: 'wood', count: 9 }], 
    result: { materialId: 'woodBlock', count: 1 }, 
    energyCost: 2 
  },
  { 
    id: 'stoneBrick', 
    name: 'Каменный кирпич', 
    description: 'Обработай камень в прочный кирпич',
    materials: [{ materialId: 'stone', count: 9 }], 
    result: { materialId: 'stoneBrick', count: 1 }, 
    energyCost: 3 
  },
  { 
    id: 'ironIngot', 
    name: 'Железный слиток', 
    description: 'Переплавь железо в слиток. Нужен для создания механизмов',
    materials: [{ materialId: 'iron', count: 9 }], 
    result: { materialId: 'ironIngot', count: 1 }, 
    energyCost: 4 
  },
  { 
    id: 'goldIngot', 
    name: 'Золотой слиток', 
    description: 'Золото - основа для магических предметов',
    materials: [{ materialId: 'gold', count: 9 }], 
    result: { materialId: 'goldIngot', count: 1 }, 
    energyCost: 5 
  },
  { 
    id: 'diamondShard', 
    name: 'Алмазная крошка', 
    description: 'Измельчи алмазы для создания кристаллов',
    materials: [{ materialId: 'diamond', count: 9 }], 
    result: { materialId: 'diamondShard', count: 1 }, 
    energyCost: 6 
  },
  
  // Advanced recipes
  { 
    id: 'voidEssenceRecipe', 
    name: 'Эссенция Пустоты', 
    description: 'Мощный ресурс для создания легендарных предметов',
    materials: [{ materialId: 'diamond', count: 5 }, { materialId: 'obsidian', count: 4 }], 
    result: { materialId: 'voidEssence', count: 1 }, 
    energyCost: 8 
  },
  { 
    id: 'voidCrystal', 
    name: 'Кристалл Пустоты', 
    description: 'Редкий кристалл, усиливающий способности',
    materials: [{ materialId: 'voidEssence', count: 5 }, { materialId: 'diamondShard', count: 3 }], 
    result: { materialId: 'voidCrystal', count: 1 }, 
    energyCost: 10 
  },
  { 
    id: 'starFragment', 
    name: 'Фрагмент Звезды', 
    description: 'Звёздный осколок с невероятной силой',
    materials: [{ materialId: 'starShard', count: 5 }, { materialId: 'goldIngot', count: 3 }], 
    result: { materialId: 'starFragment', count: 1 }, 
    energyCost: 12 
  },
  
  // Legendary recipes
  { 
    id: 'voidCore', 
    name: 'Ядро Пустоты', 
    description: '🌟 ЛЕГЕНДАРНЫЙ предмет! Даст огромный бонус к эссенции',
    materials: [{ materialId: 'core', count: 1 }, { materialId: 'voidCrystal', count: 3 }, { materialId: 'starFragment', count: 2 }], 
    result: { materialId: 'voidCore', count: 1 }, 
    energyCost: 15 
  },
  
  // Gem conversions
  { 
    id: 'emeraldToRuby', 
    name: 'Рубин из изумруда', 
    description: 'Трансмутация: преврати изумруды в рубины',
    materials: [{ materialId: 'emerald', count: 3 }], 
    result: { materialId: 'ruby', count: 1 }, 
    energyCost: 4 
  },
  { 
    id: 'rubyToEmerald', 
    name: 'Изумруд из рубина', 
    description: 'Трансмутация: преврати рубины в изумруды',
    materials: [{ materialId: 'ruby', count: 3 }], 
    result: { materialId: 'emerald', count: 1 }, 
    energyCost: 4 
  },
  
  // Special recipes
  { 
    id: 'obsidianFromLava', 
    name: 'Обсидиан', 
    description: 'Создай обсидиан из камня и железа',
    materials: [{ materialId: 'stone', count: 5 }, { materialId: 'iron', count: 4 }], 
    result: { materialId: 'obsidian', count: 1 }, 
    energyCost: 6 
  },
];

const initialAchievements: Achievement[] = [
  // Essence achievements
  { id: 'ess1', name: 'Первый шаг', description: 'Собери 1,000 эссенций', requirement: 1000, type: 'essence', points: 1, unlocked: false },
  { id: 'ess2', name: 'Растущее богатство', description: 'Собери 10,000 эссенций', requirement: 10000, type: 'essence', points: 1, unlocked: false },
  { id: 'ess3', name: 'Состоятельный', description: 'Собери 100,000 эссенций', requirement: 100000, type: 'essence', points: 2, unlocked: false },
  { id: 'ess4', name: 'Повелитель денег', description: 'Собери 1,000,000 эссенций', requirement: 1000000, type: 'essence', points: 2, unlocked: false },
  { id: 'ess5', name: 'Магнат', description: 'Собери 10,000,000 эссенций', requirement: 10000000, type: 'essence', points: 3, unlocked: false },
  { id: 'ess6', name: 'Император богатства', description: 'Собери 100,000,000 эссенций', requirement: 100000000, type: 'essence', points: 5, unlocked: false },
  // DPC achievements
  { id: 'dpc1', name: 'Слабый удар', description: 'Достигни 10 DPC', requirement: 10, type: 'dpc', points: 1, unlocked: false },
  { id: 'dpc2', name: 'Сильный удар', description: 'Достигни 100 DPC', requirement: 100, type: 'dpc', points: 1, unlocked: false },
  { id: 'dpc3', name: 'Мастер удара', description: 'Достигни 1,000 DPC', requirement: 1000, type: 'dpc', points: 2, unlocked: false },
  { id: 'dpc4', name: 'Разрушитель', description: 'Достигни 10,000 DPC', requirement: 10000, type: 'dpc', points: 3, unlocked: false },
  { id: 'dpc5', name: 'Катаклизм', description: 'Достигни 100,000 DPC', requirement: 100000, type: 'dpc', points: 5, unlocked: false },
  // DPS achievements
  { id: 'dps1', name: 'Малый тотем', description: 'Достигни 10 DPS', requirement: 10, type: 'dps', points: 1, unlocked: false },
  { id: 'dps2', name: 'Сильный тотем', description: 'Достигни 100 DPS', requirement: 100, type: 'dps', points: 1, unlocked: false },
  { id: 'dps3', name: 'Магический хранитель', description: 'Достигни 1,000 DPS', requirement: 1000, type: 'dps', points: 2, unlocked: false },
  { id: 'dps4', name: 'Армия помощников', description: 'Достигни 10,000 DPS', requirement: 10000, type: 'dps', points: 3, unlocked: false },
  { id: 'dps5', name: 'Боги войны', description: 'Достигни 100,000 DPS', requirement: 100000, type: 'dps', points: 5, unlocked: false },
  // Rebirth achievements
  { id: 'reb1', name: 'Возрождение', description: 'Соверши 1 перерождение', requirement: 1, type: 'rebirth', points: 2, unlocked: false },
  { id: 'reb2', name: 'Триада', description: 'Соверши 3 перерождения', requirement: 3, type: 'rebirth', points: 2, unlocked: false },
  { id: 'reb3', name: 'Цикл пяти', description: 'Соверши 5 перерождений', requirement: 5, type: 'rebirth', points: 3, unlocked: false },
  { id: 'reb4', name: 'Десятикратный', description: 'Соверши 10 перерождений', requirement: 10, type: 'rebirth', points: 3, unlocked: false },
  { id: 'reb5', name: 'Вечный цикл', description: 'Соверши 20 перерождений', requirement: 20, type: 'rebirth', points: 4, unlocked: false },
  { id: 'reb6', name: 'Легенда забвения', description: 'Соверши 50 перерождений', requirement: 50, type: 'rebirth', points: 5, unlocked: false },
  // Click achievements
  { id: 'clk1', name: 'Маниакальный клик', description: 'Сделай 100,000 кликов', requirement: 100000, type: 'clicks', points: 2, unlocked: false },
  { id: 'clk2', name: 'Король кликов', description: 'Сделай 1,000,000 кликов', requirement: 1000000, type: 'clicks', points: 4, unlocked: false },
  // Materials achievements
  { id: 'mat1', name: 'Сборщик', description: 'Собери 1,000 материалов', requirement: 1000, type: 'materials', points: 2, unlocked: false },
  { id: 'mat2', name: 'Заготовщик', description: 'Собери 10,000 материалов', requirement: 10000, type: 'materials', points: 3, unlocked: false },
  // Special achievements
  { id: 'spc1', name: 'Элита', description: 'Достигни 10 уровня перерождения', requirement: 10, type: 'rebirth', points: 4, unlocked: false },
  { id: 'spc2', name: 'Божество', description: 'Достигни 30 уровня перерождения', requirement: 30, type: 'rebirth', points: 5, unlocked: false },
];

const initialState: GameState = {
  essence: 0,
  totalEssence: 0,
  totalClicks: 0,
  energy: 10,
  maxEnergy: 10,
  energyRegenRate: 400, // 400ms = 2.5 энергии в секунду
  baseDpc: 1,
  baseDps: 0,
  rebirthLevel: 0,
  rebirthPoints: 0,
  rebirthMultiplier: 1,
  upgrades: initialUpgrades,
  autoBuyUpgrades: {},
  abilities: initialAbilities,
  selectedAbilityId: 'ability1',
  materials: initialMaterials,
  totalMaterials: 0,
  craftedItems: {},
  achievements: initialAchievements,
  achievementPoints: 0,
  lastSaveTime: Date.now(),
  lastTickTime: Date.now(),
};

// Action Types
type GameAction =
  | { type: 'CLICK' }
  | { type: 'ADD_ESSENCE'; amount: number }
  | { type: 'TICK'; deltaTime: number }
  | { type: 'RESTORE_ENERGY' }
  | { type: 'BUY_UPGRADE'; upgradeId: string }
  | { type: 'TOGGLE_AUTO_BUY'; upgradeId: string }
  | { type: 'USE_ABILITY'; abilityId: string }
  | { type: 'UPGRADE_ABILITY_DPS'; abilityId: string }
  | { type: 'UPGRADE_ABILITY_COOLDOWN'; abilityId: string }
  | { type: 'SELECT_ABILITY'; abilityId: string }
  | { type: 'REBIRTH' }
  | { type: 'ADD_MATERIAL'; materialId: string; amount: number }
  | { type: 'CRAFT'; recipeId: string }
  | { type: 'CHECK_ACHIEVEMENTS' }
  | { type: 'LOAD_GAME'; state: GameState }
  | { type: 'RESET_GAME' };

// Helper functions
const calculateUpgradeCost = (upgrade: Upgrade): number => {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.count));
};

const calculateDpc = (state: GameState): number => {
  const upgradeDpc = state.upgrades
    .filter(u => u.type === 'dpc')
    .reduce((sum, u) => sum + u.value * u.count, 0);
  return (state.baseDpc + upgradeDpc) * state.rebirthMultiplier;
};

const calculateDps = (state: GameState): number => {
  const upgradeDps = state.upgrades
    .filter(u => u.type === 'dps')
    .reduce((sum, u) => sum + u.value * u.count, 0);
  return (state.baseDps + upgradeDps) * state.rebirthMultiplier;
};

const calculateRebirthCost = (level: number): number => {
  // Первое перерождение: 100K, потом x5 каждый уровень
  return 100000 * Math.pow(5, level);
};

const calculateRebirthPoints = (state: GameState): number => {
  // Больше очков за прогресс
  const essenceBonus = Math.floor(Math.log10(Math.max(1, state.totalEssence)) * 0.5);
  const clickBonus = Math.floor(state.totalClicks / 5000);
  const upgradeBonus = Math.floor(state.upgrades.reduce((sum, u) => sum + u.count, 0) * 0.3);
  return Math.max(1, essenceBonus + clickBonus + upgradeBonus);
};

// Веса редкости для расчёта очков крафта
export const RARITY_WEIGHTS: { [key: string]: number } = {
  common: 1,
  uncommon: 3,
  rare: 10,
  epic: 50,
  legendary: 200,
};

// Расчёт очков крафта с учётом редкости
export const calculateCraftScore = (craftedItems: { [materialId: string]: number }, materials: Material[]): number => {
  let score = 0;
  for (const [materialId, count] of Object.entries(craftedItems)) {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      const weight = RARITY_WEIGHTS[material.rarity] || 1;
      score += count * weight;
    }
  }
  return score;
};

// Reducer
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'CLICK': {
      if (state.energy < 1) return state;
      const dpc = calculateDpc(state);
      
      // Material drop chance on click (5% chance)
      let newMaterials = [...state.materials];
      let materialGain = 0;
      if (Math.random() < 0.05) {
        // Weighted random: common materials more likely
        const rand = Math.random();
        let materialIndex;
        if (rand < 0.4) materialIndex = 0; // 40% wood
        else if (rand < 0.7) materialIndex = 1; // 30% stone
        else if (rand < 0.85) materialIndex = 2; // 15% iron
        else if (rand < 0.95) materialIndex = 3; // 10% gold
        else materialIndex = 4; // 5% void essence
        
        newMaterials = newMaterials.map((m, i) => 
          i === materialIndex ? { ...m, count: m.count + 1 } : m
        );
        materialGain = 1;
      }
      
      return {
        ...state,
        essence: state.essence + dpc,
        totalEssence: state.totalEssence + dpc,
        totalClicks: state.totalClicks + 1,
        energy: state.energy - 1,
        materials: newMaterials,
        totalMaterials: state.totalMaterials + materialGain,
      };
    }

    case 'ADD_ESSENCE': {
      return {
        ...state,
        essence: state.essence + action.amount,
        totalEssence: state.totalEssence + action.amount,
      };
    }

    case 'TICK': {
      // Calculate DPS gain (only when actively playing, deltaTime is small)
      const dps = calculateDps(state);
      const dpsGain = (dps * action.deltaTime) / 1000;

      // Update ability cooldowns
      const updatedAbilities = state.abilities.map(ability => ({
        ...ability,
        currentCooldown: Math.max(0, ability.currentCooldown - action.deltaTime / 1000),
      }));

      // Random material drop (very rare, only from clicks would be better)
      let newMaterials = [...state.materials];
      let materialGain = 0;
      if (Math.random() < 0.005 * action.deltaTime / 100) {
        const materialIndex = Math.floor(Math.random() * 5); // Common materials more likely
        newMaterials = newMaterials.map((m, i) => 
          i === materialIndex ? { ...m, count: m.count + 1 } : m
        );
        materialGain = 1;
      }

      // Auto-buy upgrades
      let newEssence = state.essence + dpsGain;
      let newUpgrades = [...state.upgrades];
      let newMaxEnergy = state.maxEnergy;
      let newRegenRate = state.energyRegenRate;
      let purchased = false;

      for (let i = 0; i < newUpgrades.length; i++) {
        const upgrade = newUpgrades[i];
        if (state.autoBuyUpgrades[upgrade.id]) {
          const cost = calculateUpgradeCost(upgrade);
          if (newEssence >= cost) {
            newEssence -= cost;
            newUpgrades[i] = { ...upgrade, count: upgrade.count + 1 };
            purchased = true;
          }
        }
      }

      // Recalculate energy stats if any upgrade was purchased
      if (purchased) {
        newMaxEnergy = 10;
        newRegenRate = 400;
        newUpgrades.forEach(u => {
          if (u.type === 'energy_max') {
            newMaxEnergy += u.value * u.count;
          } else if (u.type === 'energy_regen') {
            newRegenRate -= u.value * u.count;
          }
        });
        newRegenRate = Math.max(80, newRegenRate);
      }

      return {
        ...state,
        essence: newEssence,
        totalEssence: state.totalEssence + dpsGain,
        abilities: updatedAbilities,
        materials: newMaterials,
        totalMaterials: state.totalMaterials + materialGain,
        upgrades: newUpgrades,
        maxEnergy: newMaxEnergy,
        energyRegenRate: newRegenRate,
        lastTickTime: Date.now(),
      };
    }

    case 'RESTORE_ENERGY': {
      if (state.energy >= state.maxEnergy) return state;
      return {
        ...state,
        energy: Math.min(state.maxEnergy, state.energy + 1),
      };
    }

    case 'BUY_UPGRADE': {
      const upgradeIndex = state.upgrades.findIndex(u => u.id === action.upgradeId);
      if (upgradeIndex === -1) return state;
      
      const upgrade = state.upgrades[upgradeIndex];
      const cost = calculateUpgradeCost(upgrade);
      
      if (state.essence < cost) return state;

      const newUpgrades = [...state.upgrades];
      newUpgrades[upgradeIndex] = { ...upgrade, count: upgrade.count + 1 };

      // Calculate new max energy and regen rate
      let newMaxEnergy = 10;
      let newRegenRate = 400;
      
      newUpgrades.forEach(u => {
        if (u.type === 'energy_max') {
          newMaxEnergy += u.value * u.count;
        } else if (u.type === 'energy_regen') {
          newRegenRate -= u.value * u.count;
        }
      });
      
      // Minimum regen rate is 80ms
      newRegenRate = Math.max(80, newRegenRate);

      return {
        ...state,
        essence: state.essence - cost,
        upgrades: newUpgrades,
        maxEnergy: newMaxEnergy,
        energyRegenRate: newRegenRate,
      };
    }

    case 'TOGGLE_AUTO_BUY': {
      return {
        ...state,
        autoBuyUpgrades: {
          ...state.autoBuyUpgrades,
          [action.upgradeId]: !state.autoBuyUpgrades[action.upgradeId],
        },
      };
    }

    case 'USE_ABILITY': {
      const abilityIndex = state.abilities.findIndex(a => a.id === action.abilityId);
      if (abilityIndex === -1) return state;
      
      const ability = state.abilities[abilityIndex];
      if (!ability.isUnlocked || ability.currentCooldown > 0) return state;

      // Получаем множитель DPS из текущего уровня
      const dpsMultiplier = ability.dpsMultipliers[ability.dpsLevel] || 1;
      const dpc = calculateDpc(state);
      const damage = dpc * dpsMultiplier;
      
      // Рассчитываем кулдаун с учётом улучшений
      const cooldownReduction = COOLDOWN_REDUCTIONS.slice(0, ability.cooldownLevel + 1).reduce((a, b) => a + b, 0);
      const cooldown = Math.max(ability.baseCooldown - cooldownReduction, 0.5);

      const newAbilities = [...state.abilities];
      newAbilities[abilityIndex] = { ...ability, currentCooldown: cooldown };

      return {
        ...state,
        essence: state.essence + damage,
        totalEssence: state.totalEssence + damage,
        abilities: newAbilities,
      };
    }

    case 'UPGRADE_ABILITY_DPS': {
      const abilityIndex = state.abilities.findIndex(a => a.id === action.abilityId);
      if (abilityIndex === -1) return state;
      
      const ability = state.abilities[abilityIndex];
      if (!ability.isUnlocked || ability.dpsLevel >= 5) return state;
      
      const cost = ABILITY_UPGRADE_COSTS[ability.dpsLevel]; // Стоимость следующего уровня
      if (state.rebirthPoints < cost) return state;

      const newAbilities = [...state.abilities];
      newAbilities[abilityIndex] = { ...ability, dpsLevel: ability.dpsLevel + 1 };

      return {
        ...state,
        rebirthPoints: state.rebirthPoints - cost,
        abilities: newAbilities,
      };
    }

    case 'UPGRADE_ABILITY_COOLDOWN': {
      const abilityIndex = state.abilities.findIndex(a => a.id === action.abilityId);
      if (abilityIndex === -1) return state;
      
      const ability = state.abilities[abilityIndex];
      if (!ability.isUnlocked || ability.cooldownLevel >= 5) return state;
      
      const cost = ABILITY_UPGRADE_COSTS[ability.cooldownLevel]; // Стоимость следующего уровня
      if (state.rebirthPoints < cost) return state;

      const newAbilities = [...state.abilities];
      newAbilities[abilityIndex] = { ...ability, cooldownLevel: ability.cooldownLevel + 1 };

      return {
        ...state,
        rebirthPoints: state.rebirthPoints - cost,
        abilities: newAbilities,
      };
    }

    case 'SELECT_ABILITY': {
      return {
        ...state,
        selectedAbilityId: action.abilityId,
      };
    }

    case 'REBIRTH': {
      const cost = calculateRebirthCost(state.rebirthLevel);
      if (state.essence < cost) return state;

      const pointsGained = calculateRebirthPoints(state);
      const newRebirthLevel = state.rebirthLevel + 1;
      const newMultiplier = 1 + (newRebirthLevel * 0.5);

      // Unlock abilities based on rebirth level
      const newAbilities = state.abilities.map(ability => ({
        ...ability,
        isUnlocked: ability.requiredRebirthLevel <= newRebirthLevel,
        currentCooldown: 0,
      }));

      // Reset upgrades
      const resetUpgrades = state.upgrades.map(u => ({ ...u, count: 0 }));

      return {
        ...state,
        essence: 0,
        totalEssence: 0,
        totalClicks: 0,
        energy: 10, // Reset to initial
        maxEnergy: 10, // Reset to initial
        energyRegenRate: 400, // Reset to initial
        upgrades: resetUpgrades,
        abilities: newAbilities,
        rebirthLevel: newRebirthLevel,
        rebirthPoints: state.rebirthPoints + pointsGained,
        rebirthMultiplier: newMultiplier,
      };
    }

    case 'ADD_MATERIAL': {
      const materialIndex = state.materials.findIndex(m => m.id === action.materialId);
      if (materialIndex === -1) return state;

      const newMaterials = [...state.materials];
      newMaterials[materialIndex] = {
        ...newMaterials[materialIndex],
        count: newMaterials[materialIndex].count + action.amount,
      };

      return {
        ...state,
        materials: newMaterials,
        totalMaterials: state.totalMaterials + action.amount,
      };
    }

    case 'CRAFT': {
      const recipe = craftRecipes.find(r => r.id === action.recipeId);
      if (!recipe) return state;

      // Check energy
      if (state.energy < recipe.energyCost) return state;

      // Check if player has all required materials
      const hasAllMaterials = recipe.materials.every(req => {
        const material = state.materials.find(m => m.id === req.materialId);
        return material && material.count >= req.count;
      });

      if (!hasAllMaterials) return state;

      // Subtract materials and add result
      let newMaterials = [...state.materials];
      
      // Remove required materials
      recipe.materials.forEach(req => {
        const index = newMaterials.findIndex(m => m.id === req.materialId);
        if (index !== -1) {
          newMaterials[index] = {
            ...newMaterials[index],
            count: newMaterials[index].count - req.count,
          };
        }
      });

      // Add result
      const resultIndex = newMaterials.findIndex(m => m.id === recipe.result.materialId);
      if (resultIndex !== -1) {
        newMaterials[resultIndex] = {
          ...newMaterials[resultIndex],
          count: newMaterials[resultIndex].count + recipe.result.count,
        };
      }

      // Track crafted items
      const newCraftedItems = { ...state.craftedItems };
      const resultMaterialId = recipe.result.materialId;
      newCraftedItems[resultMaterialId] = (newCraftedItems[resultMaterialId] || 0) + recipe.result.count;

      return {
        ...state,
        materials: newMaterials,
        craftedItems: newCraftedItems,
        energy: state.energy - recipe.energyCost,
        totalMaterials: state.totalMaterials + recipe.result.count,
      };
    }

    case 'CHECK_ACHIEVEMENTS': {
      const dpc = calculateDpc(state);
      const dps = calculateDps(state);
      let pointsGained = 0;

      const newAchievements = state.achievements.map(achievement => {
        if (achievement.unlocked) return achievement;

        let value = 0;
        switch (achievement.type) {
          case 'essence': value = state.totalEssence; break;
          case 'dpc': value = dpc; break;
          case 'dps': value = dps; break;
          case 'rebirth': value = state.rebirthLevel; break;
          case 'clicks': value = state.totalClicks; break;
          case 'materials': value = state.totalMaterials; break;
        }

        if (value >= achievement.requirement) {
          pointsGained += achievement.points;
          return { ...achievement, unlocked: true };
        }
        return achievement;
      });

      return {
        ...state,
        achievements: newAchievements,
        achievementPoints: state.achievementPoints + pointsGained,
      };
    }

    case 'LOAD_GAME': {
      // Merge abilities with new structure (for migration from old saves)
      const migratedAbilities = initialAbilities.map(initialAbility => {
        const savedAbility = action.state.abilities?.find(a => a.id === initialAbility.id);
        if (savedAbility && savedAbility.dpsMultipliers) {
          // New format - use saved data
          return savedAbility;
        } else if (savedAbility) {
          // Old format - migrate to new structure, keep unlocked status
          return {
            ...initialAbility,
            isUnlocked: savedAbility.isUnlocked || false,
          };
        }
        // No saved data - use initial
        return initialAbility;
      });

      // Merge upgrades - keep count from save, but use new descriptions/values from initial
      const migratedUpgrades = initialUpgrades.map(initialUpgrade => {
        const savedUpgrade = action.state.upgrades?.find(u => u.id === initialUpgrade.id);
        if (savedUpgrade) {
          return {
            ...initialUpgrade, // Use new description, value, baseCost, etc
            count: savedUpgrade.count, // Keep player's progress
          };
        }
        return initialUpgrade;
      });

      // Recalculate energy stats based on migrated upgrades
      let newMaxEnergy = 10;
      let newRegenRate = 400;
      migratedUpgrades.forEach(u => {
        if (u.type === 'energy_max') {
          newMaxEnergy += u.value * u.count;
        } else if (u.type === 'energy_regen') {
          newRegenRate -= u.value * u.count;
        }
      });
      newRegenRate = Math.max(80, newRegenRate);

      return {
        ...action.state,
        abilities: migratedAbilities,
        upgrades: migratedUpgrades,
        maxEnergy: newMaxEnergy,
        energyRegenRate: newRegenRate,
        craftedItems: action.state.craftedItems || {},
        lastTickTime: Date.now(),
      };
    }

    case 'RESET_GAME': {
      return { ...initialState, lastTickTime: Date.now() };
    }

    default:
      return state;
  }
};

// Context
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  getDpc: () => number;
  getDps: () => number;
  getUpgradeCost: (upgradeId: string) => number;
  getRebirthCost: () => number;
  getRebirthPointsPreview: () => number;
  formatNumber: (num: number) => string;
  getStateForCloudSave: () => GameState;
  loadFromCloud: (cloudState: GameState) => void;
  canCraft: (recipeId: string) => boolean;
  craftItem: (recipeId: string) => void;
}

const GameContext = createContext<GameContextType | null>(null);

// Provider
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load game on mount (local storage first)
  useEffect(() => {
    const savedGame = localStorage.getItem('voidClickerSave');
    if (savedGame) {
      try {
        const parsed = JSON.parse(savedGame);
        dispatch({ type: 'LOAD_GAME', state: { ...initialState, ...parsed } });
      } catch (e) {
        console.error('Failed to load save:', e);
      }
    }
  }, []);

  // Auto-save every 5 seconds (local)
  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem('voidClickerSave', JSON.stringify(state));
    }, 5000);
    return () => clearInterval(saveInterval);
  }, [state]);

  // Cloud save functions
  const getStateForCloudSave = useCallback(() => {
    return { ...state, lastSaveTime: Date.now() };
  }, [state]);

  const loadFromCloud = useCallback((cloudState: GameState) => {
    // Calculate offline progress - НЕТ ФАРМА, только восстанавливаем состояние
    const now = Date.now();
    const lastSave = cloudState.lastSaveTime || now;
    const offlineTimeMs = Math.max(0, now - lastSave);
    const offlineTimeSec = offlineTimeMs / 1000;
    
    console.log(`⏰ Offline time: ${Math.floor(offlineTimeSec / 60)} minutes`);
    console.log(`� Loading saved state (no offline farming)`);
    
    dispatch({ 
      type: 'LOAD_GAME', 
      state: { 
        ...initialState, 
        ...cloudState, 
        lastSaveTime: now 
      } 
    });
  }, []);

  // Game tick (100ms)
  useEffect(() => {
    const tickInterval = setInterval(() => {
      dispatch({ type: 'TICK', deltaTime: 100 });
      dispatch({ type: 'CHECK_ACHIEVEMENTS' });
    }, 100);
    return () => clearInterval(tickInterval);
  }, []);

  // Energy restore (dynamic based on energyRegenRate)
  useEffect(() => {
    const energyInterval = setInterval(() => {
      dispatch({ type: 'RESTORE_ENERGY' });
    }, state.energyRegenRate);
    return () => clearInterval(energyInterval);
  }, [state.energyRegenRate]);

  const getDpc = useCallback(() => calculateDpc(state), [state]);
  const getDps = useCallback(() => calculateDps(state), [state]);
  
  const getUpgradeCost = useCallback((upgradeId: string) => {
    const upgrade = state.upgrades.find(u => u.id === upgradeId);
    return upgrade ? calculateUpgradeCost(upgrade) : 0;
  }, [state.upgrades]);

  const getRebirthCost = useCallback(() => calculateRebirthCost(state.rebirthLevel), [state.rebirthLevel]);
  const getRebirthPointsPreview = useCallback(() => calculateRebirthPoints(state), [state]);

  const formatNumber = useCallback((num: number): string => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Math.floor(num).toString();
  }, []);

  const canCraft = useCallback((recipeId: string): boolean => {
    const recipe = craftRecipes.find(r => r.id === recipeId);
    if (!recipe) return false;
    
    if (state.energy < recipe.energyCost) return false;
    
    return recipe.materials.every(req => {
      const material = state.materials.find(m => m.id === req.materialId);
      return material && material.count >= req.count;
    });
  }, [state.energy, state.materials]);

  const craftItem = useCallback((recipeId: string) => {
    dispatch({ type: 'CRAFT', recipeId });
  }, []);

  return (
    <GameContext.Provider value={{
      state,
      dispatch,
      getDpc,
      getDps,
      getUpgradeCost,
      getRebirthCost,
      getRebirthPointsPreview,
      formatNumber,
      getStateForCloudSave,
      loadFromCloud,
      canCraft,
      craftItem,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
