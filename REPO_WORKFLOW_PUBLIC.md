# 🔄 Работа с двумя репозиториями

## 📋 Обзор

У нас есть два репозитория для разделения публичной и приватной частей проекта:

### 🔒 Приватный репозиторий (honkai.git)
- **URL:** `git@github.com:Enable-V/honkai.git`
- **Содержимое:** Полное приложение (клиент + сервер + БД)
- **Ветка:** `main`
- **Статус:** Private

### 🌐 Публичный репозиторий (gasha-tracker.git)
- **URL:** `git@github.com:Enable-V/gasha-tracker.git`
- **Содержимое:** Только клиентская часть + скрипты импорта
- **Ветка:** `main`
- **Статус:** Public

## 🚀 Рабочие процессы

### 📝 **Пошаговое руководство по внесению изменений**

#### Шаг 1: Подготовка рабочего пространства
```bash
# Убедитесь, что вы находитесь в ветке main
git checkout main
git status
git pull gasha-tracker main  # Синхронизируем с приватным репозиторием
```

#### Шаг 2: Внесение изменений

##### Для клиентских изменений (React/TypeScript):
```bash
# Перейдите в папку клиента
cd client

# Внесите изменения в код
code src/components/MyComponent.tsx

# Проверьте изменения
git status
git diff

# Вернитесь в корень проекта
cd ..
```

##### Для скриптов импорта:
```bash
# Отредактируйте скрипт
code scripts/get-genshin-url.ps1

# Протестируйте изменения
./scripts/get-genshin-url.ps1
```

##### Для серверных изменений:
```bash
# Внесите изменения в серверную часть
code server/src/routes/auth.ts

# Проверьте TypeScript ошибки
cd server && npm run build
```

#### Шаг 3: Тестирование изменений
```bash
# Запустите проект локально
npm run dev

# Или только клиент
cd client && npm run dev

# Проверьте функциональность в браузере
# http://localhost:5173
```

#### Шаг 4: Коммит изменений
```bash
# Добавьте измененные файлы
git add client/src/components/MyComponent.tsx
# или для всех изменений
git add .

# Создайте понятный коммит
git commit -m "feat: add new feature to component

- Added new button functionality
- Updated styling
- Added error handling"
```

#### Шаг 5: Отправка в приватный репозиторий
```bash
# Отправьте изменения в приватный репозиторий
git push gasha-tracker main

# Убедитесь, что изменения дошли
git log --oneline gasha-tracker/main -3
```

#### Шаг 6: Синхронизация с публичным репозиторием

##### Вариант 1: Быстрая синхронизация (только клиентские изменения)
```bash
# Создайте ветку для публичной версии
git checkout -b public-sync

# Удалите приватные файлы
git rm -r server/
git rm -r database/
git rm docker-compose.yml
git rm docker-compose.alternative.yml
# ... другие приватные файлы

# Обновите package.json для публичной версии
# (уберите серверные скрипты)

# Коммит чистой версии
git add -A
git commit -m "sync: client changes to public repo"

# Отправьте в публичный репозиторий
git push origin public-sync:main --force

# Вернитесь к main
git checkout main
git branch -D public-sync
```

##### Вариант 2: Использование существующей ветки public-client
```bash
# Переключитесь на ветку публичного клиента
git checkout public-client

# Синхронизируйте с main
git merge main

# Убедитесь, что нет приватных файлов
git ls-files | grep -E "server|database|\.env"

# Если есть лишние файлы - удалите их
git rm -r server/

# Коммит изменений
git add -A
git commit -m "sync: update public client"

# Отправьте в публичный репозиторий
git push origin public-client:main

# Вернитесь к main
git checkout main
```

#### Шаг 7: Проверка результатов
```bash
# Проверьте приватный репозиторий
open https://github.com/Enable-V/honkai

# Проверьте публичный репозиторий
open https://github.com/Enable-V/gasha-tracker

# Убедитесь, что изменения применились корректно
```

### 1. 🔄 Синхронизация клиентских изменений

