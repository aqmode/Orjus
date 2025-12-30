import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import CloudSave, { useManualSave } from '../../components/CloudSave/CloudSave';
import './Game.css';

const Game = () => {
  const { state, dispatch, getDpc, getDps, formatNumber, getUpgradeCost, getRebirthCost, getRebirthPointsPreview } = useGame();
  const { manualSave, canSave } = useManualSave();
  
  // Save button state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // CPS (Clicks Per Second) tracking
  const [cps, setCps] = useState(0);
  const clickTimestamps = useRef<number[]>([]);

  // Calculate CPS every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Keep only clicks from last second
      clickTimestamps.current = clickTimestamps.current.filter(t => now - t < 1000);
      setCps(clickTimestamps.current.length);
    }, 100);
    return () => clearInterval(interval);
  }, []);

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
    </div>
  );
};

export default Game;
