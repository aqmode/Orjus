-- Migration: Упрощение системы авторизации
-- Дата: 2025-12-30
-- Описание: Убираем email-based авторизацию через Supabase Auth и переходим на простую систему nickname + password

-- ⚠️ ВНИМАНИЕ: Эта миграция удалит все существующие данные пользователей!
-- Если нужно сохранить данные, сделайте резервную копию перед выполнением.

-- 1. Удаляем внешние ключи из зависимых таблиц
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE saves DROP CONSTRAINT IF EXISTS saves_user_id_fkey;

-- 2. Очищаем старые данные (так как они связаны с auth.users)
TRUNCATE TABLE profiles CASCADE;
TRUNCATE TABLE saves CASCADE;

-- 3. Создаём новую таблицу пользователей
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(64) NOT NULL,
    display_name VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Добавляем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- 5. Связываем таблицу profiles с новой таблицей users
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 6. Связываем таблицу saves с новой таблицей users
ALTER TABLE saves ADD CONSTRAINT saves_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 7. Настраиваем Row Level Security (RLS) для users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать (для проверки nickname при входе)
DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users
    FOR SELECT
    USING (true);

-- Политика: все могут обновлять (для обновления профиля)
DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Политика: любой может создать нового пользователя (регистрация)
DROP POLICY IF EXISTS users_insert_any ON users;
CREATE POLICY users_insert_any ON users
    FOR INSERT
    WITH CHECK (true);

-- 8. Обновляем RLS для profiles
DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS profiles_insert_own ON profiles;
CREATE POLICY profiles_insert_own ON profiles
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 9. Обновляем RLS для saves
DROP POLICY IF EXISTS saves_select_own ON saves;
CREATE POLICY saves_select_own ON saves
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS saves_insert_own ON saves;
CREATE POLICY saves_insert_own ON saves
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS saves_update_own ON saves;
CREATE POLICY saves_update_own ON saves
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 10. Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ✅ Готово! Теперь система использует простую авторизацию без email
-- 
-- Следующие шаги:
-- 1. Зарегистрируйте нового пользователя через форму
-- 2. Проверьте, что данные сохраняются
-- 3. Обновите страницу - сессия должна остаться
--
-- Примечание: Все старые пользователи и их данные были удалены.
