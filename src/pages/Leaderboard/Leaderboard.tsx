import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { RARITY_WEIGHTS } from '../../context/GameContext';
import './Leaderboard.css';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  totalEssence: number;
  rebirthLevel: number;
  totalClicks: number;
  craftScore: number;
  isCurrentUser: boolean;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'essence' | 'rebirth' | 'clicks' | 'craft'>('essence');

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Загружаем все сохранения с данными пользователей
      const { data: saves, error: savesError } = await supabase
        .from('saves')
        .select('user_id, save_data')
        .order('updated_at', { ascending: false });

      if (savesError) throw savesError;

      if (!saves || saves.length === 0) {
        setLeaderboard([]);
        setIsLoading(false);
        return;
      }

      // Загружаем никнеймы пользователей
      const userIds = saves.map(s => s.user_id);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, nickname')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Создаем map для быстрого поиска никнеймов
      const usersMap = new Map(users?.map(u => [u.id, u.nickname]) || []);

      // Функция расчёта очков крафта
      const calculateCraftScoreFromSave = (saveData: any): number => {
        const craftedItems = saveData.craftedItems || {};
        const materials = saveData.materials || [];
        let score = 0;
        
        for (const [materialId, count] of Object.entries(craftedItems)) {
          const material = materials.find((m: any) => m.id === materialId);
          if (material) {
            const weight = RARITY_WEIGHTS[material.rarity] || 1;
            score += (count as number) * weight;
          }
        }
        return score;
      };

      // Парсим данные и создаем рейтинг
      const entries = saves
        .map(save => {
          const saveData = save.save_data as any;
          return {
            userId: save.user_id,
            nickname: usersMap.get(save.user_id) || 'Unknown',
            totalEssence: saveData.totalEssence || 0,
            rebirthLevel: saveData.rebirthLevel || 0,
            totalClicks: saveData.totalClicks || 0,
            craftScore: calculateCraftScoreFromSave(saveData),
            isCurrentUser: user?.id === save.user_id,
            rank: 0, // Will be set later
          };
        })
        .filter(entry => entry.nickname !== 'Unknown');

      // Сортируем по выбранному параметру
      const sortField = 
        sortBy === 'essence' ? 'totalEssence' :
        sortBy === 'rebirth' ? 'rebirthLevel' :
        sortBy === 'craft' ? 'craftScore' :
        'totalClicks';

      entries.sort((a, b) => (b as any)[sortField] - (a as any)[sortField]);

      // Добавляем ранги
      const rankedEntries = entries.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      setLeaderboard(rankedEntries);
    } catch (e) {
      console.error('Error loading leaderboard:', e);
      setError('Ошибка загрузки рейтинга');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Math.floor(num).toString();
  };

  const getRankIcon = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  return (
    <div className="leaderboard-page">
      <div className="container">
        <div className="leaderboard-header">
          <h1>🏆 Таблица лидеров</h1>
          <p className="leaderboard-subtitle">
            Лучшие игроки Orjus
          </p>
        </div>

        <div className="sort-tabs">
          <button 
            className={`sort-btn ${sortBy === 'essence' ? 'active' : ''}`}
            onClick={() => setSortBy('essence')}
          >
            💰 По эссенции
          </button>
          <button 
            className={`sort-btn ${sortBy === 'rebirth' ? 'active' : ''}`}
            onClick={() => setSortBy('rebirth')}
          >
            🔄 По перерождениям
          </button>
          <button 
            className={`sort-btn ${sortBy === 'clicks' ? 'active' : ''}`}
            onClick={() => setSortBy('clicks')}
          >
            👆 По кликам
          </button>
          <button 
            className={`sort-btn ${sortBy === 'craft' ? 'active' : ''}`}
            onClick={() => setSortBy('craft')}
          >
            🔨 По крафту
          </button>
        </div>

        {isLoading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Загрузка рейтинга...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={loadLeaderboard} className="retry-btn">
              Попробовать снова
            </button>
          </div>
        )}

        {!isLoading && !error && leaderboard.length === 0 && (
          <div className="empty-state">
            <p>Рейтинг пуст. Будьте первым!</p>
          </div>
        )}

        {!isLoading && !error && leaderboard.length > 0 && (
          <div className="leaderboard-table">
            <div className="table-header">
              <div className="col-rank">Место</div>
              <div className="col-player">Игрок</div>
              <div className="col-stat">
                {sortBy === 'essence' && 'Эссенция'}
                {sortBy === 'rebirth' && 'Перерождения'}
                {sortBy === 'clicks' && 'Клики'}
                {sortBy === 'craft' && 'Очки крафта'}
              </div>
              <div className="col-extra">Доп. инфо</div>
            </div>

            <div className="table-body">
              {leaderboard.map(entry => (
                <div 
                  key={entry.userId} 
                  className={`table-row ${entry.isCurrentUser ? 'current-user' : ''} ${entry.rank <= 3 ? 'top-three' : ''}`}
                >
                  <div className="col-rank">
                    <span className="rank-badge">{getRankIcon(entry.rank)}</span>
                  </div>
                  <div className="col-player">
                    <span className="player-name">
                      {entry.nickname}
                      {entry.isCurrentUser && <span className="you-badge">ВЫ</span>}
                    </span>
                  </div>
                  <div className="col-stat">
                    <span className="stat-value">
                      {sortBy === 'essence' && formatNumber(entry.totalEssence)}
                      {sortBy === 'rebirth' && entry.rebirthLevel}
                      {sortBy === 'clicks' && formatNumber(entry.totalClicks)}
                      {sortBy === 'craft' && formatNumber(entry.craftScore)}
                    </span>
                  </div>
                  <div className="col-extra">
                    {sortBy !== 'rebirth' && (
                      <span className="extra-info">🔄 {entry.rebirthLevel}</span>
                    )}
                    {sortBy !== 'clicks' && sortBy !== 'craft' && (
                      <span className="extra-info">👆 {formatNumber(entry.totalClicks)}</span>
                    )}
                    {sortBy === 'craft' && (
                      <span className="extra-info">💰 {formatNumber(entry.totalEssence)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button 
          className="refresh-btn" 
          onClick={loadLeaderboard}
          disabled={isLoading}
        >
          🔄 Обновить
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;
