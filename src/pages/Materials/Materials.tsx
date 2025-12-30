import { useState } from 'react';
import { useGame, craftRecipes } from '../../context/GameContext';
import './Materials.css';

const Materials = () => {
  const { state, formatNumber, canCraft, craftItem } = useGame();
  const [activeTab, setActiveTab] = useState<'materials' | 'craft'>('materials');

  const rarityColors: Record<string, string> = {
    common: '#aaaaaa',
    uncommon: '#9945FF',
    rare: '#5555ff',
    epic: '#aa55ff',
    legendary: '#ffaa00',
  };

  const rarityNames: Record<string, string> = {
    common: 'Обычный',
    uncommon: 'Необычный',
    rare: 'Редкий',
    epic: 'Эпический',
    legendary: 'Легендарный',
  };

  const materialIcons: Record<string, string> = {
    wood: '🪵',
    stone: '🪨',
    iron: '⚙️',
    gold: '🥇',
    diamond: '💎',
    voidEssence: '🌑',
    emerald: '💚',
    ruby: '❤️',
    obsidian: '⬛',
    starShard: '⭐',
    core: '🔮',
    woodBlock: '🧱',
    stoneBrick: '🧱',
    ironIngot: '🔩',
    goldIngot: '🪙',
    diamondShard: '💠',
    voidCrystal: '🔮',
    starFragment: '✨',
    voidCore: '🌀',
  };

  const getMaterialName = (materialId: string): string => {
    const material = state.materials.find(m => m.id === materialId);
    return material?.name || materialId;
  };

  const getMaterialCount = (materialId: string): number => {
    const material = state.materials.find(m => m.id === materialId);
    return material?.count || 0;
  };

  const handleCraft = (recipeId: string) => {
    if (canCraft(recipeId)) {
      craftItem(recipeId);
    }
  };

  return (
    <div className="materials-page">
      <div className="container">
        <div className="materials-header">
          <h1>Материалы и Крафт</h1>
          <div className="materials-stats">
            <div className="stat-item">
              <span className="stat-label">Всего собрано:</span>
              <span className="stat-value">{formatNumber(state.totalMaterials)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Энергия:</span>
              <span className="stat-value">{Math.floor(state.energy)} / {state.maxEnergy}</span>
            </div>
          </div>
        </div>

        <div className="materials-tabs">
          <button 
            className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
            onClick={() => setActiveTab('materials')}
          >
            📦 Инвентарь
          </button>
          <button 
            className={`tab-btn ${activeTab === 'craft' ? 'active' : ''}`}
            onClick={() => setActiveTab('craft')}
          >
            🔨 Крафт
          </button>
        </div>

        {activeTab === 'materials' && (
          <div className="materials-grid">
            {state.materials.filter(m => m.count > 0 || ['wood', 'stone', 'iron', 'gold', 'diamond', 'emerald', 'ruby', 'obsidian', 'voidEssence', 'starShard', 'core'].includes(m.id)).map(material => (
              <div 
                key={material.id} 
                className={`material-card ${material.count === 0 ? 'empty' : ''}`}
                style={{ borderColor: rarityColors[material.rarity] }}
              >
                <div className="material-icon">
                  {materialIcons[material.id] || '📦'}
                </div>
                <div className="material-info">
                  <span 
                    className="material-name"
                    style={{ color: rarityColors[material.rarity] }}
                  >
                    {material.name}
                  </span>
                  <span className="material-rarity">
                    {rarityNames[material.rarity]}
                  </span>
                </div>
                <div className="material-count">
                  {formatNumber(material.count)}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'craft' && (
          <div className="crafting-section">
            <div className="recipes-grid">
              {craftRecipes.map(recipe => {
                const canCraftThis = canCraft(recipe.id);
                const resultMaterial = state.materials.find(m => m.id === recipe.result.materialId);
                
                return (
                  <div 
                    key={recipe.id} 
                    className={`recipe-card ${canCraftThis ? 'available' : 'unavailable'}`}
                  >
                    <div className="recipe-header">
                      <span className="recipe-name">{recipe.name}</span>
                      <span className="recipe-energy">⚡ {recipe.energyCost}</span>
                    </div>
                    
                    <p className="recipe-description">{recipe.description}</p>
                    
                    <div className="recipe-content">
                      <div className="recipe-materials">
                        {recipe.materials.map((req, index) => {
                          const hasEnough = getMaterialCount(req.materialId) >= req.count;
                          return (
                            <div 
                              key={index} 
                              className={`recipe-material ${hasEnough ? 'has-enough' : 'not-enough'}`}
                            >
                              <span className="material-emoji">{materialIcons[req.materialId] || '📦'}</span>
                              <span className="material-req">
                                {getMaterialCount(req.materialId)}/{req.count}
                              </span>
                              <span className="material-name-small">{getMaterialName(req.materialId)}</span>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="recipe-arrow">→</div>
                      
                      <div className="recipe-result">
                        <span className="result-emoji">{materialIcons[recipe.result.materialId] || '�'}</span>
                        <span className="result-count">×{recipe.result.count}</span>
                        <span 
                          className="result-name"
                          style={{ color: rarityColors[resultMaterial?.rarity || 'common'] }}
                        >
                          {getMaterialName(recipe.result.materialId)}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      className={`craft-btn ${canCraftThis ? '' : 'disabled'}`}
                      onClick={() => handleCraft(recipe.id)}
                      disabled={!canCraftThis}
                    >
                      {canCraftThis ? '🔨 Создать' : '❌ Недостаточно'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Materials;