#### Когда изменения только в клиенте:
```bash
# В приватном репозитории
cd /path/to/private-repo

# Делаем изменения в client/
# ... редактируем файлы ...

# Коммитим изменения
git add client/
git commit -m "feat: update client component"

# Отправляем в приватный репозиторий
git push origin main

# Переключаемся на ветку публичного клиента
git checkout public-client

# Мерджим изменения из main
git merge main

# Отправляем в публичный репозиторий
git push gasha-tracker public-client:main
```

#### Быстрый способ синхронизации клиента:
```bash
# В приватном репозитории
git checkout public-client
git merge main
git push gasha-tracker public-client:main
```

### 2. 🆕 Добавление новых клиентских файлов

```bash
# В приватном репозитории
# Создаем новый файл в client/src/components/
echo "новый компонент" > client/src/components/NewComponent.tsx

# Добавляем в git
git add client/src/components/NewComponent.tsx
git commit -m "feat: add new client component"

# Синхронизируем с публичным
git checkout public-client
git merge main
git push gasha-tracker public-client:main
```

### 🎯 **Типичные сценарии работы**

#### Сценарий 1: Исправление бага в интерфейсе
```bash
# 1. Подготовка
git checkout main
git pull gasha-tracker main

# 2. Исправление
cd client
code src/components/BuggyComponent.tsx
# Исправляем баг...

# 3. Тестирование
npm run dev
# Проверяем в браузере

# 4. Коммит
cd ..
git add client/src/components/BuggyComponent.tsx
git commit -m "fix: resolve button click issue in component

- Fixed onClick handler
- Added proper error handling
- Updated tests"

# 5. Отправка в приватный
git push gasha-tracker main

# 6. Синхронизация с публичным
git checkout -b public-sync
git rm -r server/ database/ docker-compose.yml
git add -A
git commit -m "sync: bug fix to public repo"
git push origin public-sync:main --force
git checkout main
git branch -D public-sync
```

#### Сценарий 2: Добавление новой фичи
```bash
# 1. Планирование и разработка
git checkout main
cd client
code src/pages/NewFeaturePage.tsx
code src/components/NewFeatureComponent.tsx
# Реализуем новую функциональность...

# 2. Тестирование
npm run build
npm run preview

# 3. Коммит с подробным описанием
cd ..
git add client/src/pages/NewFeaturePage.tsx client/src/components/NewFeatureComponent.tsx
git commit -m "feat: add user profile management

- Added new profile page with avatar upload
- Implemented profile editing form
- Added validation and error handling
- Updated navigation menu
- Added responsive design"

# 4. Отправка в оба репозитория
git push gasha-tracker main
git checkout -b public-sync && git rm -r server/ database/ && git add -A && git commit -m "sync: new feature to public" && git push origin public-sync:main --force && git checkout main && git branch -D public-sync
```

#### Сценарий 3: Обновление зависимостей
```bash
# 1. Обновление в клиенте
cd client
npm update react react-dom
npm audit fix

# 2. Тестирование
npm run build
npm run dev

# 3. Коммит
cd ..
git add client/package-lock.json
git commit -m "deps: update React dependencies

- Updated React to latest stable version
- Fixed security vulnerabilities
- Updated peer dependencies"

# 4. Синхронизация
git push gasha-tracker main
git checkout -b public-sync && git rm -r server/ && git add -A && git commit -m "sync: dependency updates" && git push origin public-sync:main --force && git checkout main && git branch -D public-sync
```

#### Сценарий 4: Экстренное исправление в продакшене
```bash
# 1. Быстрое исправление
git checkout main
cd client
code src/components/CriticalBug.tsx
# Исправляем критический баг...

# 2. Минимальный коммит
git add client/src/components/CriticalBug.tsx
git commit -m "hotfix: critical bug in production

- Fixed null pointer exception
- Added safety checks"

# 3. Срочная отправка
git push gasha-tracker main
git push origin HEAD:main --force  # Прямая отправка в публичный
```

## 📁 Структура синхронизируемых файлов

