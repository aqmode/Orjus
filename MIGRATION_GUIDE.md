# Инструкция по миграции базы данных

## Что изменилось?

1. **Новая система авторизации**: 
   - Убрали email-based авторизацию через Supabase Auth
   - Теперь используем простую систему: nickname + password
   - Пароли хешируются на клиенте с помощью SHA-256

2. **Изменения в базе данных**:
   - Создана новая таблица `users` для хранения пользователей
   - Таблицы `profiles` и `saves` теперь ссылаются на `users`, а не на `auth.users`
   - Сессии хранятся в localStorage на клиенте (30 дней)

3. **Автосохранение**:
   - Автосохранение каждую минуту (было 30 секунд)
   - Предупреждение при закрытии вкладки
   - Кнопка ручного сохранения на странице игры

## Как применить миграцию?

### Вариант 1: Через Supabase Dashboard

1. Откройте проект в [Supabase Dashboard](https://app.supabase.com)
2. Перейдите в раздел **SQL Editor**
3. Создайте новый запрос
4. Скопируйте содержимое файла `database_migration.sql`
5. Вставьте в редактор и нажмите **Run**

### Вариант 2: Через psql

```bash
psql -h <your-project-ref>.supabase.co -U postgres -d postgres -f database_migration.sql
```

## После миграции

### 1. Проверьте, что таблицы созданы:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'profiles', 'saves');
```

### 2. Проверьте политики RLS:

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('users', 'profiles', 'saves');
```

### 3. Тестирование

1. Зарегистрируйте нового пользователя через форму регистрации
2. Проверьте, что запись создалась:
   ```sql
   SELECT id, nickname, display_name, created_at FROM users;
   ```
3. Войдите в игру и сохраните прогресс
4. Обновите страницу - сессия должна сохраниться

## Откат миграции (если нужно)

Если что-то пошло не так, можно откатить изменения:

```sql
-- Удалить новую таблицу users
DROP TABLE IF EXISTS users CASCADE;

-- Восстановить связи с auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE saves DROP CONSTRAINT IF EXISTS saves_user_id_fkey;
ALTER TABLE saves ADD CONSTRAINT saves_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

## Важно!

⚠️ **Все существующие пользователи будут потеряны!** 
Эта миграция создаёт новую таблицу пользователей, несовместимую со старой системой.

Если у вас есть действующие пользователи, нужно сначала мигрировать их данные:

```sql
-- Миграция существующих пользователей (выполнить ДО основной миграции)
INSERT INTO users (id, nickname, display_name, created_at)
SELECT 
    au.id,
    COALESCE(p.nickname, SPLIT_PART(au.email, '@', 1)) as nickname,
    COALESCE(p.display_name, SPLIT_PART(au.email, '@', 1)) as display_name,
    au.created_at
FROM auth.users au
LEFT JOIN profiles p ON p.user_id = au.id
ON CONFLICT (nickname) DO NOTHING;

-- Установить временный пароль (пользователям нужно будет сбросить пароль)
UPDATE users SET password_hash = 'temporary_hash_needs_reset';
```

## Проблемы и решения

### "Cannot find name 'hashPassword'"
Функция hashPassword определена в AuthContext.tsx и используется внутри контекста.

### "Infinite loading on page refresh"
Проверьте localStorage: `localStorage.getItem('voidClickerSession')`
Если сессия есть, но загрузка бесконечная - проверьте, что пользователь существует в БД.

### "Save button doesn't work"
Убедитесь, что:
1. Пользователь авторизован (`user !== null`)
2. Функция `saveGameToCloud` работает (проверьте в консоли)
3. Таблица `saves` существует и доступна

## Контакты

Если возникли проблемы с миграцией, создайте issue в репозитории проекта.
