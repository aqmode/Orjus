import { useState, useEffect, useRef } from 'react';
import { useGame, ABILITY_UPGRADE_COSTS, COOLDOWN_REDUCTIONS } from '../../context/GameContext';
import CloudSave, { useManualSave } from '../../components/CloudSave/CloudSave';
import MaterialDrop from '../../components/MaterialDrop';
import './Game.css';

interface MaterialDropData {
  id: string;
  materialName: string;
  materialEmoji: string;
  iconName: string;
  x: number;
  y: number;
}

const Game = () => {
  const { state, dispatch, getDpc, getDps, formatNumber, getUpgradeCost, getRebirthCost, getRebirthPointsPreview } = useGame();
  const { manualSave, canSave } = useManualSave();
  
  // Save button state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // Material drops animation
  const [materialDrops, setMaterialDrops] = useState<MaterialDropData[]>([]);
  const clickButtonRef = useRef<HTMLButtonElement>(null);
  
  // CPS (Clicks Per Second) tracking
  const [cps, setCps] = useState(0);
  const clickTimestamps = useRef<number[]>([]);
  // Track material count to detect new drops
  const prevMaterialsRef = useRef(state.totalMaterials);

  // Anti-autoclicker
  const [showAutoclickerWarning, setShowAutoclickerWarning] = useState(false);
  const [warningTimer, setWarningTimer] = useState(5);
  const cpsHistory = useRef<number[]>([]);
  const suspiciousStartTime = useRef<number | null>(null);

  // Material icon mapping (matches GameContext material IDs)
  const materialIconMap: { [key: string]: { emoji: string; iconName: string } } = {
    wood: { emoji: '🪵', iconName: 'material-wood' },
    stone: { emoji: '🪨', iconName: 'material-stone' },
    iron: { emoji: '⚙️', iconName: 'material-iron' },
    gold: { emoji: '🏆', iconName: 'material-gold' },
    diamond: { emoji: '💎', iconName: 'material-diamond' },
    voidEssence: { emoji: '🌑', iconName: 'material-void-essence' },
    emerald: { emoji: '�', iconName: 'material-emerald' },
    ruby: { emoji: '❤️', iconName: 'material-ruby' },
    obsidian: { emoji: '⬛', iconName: 'material-obsidian' },
    starShard: { emoji: '⭐', iconName: 'material-star-shard' },
    core: { emoji: '�', iconName: 'material-core' },
    woodBlock: { emoji: '🟫', iconName: 'material-wood-block' },
    stoneBrick: { emoji: '⬜', iconName: 'material-stone-brick' },
    ironIngot: { emoji: '🔩', iconName: 'material-iron-ingot' },
    goldIngot: { emoji: '🥇', iconName: 'material-gold-ingot' },
    diamondShard: { emoji: '�', iconName: 'material-diamond-shard' },
    voidCrystal: { emoji: '🔮', iconName: 'material-void-crystal' },
    starFragment: { emoji: '✨', iconName: 'material-star-fragment' },
    voidCore: { emoji: '⚫', iconName: 'material-void-core' },
  };

  // Detect material drops
  useEffect(() => {
    if (state.totalMaterials > prevMaterialsRef.current) {
      console.log('🎁 Material dropped! Total:', state.totalMaterials);
      
      // Find which material increased
      const droppedMaterial = state.materials.find((mat, idx) => {
        const prevCount = prevMaterialsRef.current > 0 ? state.materials[idx].count - 1 : 0;
        return mat.count > prevCount;
      });

      if (droppedMaterial && clickButtonRef.current) {
        const rect = clickButtonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const iconData = materialIconMap[droppedMaterial.id] || { 
          emoji: '💎', 
          iconName: `material-${droppedMaterial.id}` 
        };

        console.log('✨ Creating animation at', centerX, centerY, 'for', droppedMaterial.name);

        setMaterialDrops(prev => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            materialName: droppedMaterial.name,
            materialEmoji: iconData.emoji,
            iconName: iconData.iconName,
            x: centerX,
            y: centerY,
          }
        ]);
      }
    }
    prevMaterialsRef.current = state.totalMaterials;
  }, [state.totalMaterials, state.materials]);

  const removeMaterialDrop = (id: string) => {
    setMaterialDrops(prev => prev.filter(drop => drop.id !== id));
  };

  // Calculate CPS every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Keep only clicks from last second
      clickTimestamps.current = clickTimestamps.current.filter(t => now - t < 1000);
      const currentCps = clickTimestamps.current.length;
      setCps(currentCps);
      
      // Anti-autoclicker detection
      if (currentCps >= 9 && currentCps <= 11) {
        // Track CPS history for suspicious pattern detection
        cpsHistory.current.push(currentCps);
        // Keep last 150 entries (15 seconds at 100ms intervals)
        if (cpsHistory.current.length > 150) {
          cpsHistory.current.shift();
        }
        
        // Check if CPS has been constant (9-11) for 15 seconds
        if (cpsHistory.current.length >= 150) {
          const allSuspicious = cpsHistory.current.every(c => c >= 9 && c <= 11);
          const isConstant = cpsHistory.current.every(c => c === cpsHistory.current[0]);
          
          if (allSuspicious && isConstant && !showAutoclickerWarning) {
            setShowAutoclickerWarning(true);
            setWarningTimer(5);
            cpsHistory.current = []; // Reset history
          }
        }
      } else {
        // Reset tracking if CPS is outside suspicious range
        cpsHistory.current = [];
        suspiciousStartTime.current = null;
      }
    }, 100);
    return () => clearInterval(interval);
  }, [showAutoclickerWarning]);

  // Warning timer countdown
  useEffect(() => {
    if (showAutoclickerWarning && warningTimer > 0) {
      const timer = setTimeout(() => {
        setWarningTimer(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showAutoclickerWarning, warningTimer]);

  const closeAutoclickerWarning = () => {
    if (warningTimer <= 0) {
      setShowAutoclickerWarning(false);
      setWarningTimer(5);
    }
  };

  const handleClick = () => {
    clickTimestamps.current.push(Date.now());
    dispatch({ type: 'CLICK' });
  };

  const handleBuyUpgrade = (upgradeId: string) => {
    dispatch({ type: 'BUY_UPGRADE', upgradeId });
  };

  const handleToggleAutoBuy = (upgradeId: string) => {
    dispatch({ type: 'TOGGLE_AUTO_BUY', upgradeId });
  };

  const handleRebirth = () => {
    if (window.confirm('Вы уверены, что хотите переродиться? Все апгрейды и эссенция будут сброшены, но вы получите очки перерождения и бонус к урону!')) {
      dispatch({ type: 'REBIRTH' });
    }
  };

  const handleManualSave = async () => {
    setSaveStatus('saving');
    const result = await manualSave();
    if (result.success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const dpc = getDpc();
  const dps = getDps();
  const rebirthCost = getRebirthCost();
  const canRebirth = state.essence >= rebirthCost;

  const dpcUpgrades = state.upgrades.filter(u => u.type === 'dpc');
  const dpsUpgrades = state.upgrades.filter(u => u.type === 'dps');
  const energyMaxUpgrades = state.upgrades.filter(u => u.type === 'energy_max');
  const energyRegenUpgrades = state.upgrades.filter(u => u.type === 'energy_regen');

  return (
    <div className="game-page">
      {/* Anti-Autoclicker Warning Modal */}
      {showAutoclickerWarning && (
        <div className="autoclicker-modal-overlay">
          <div className="autoclicker-modal">
            <div className="autoclicker-icon">🚫</div>
            <h2>Обнаружен автокликер!</h2>
            <p>Пожалуйста, отключите автокликер для честной игры.</p>
            <p className="autoclicker-subtext">Использование автокликера нарушает правила игры и портит удовольствие от игрового процесса.</p>
            <button 
              className={`autoclicker-close-btn ${warningTimer > 0 ? 'disabled' : ''}`}
              onClick={closeAutoclickerWarning}
              disabled={warningTimer > 0}
            >
              {warningTimer > 0 ? `Подождите ${warningTimer} сек...` : 'Закрыть'}
            </button>
          </div>
        </div>
      )}

      {/* Cloud Save */}
      <CloudSave />
      
      {/* Stats Panel */}
      <div className="stats-panel">
        <div className="stat-item main-stat">
          <span className="stat-label">Эссенция</span>
          <span className="stat-value text-gold">{formatNumber(state.essence)}</span>
        </div>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">DPC</span>
            <span className="stat-value text-green">{formatNumber(dpc)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">DPS</span>
            <span className="stat-value text-cyan">{formatNumber(dps)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">CPS</span>
            <span className="stat-value text-yellow">{cps}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Энергия</span>
            <span className="stat-value">{state.energy}/{state.maxEnergy}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Множитель</span>
            <span className="stat-value text-purple">x{state.rebirthMultiplier.toFixed(1)}</span>
          </div>
        </div>
        
        {/* Manual Save Button */}
        {canSave && (
          <button 
            className={`manual-save-btn ${saveStatus}`}
            onClick={handleManualSave}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' && '💾 Сохранение...'}
            {saveStatus === 'success' && '✅ Сохранено!'}
            {saveStatus === 'error' && '❌ Ошибка!'}
            {saveStatus === 'idle' && '💾 Сохранить прогресс'}
          </button>
        )}
      </div>

      <div className="game-content">
        {/* Main Click Area */}
        <div className="click-section">
          <div className="clicker-container">
            <button 
              ref={clickButtonRef}
              className={`click-button ${state.energy > 0 ? 'active' : 'disabled'}`}
              onClick={handleClick}
              disabled={state.energy < 1}
            >
              <span className="click-icon">⚔️</span>
              <span className="click-text">КЛИК</span>
              <span className="click-damage">+{formatNumber(dpc)}</span>
            </button>
            <div className="energy-bar">
              <div 
                className="energy-fill" 
                style={{ width: `${(state.energy / state.maxEnergy) * 100}%` }}
              />
              <span className="energy-text">{state.energy}/{state.maxEnergy}</span>
            </div>
          </div>

        </div>

        {/* Abilities Section */}
        <div className="abilities-section">
          <h3>⚡ Способности <span className="abilities-rp">RP: {state.rebirthPoints}</span></h3>
          <div className="abilities-grid">
            {state.abilities.map(ability => {
              // Safety checks for migration
              if (!ability.dpsMultipliers) return null;
              
              const isLocked = !ability.isUnlocked;
              const isOnCooldown = ability.currentCooldown > 0;
              const currentDpsMultiplier = ability.dpsMultipliers[ability.dpsLevel] || 1;
              const nextDpsMultiplier = ability.dpsLevel < 5 ? ability.dpsMultipliers[ability.dpsLevel + 1] : null;
              const dpsUpgradeCost = ability.dpsLevel < 5 ? ABILITY_UPGRADE_COSTS[ability.dpsLevel] : null;
              
              const currentCooldown = ability.baseCooldown - COOLDOWN_REDUCTIONS.slice(0, ability.cooldownLevel + 1).reduce((a, b) => a + b, 0);
              const nextCooldownReduction = ability.cooldownLevel < 5 ? COOLDOWN_REDUCTIONS[ability.cooldownLevel + 1] : null;
              const cooldownUpgradeCost = ability.cooldownLevel < 5 ? ABILITY_UPGRADE_COSTS[ability.cooldownLevel] : null;
              
              const canUpgradeDps = !isLocked && ability.dpsLevel < 5 && state.rebirthPoints >= (dpsUpgradeCost || 0);
              const canUpgradeCooldown = !isLocked && ability.cooldownLevel < 5 && state.rebirthPoints >= (cooldownUpgradeCost || 0);
              
              return (
                <div key={ability.id} className={`ability-card ${isLocked ? 'locked' : ''} ${isOnCooldown ? 'on-cooldown' : ''}`}>
                  <div className="ability-header">
                    <span className="ability-icon">{ability.icon}</span>
                    <span className="ability-name">{ability.name}</span>
                  </div>
                  
                  {isLocked ? (
                    <div className="ability-locked">
                      <span className="lock-icon">🔒</span>
                      <span className="unlock-req">Перерождение {ability.requiredRebirthLevel}</span>
                    </div>
                  ) : (
                    <>
                      <button 
                        className={`ability-use-btn ${isOnCooldown ? 'disabled' : ''}`}
                        onClick={() => dispatch({ type: 'USE_ABILITY', abilityId: ability.id })}
                        disabled={isOnCooldown}
                      >
                        {isOnCooldown 
                          ? `⏱️ ${ability.currentCooldown.toFixed(1)}с` 
                          : `⚔️ Использовать (x${currentDpsMultiplier})`
                        }
                      </button>
                      
                      <div className="ability-upgrades">
                        {/* DPS Upgrade */}
                        <div className="ability-upgrade-row">
                          <span className="upgrade-label">
                            Урон: x{currentDpsMultiplier}
                            {nextDpsMultiplier && <span className="next-value"> → x{nextDpsMultiplier}</span>}
                          </span>
                          {dpsUpgradeCost !== null ? (
                            <button 
                              className={`ability-upgrade-btn ${canUpgradeDps ? 'affordable' : ''}`}
                              onClick={() => dispatch({ type: 'UPGRADE_ABILITY_DPS', abilityId: ability.id })}
                              disabled={!canUpgradeDps}
                            >
                              {dpsUpgradeCost} RP
                            </button>
                          ) : (
                            <span className="maxed">MAX</span>
                          )}
                        </div>
                        
                        {/* Cooldown Upgrade */}
                        <div className="ability-upgrade-row">
                          <span className="upgrade-label">
                            КД: {currentCooldown.toFixed(1)}с
                            {nextCooldownReduction && <span className="next-value"> → -{nextCooldownReduction}с</span>}
                          </span>
                          {cooldownUpgradeCost !== null ? (
                            <button 
                              className={`ability-upgrade-btn ${canUpgradeCooldown ? 'affordable' : ''}`}
                              onClick={() => dispatch({ type: 'UPGRADE_ABILITY_COOLDOWN', abilityId: ability.id })}
                              disabled={!canUpgradeCooldown}
                            >
                              {cooldownUpgradeCost} RP
                            </button>
                          ) : (
                            <span className="maxed">MAX</span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upgrades Section */}
        <div className="upgrades-section">
          <div className="upgrades-column">
            <h3>Урон за клик (DPC)</h3>
            <div className="upgrades-list">
              {dpcUpgrades.map(upgrade => {
                const cost = getUpgradeCost(upgrade.id);
                const canAfford = state.essence >= cost;
                const isAutoBuy = state.autoBuyUpgrades[upgrade.id] || false;
                return (
                  <div key={upgrade.id} className={`upgrade-card ${canAfford ? 'affordable' : ''} ${isAutoBuy ? 'auto-buy-active' : ''}`}>
                    <div className="upgrade-info">
                      <span className="upgrade-name">{upgrade.name}</span>
                      <span className="upgrade-desc">{upgrade.description}</span>
                      <span className="upgrade-count">Куплено: {upgrade.count}</span>
                    </div>
                    <div className="upgrade-actions">
                      <label className="auto-buy-toggle" title="Автопокупка">
                        <input 
                          type="checkbox" 
                          checked={isAutoBuy}
                          onChange={() => handleToggleAutoBuy(upgrade.id)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label">Авто</span>
                      </label>
                      <button 
                        className="upgrade-buy-btn"
                        onClick={() => handleBuyUpgrade(upgrade.id)}
                        disabled={!canAfford}
                      >
                        {formatNumber(cost)} ✦
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="upgrades-column">
            <h3>Урон в секунду (DPS)</h3>
            <div className="upgrades-list">
              {dpsUpgrades.map(upgrade => {
                const cost = getUpgradeCost(upgrade.id);
                const canAfford = state.essence >= cost;
                const isAutoBuy = state.autoBuyUpgrades[upgrade.id] || false;
                return (
                  <div key={upgrade.id} className={`upgrade-card ${canAfford ? 'affordable' : ''} ${isAutoBuy ? 'auto-buy-active' : ''}`}>
                    <div className="upgrade-info">
                      <span className="upgrade-name">{upgrade.name}</span>
                      <span className="upgrade-desc">{upgrade.description}</span>
                      <span className="upgrade-count">Куплено: {upgrade.count}</span>
                    </div>
                    <div className="upgrade-actions">
                      <label className="auto-buy-toggle" title="Автопокупка">
                        <input 
                          type="checkbox" 
                          checked={isAutoBuy}
                          onChange={() => handleToggleAutoBuy(upgrade.id)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label">Авто</span>
                      </label>
                      <button 
                        className="upgrade-buy-btn"
                        onClick={() => handleBuyUpgrade(upgrade.id)}
                        disabled={!canAfford}
                      >
                        {formatNumber(cost)} ✦
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Energy Upgrades Section */}
        <div className="upgrades-section energy-upgrades">
          <div className="upgrades-column">
            <h3>🔋 Макс. энергия (Текущий: {state.maxEnergy})</h3>
            <div className="upgrades-list">
              {energyMaxUpgrades.map(upgrade => {
                const cost = getUpgradeCost(upgrade.id);
                const canAfford = state.essence >= cost;
                const isAutoBuy = state.autoBuyUpgrades[upgrade.id] || false;
                return (
                  <div key={upgrade.id} className={`upgrade-card ${canAfford ? 'affordable' : ''} ${isAutoBuy ? 'auto-buy-active' : ''}`}>
                    <div className="upgrade-info">
                      <span className="upgrade-name">{upgrade.name}</span>
                      <span className="upgrade-desc">{upgrade.description}</span>
                      <span className="upgrade-count">Куплено: {upgrade.count}</span>
                    </div>
                    <div className="upgrade-actions">
                      <label className="auto-buy-toggle" title="Автопокупка">
                        <input 
                          type="checkbox" 
                          checked={isAutoBuy}
                          onChange={() => handleToggleAutoBuy(upgrade.id)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label">Авто</span>
                      </label>
                      <button 
                        className="upgrade-buy-btn"
                        onClick={() => handleBuyUpgrade(upgrade.id)}
                        disabled={!canAfford}
                      >
                        {formatNumber(cost)} ✦
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="upgrades-column">
            <h3>⚡ Скорость регенерации ({state.energyRegenRate}мс)</h3>
            <div className="upgrades-list">
              {energyRegenUpgrades.map(upgrade => {
                const cost = getUpgradeCost(upgrade.id);
                const canAfford = state.essence >= cost;
                const isAutoBuy = state.autoBuyUpgrades[upgrade.id] || false;
                return (
                  <div key={upgrade.id} className={`upgrade-card ${canAfford ? 'affordable' : ''} ${isAutoBuy ? 'auto-buy-active' : ''}`}>
                    <div className="upgrade-info">
                      <span className="upgrade-name">{upgrade.name}</span>
                      <span className="upgrade-desc">{upgrade.description}</span>
                      <span className="upgrade-count">Куплено: {upgrade.count}</span>
                    </div>
                    <div className="upgrade-actions">
                      <label className="auto-buy-toggle" title="Автопокупка">
                        <input 
                          type="checkbox" 
                          checked={isAutoBuy}
                          onChange={() => handleToggleAutoBuy(upgrade.id)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label">Авто</span>
                      </label>
                      <button 
                        className="upgrade-buy-btn"
                        onClick={() => handleBuyUpgrade(upgrade.id)}
                        disabled={!canAfford}
                      >
                        {formatNumber(cost)} ✦
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rebirth Section */}
        <div className="rebirth-section">
          <h3>Перерождение</h3>
          <div className="rebirth-card">
            <div className="rebirth-stats">
              <div className="rebirth-stat">
                <span className="label">Уровень перерождения</span>
                <span className="value text-purple">{state.rebirthLevel}</span>
              </div>
              <div className="rebirth-stat">
                <span className="label">Очки перерождения</span>
                <span className="value text-gold">{state.rebirthPoints}</span>
              </div>
              <div className="rebirth-stat">
                <span className="label">Множитель урона</span>
                <span className="value text-green">x{state.rebirthMultiplier.toFixed(1)}</span>
              </div>
            </div>
            <div className="rebirth-info">
              <p>Стоимость перерождения: <span className="text-gold">{formatNumber(rebirthCost)}</span> эссенций</p>
              <p>Вы получите: <span className="text-purple">+{getRebirthPointsPreview()}</span> очков перерождения</p>
              <p>Новый множитель: <span className="text-green">x{(state.rebirthMultiplier + 0.5).toFixed(1)}</span></p>
            </div>
            <button 
              className={`rebirth-btn ${canRebirth ? 'ready' : ''}`}
              onClick={handleRebirth}
              disabled={!canRebirth}
            >
              {canRebirth ? '🔄 ПЕРЕРОДИТЬСЯ' : `Нужно ${formatNumber(rebirthCost)} эссенций`}
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="summary-section">
          <h3>Статистика</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Всего эссенций</span>
              <span className="value">{formatNumber(state.totalEssence)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Всего кликов</span>
              <span className="value">{formatNumber(state.totalClicks)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Всего материалов</span>
              <span className="value">{formatNumber(state.totalMaterials)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Очки достижений</span>
              <span className="value">{state.achievementPoints}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Material Drop Animations */}
      {materialDrops.map(drop => (
        <MaterialDrop
          key={drop.id}
          materialName={drop.materialName}
          materialEmoji={drop.materialEmoji}
          iconName={drop.iconName}
          x={drop.x}
          y={drop.y}
          onComplete={() => removeMaterialDrop(drop.id)}
        />
      ))}
    </div>
  );
};

export default Game;
