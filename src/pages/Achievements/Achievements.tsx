import { useGame } from '../../context/GameContext';
import './Achievements.css';

const Achievements = () => {
  const { state } = useGame();

  const unlockedCount = state.achievements.filter(a => a.unlocked).length;
  const totalCount = state.achievements.length;

  const groupedAchievements = {
    essence: state.achievements.filter(a => a.type === 'essence'),
    dpc: state.achievements.filter(a => a.type === 'dpc'),
    dps: state.achievements.filter(a => a.type === 'dps'),
    rebirth: state.achievements.filter(a => a.type === 'rebirth'),
    clicks: state.achievements.filter(a => a.type === 'clicks'),
    materials: state.achievements.filter(a => a.type === 'materials'),
  };

  const categoryNames: Record<string, string> = {
    essence: '💰 По эссенциям',
    dpc: '⚔️ По урону за клик',
    dps: '🏛️ По пассивному урону',
    rebirth: '🔄 По перерождению',
    clicks: '👆 По кликам',
    materials: '📦 По материалам',
  };

  return (
    <div className="achievements-page">
      <div className="container">
        <div className="achievements-header">
          <h1>Достижения</h1>
          <div className="achievements-progress">
            <span className="progress-text">{unlockedCount} / {totalCount}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              />
            </div>
            <span className="points-text">Очков: {state.achievementPoints}</span>
          </div>
        </div>

        <div className="achievements-content">
          {Object.entries(groupedAchievements).map(([category, achievements]) => (
            <div key={category} className="achievement-category">
              <h2>{categoryNames[category]}</h2>
              <div className="achievements-grid">
                {achievements.map(achievement => (
                  <div 
                    key={achievement.id} 
                    className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="achievement-icon">
                      {achievement.unlocked ? '🏆' : '🔒'}
                    </div>
                    <div className="achievement-info">
                      <span className="achievement-name">{achievement.name}</span>
                      <span className="achievement-desc">{achievement.description}</span>
                    </div>
                    <div className="achievement-points">
                      +{achievement.points}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Achievements;