### ✅ Синхронизируются в публичный репозиторий:
```
client/                    # Вся клиентская часть
├── src/
├── public/
├── package.json
├── package-lock.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json

scripts/                   # Скрипты импорта
├── get-genshin-url.ps1
├── hsr_getlink.ps1
└── ...

.github/                   # GitHub Actions
.vscode/                   # Настройки VS Code
README.md                  # Публичная документация
```

### ❌ НЕ синхронизируются (приватные):
```
server/                    # Серверная часть
database/                  # База данных
docker-compose.yml         # Docker конфиг
.env*                      # Переменные окружения
*.log                      # Логи
test-data/                 # Тестовые данные
```

## 🔧 Полезные команды

### Проверка статуса
```bash
# Текущая ветка и статус
git branch
git status

# Просмотр remote
git remote -v
```

### Переключение между репозиториями
```bash
# В приватный
git checkout main

# В публичный
git checkout public-client
```

### Синхронизация изменений
```bash
# Из main в public-client
git checkout public-client
git merge main

# Push в публичный
git push gasha-tracker public-client:main
```

## ⚠️ Важные правила

### 🔴 НИКОГДА не делайте:
- ❌ Не коммитите серверные файлы в public-client ветку
- ❌ Не пушьте приватные данные в публичный репозиторий
- ❌ Не мержите public-client обратно в main (если там есть лишние файлы)

### ✅ Всегда проверяйте:
- ✅ Перед пушем в публичный - проверьте, что нет приватных файлов
- ✅ После мерджа - проверьте структуру проекта
- ✅ Токены и ключи - никогда не попадают в публичный репозиторий

## 🐛 Устранение проблем

### Если в public-client попали лишние файлы:
```bash
# Удалить файлы
git rm --cached server/
git rm --cached database/
git commit -m "remove private files from public branch"

# Пересоздать ветку если нужно
git branch -D public-client
git checkout -b public-client
# Скопировать только нужные файлы из main
```

### Если нужно обновить публичный README:
```bash
git checkout public-client
# Редактировать README.md
git add README.md
git commit -m "docs: update public readme"
git push gasha-tracker public-client:main
```

### Конфликты при мердже:
```bash
# Прервать мердж
git merge --abort

# Или разрешить конфликты
git mergetool
git add <resolved-files>
git commit
```

### Ошибка "non-fast-forward":
```bash
# Принудительный push (осторожно!)
git push origin main --force

# Или создать новую ветку
git checkout -b temp-branch
git push origin temp-branch:main --force
```

### Потеря изменений:
```bash
# Найти потерянные коммиты
git reflog

# Восстановить
git checkout <commit-hash>
git checkout -b recovery-branch
```

### Проблемы с remote:
```bash
# Проверить remote
git remote -v

# Исправить URL
git remote set-url origin git@github.com:Enable-V/gasha-tracker.git
git remote set-url gasha-tracker git@github.com:Enable-V/honkai.git
```

## 📋 **Best Practices**

### ✅ **Всегда делайте:**
- Проверяйте `git status` перед коммитом
- Пишиите понятные сообщения коммитов
- Тестируйте изменения локально перед отправкой
- Проверяйте публичный репозиторий после синхронизации
- Делайте бэкапы важных изменений

### ❌ **Никогда не делайте:**
- Не коммитите приватные ключи/API ключи
- Не отправляйте незатестированный код в main
- Не используйте `git push --force` без необходимости
- Не мержите public-client обратно в main
- Не игнорируйте конфликты мерджа

### 📝 **Формат сообщений коммитов:**
```
type: description

[optional body]

[optional footer]
```

**Типы:**
- `feat:` - новая функциональность
- `fix:` - исправление бага
- `docs:` - документация
- `style:` - форматирование
- `refactor:` - рефакторинг
- `test:` - тесты
- `chore:` - обслуживание

**Примеры:**
```
feat: add user authentication
fix: resolve memory leak in component
docs: update API documentation
style: format code with prettier
refactor: simplify state management
test: add unit tests for utils
chore: update dependencies
```

### 🔒 **Безопасность:**
- Никогда не коммитите `.env` файлы
- Проверяйте содержимое перед отправкой в публичный репозиторий
- Используйте `.gitignore` для исключения чувствительных данных
- Регулярно проверяйте публичный репозиторий на утечки

### 📊 Мониторинг

### Проверка размера репозиториев:
```bash
# Размер приватного
git checkout main
du -sh .

# Размер публичного
git checkout public-client
du -sh .
```

### Проверка различий:
```bash
# Файлы только в main
git checkout main
git ls-files | grep -v "^client/" | grep -v "^scripts/" | grep -v "^\.github/"

# Файлы только в public-client
git checkout public-client
git ls-files
```

## 🎯 Быстрые команды

### Автоматизированные скрипты
```bash
# Синхронизация клиента (добавьте в ~/.bashrc или ~/.zshrc)
sync-client() {
    echo "🔄 Синхронизация клиентских изменений..."
    
    # Проверяем, что мы в main
    if [[ $(git branch --show-current) != "main" ]]; then
        echo "❌ Переключитесь на ветку main"
        return 1
    fi
    
    # Создаем временную ветку для публичной версии
    git checkout -b public-sync-temp
    
    # Удаляем приватные файлы
    git rm -r -f server/ database/ docker-compose* .env* *.log 2>/dev/null || true
    
    # Обновляем package.json
    sed -i 's/"dev": "concurrently.*"/"dev": "cd client \&\& npm run dev"/' package.json
    sed -i '/dev:server/d; /dev:client/d; /build:server/d; /start:/d; /docker:/d' package.json
    
    # Коммит
    git add -A
    git commit -m "sync: client changes $(date +%Y-%m-%d)" --allow-empty
    
    # Отправка
    git push origin public-sync-temp:main --force
    
    # Очистка
    git checkout main
    git branch -D public-sync-temp
    
    echo "✅ Синхронизация завершена!"
}

# Проверка чистоты публичной ветки
check-public-clean() {
    echo "🔍 Проверка публичной версии..."
    
    # Создаем временную ветку
    git checkout -b check-temp
    git rm -r -f server/ database/ 2>/dev/null || true
    
    # Проверяем на приватные файлы
    PRIVATE_FILES=$(git ls-files | grep -E "server|database|docker|\.env|\.log" || true)
    
    if [[ -n "$PRIVATE_FILES" ]]; then
        echo "❌ Найдены приватные файлы:"
        echo "$PRIVATE_FILES"
        git checkout main
        git branch -D check-temp
        return 1
    else
        echo "✅ Публичная версия чистая"
        git checkout main
        git branch -D check-temp
    fi
}

# Полная синхронизация (клиент + скрипты)
sync-full() {
    echo "🚀 Полная синхронизация..."
    
    # Проверки
    if [[ $(git status --porcelain) ]]; then
        echo "❌ У вас есть незакоммиченные изменения"
        return 1
    fi
    
    # Отправка в приватный
    git push gasha-tracker main
    
    # Синхронизация клиента
    sync-client
    
    echo "✅ Полная синхронизация завершена!"
}
```

### Ручные команды
```bash
# Синхронизация клиента
alias sync-client="git checkout public-client && git merge main && git push gasha-tracker public-client:main && git checkout main"

# Проверка чистоты ветки
alias check-public="git checkout public-client && git ls-files | grep -E 'server|database|docker|\.env' || echo 'Clean!' && git checkout main"

# Быстрый коммит клиентских изменений
alias commit-client="git add client/ && git commit -m 'feat: update client'"

# Статус всех репозиториев
alias repo-status="echo '=== Local ===' && git status --short && echo '=== Private ===' && git log --oneline gasha-tracker/main -1 && echo '=== Public ===' && git log --oneline origin/main -1"
```

## 📞 Контакты

При проблемах с синхронизацией:
1. Проверьте текущую ветку: `git branch`
2. Проверьте статус: `git status`
3. Проверьте различия: `git diff main public-client`
4. Создайте issue в приватном репозитории

---

**💡 Pro tip:** Всегда работайте в ветке `main` для приватного репозитория, а синхронизацию с публичным делайте через `public-client` ветку.
