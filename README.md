# Honkai Star Rail & Genshin Impact Gacha Tracker

[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)

Универсальный трекер круток для Honkai Star Rail и Genshin Impact с современным веб-интерфейсом, подробной аналитикой и мощной админ-панелью.


## 🌟 Особенности

### 🎮 Игровая поддержка
- **Honkai Star Rail** - полная поддержка всех типов баннеров
- **Genshin Impact** - поддержка всех игровых баннеров
- **Мульти-игровая статистика** - объединенная аналитика по всем играм

### 📊 Аналитика и статистика
- **Детальная статистика круток** - анализ по всем баннерам и типам предметов
- **Трекинг питы** - отслеживание счетчика гарантии для каждого типа баннера
- **Визуализация данных** - красивые графики и диаграммы вашей удачи
- **Распределение редкости** - статистика по 3★, 4★, 5★ предметам
- **История баннеров** - временная шкала ваших круток

### 🔧 Технические возможности
- **Импорт данных** - поддержка импорта через URL API и JSON файлы
- **Современный интерфейс** - адаптивный дизайн с темной темой
- **База данных MySQL** - надежное хранение данных с индексами
- **Redis кеширование** - высокая производительность и оптимизация
- **Docker поддержка** - легкое развертывание и масштабирование
- **TypeScript** - полная типобезопасность
- **RESTful API** - хорошо документированные endpoints

### 👑 Админ-панель
- **Управление пользователями** - создание, редактирование, удаление пользователей
- **Управление баннерами** - добавление и настройка игровых баннеров
- **Управление переводами** - мультиязычная поддержка (EN/RU)
- **Управление кешем** - мониторинг и настройка Redis кеширования
- **Система ролей** - гибкая система прав доступа
- **Статистика системы** - мониторинг производительности и здоровья

### 🔒 Безопасность и надежность
- **JWT аутентификация** - безопасная авторизация пользователей
- **Ролевая модель** - granular контроль доступа
- **Валидация данных** - защита от некорректных данных
- **Логирование** - подробные логи для отладки и мониторинга
- **Обработка ошибок** - graceful error handling

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+ 
- Docker и Docker Compose
- MySQL Server (опционально, можно использовать Docker)

### Установка

1. **Клонируйте репозиторий:**
   ```bash
   git clone <repository-url>
   cd hsr-gacha-tracker
   ```

2. **Установите зависимости:**
   ```bash
   npm run setup
   ```

3. **Запустите базу данных:**
   ```bash
   npm run docker:up
   ```

4. **Настройте переменные окружения:**
   ```bash
   # Скопируйте .env файлы и настройте под себя
   cp server/.env.example server/.env
   ```

5. **Запустите приложение:**
   ```bash
   npm run dev
   ```

Приложение будет доступно по адресу:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- PhpMyAdmin: http://localhost:8080

## 📋 Использование

### Получение данных круток

#### Для Honkai Star Rail:

1. **Закройте игру Honkai Star Rail**

2. **Запустите PowerShell от имени администратора**

3. **Выполните команду:**
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex "&{$((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/honkai/main/scripts/hsr_getlink.ps1'))}"
   ```

4. **Скопируйте полученную ссылку**

#### Для Genshin Impact:

1. **Закройте игру Genshin Impact**

2. **Запустите PowerShell от имени администратора**

3. **Выполните команду:**
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex "&{$((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/honkai/main/scripts/get-genshin-url.ps1'))}"
   ```

4. **Скопируйте полученную ссылку**

### Импорт данных

1. Перейдите на страницу "Загрузка данных"
2. Выберите игру (Honkai Star Rail или Genshin Impact)
3. Введите ваш UID из игры
4. Вставьте полученную ссылку или загрузите JSON файл
5. Нажмите "Загрузить данные"

## 🏗 Архитектура

### Frontend (React + TypeScript + Vite)
- **React 18** с TypeScript для полной типобезопасности
- **Vite** для быстрой разработки и оптимизированной сборки
- **TailwindCSS** для современного адаптивного дизайна
- **React Query** для эффективного управления серверным состоянием
- **React Router** для клиентской маршрутизации
- **Chart.js** для интерактивной визуализации данных
- **Heroicons** для красивых иконок
- **Axios** для HTTP запросов с перехватчиками
- **JWT** аутентификация с автоматическим обновлением токенов

### Backend (Node.js + Express + TypeScript)
- **Express.js** REST API сервер с middleware архитектурой
- **Prisma ORM** для типобезопасной работы с базой данных
- **TypeScript** для полной типобезопасности
- **Winston** для структурированного логирования
- **Redis** для высокопроизводительного кеширования
- **JWT** для аутентификации и авторизации
- **Helmet** для безопасности HTTP заголовков
- **CORS** для кросс-доменных запросов
- **Sharp** для оптимизации изображений
- **Multer** для обработки загрузок файлов

### База данных (MySQL 8.0)
- **Оптимизированная схема** для хранения данных круток
- **Индексы** для быстрых запросов и поиска
- **Транзакции** для целостности данных
- **Миграции Prisma** для версионирования схемы
- **Отношения** между пользователями, баннерами и крутками

### Кеширование (Redis)
- **Автоматическое кеширование** API ответов
- **Инвалидация по паттернам** при изменениях данных
- **Метрики производительности** (hit/miss ratio)
- **TTL управление** через админ-панель
- **Статистика использования** в реальном времени

### Контейнеризация (Docker)
- **Docker Compose** для всего стека приложений
- **Автоматическая инициализация** базы данных
- **Изолированная среда** разработки и продакшена
- **Volume mapping** для персистентности данных
- **Health checks** для мониторинга сервисов

## 📊 API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/register` - Регистрация пользователя
- `GET /api/auth/me` - Получение текущего пользователя
- `POST /api/auth/logout` - Выход из системы

### Пользователи
- `GET /api/users` - Получить всех пользователей (админ)
- `GET /api/users/:uid` - Получить пользователя по UID
- `POST /api/users` - Создать/обновить пользователя
- `DELETE /api/users/:uid` - Удалить пользователя (админ)
- `PUT /api/users/:uid/role` - Изменить роль пользователя (админ)

### Крутки (Gacha)
- `GET /api/gacha/user/:uid` - Получить крутки пользователя
- `GET /api/gacha/stats/:uid` - Получить статистику пользователя
- `POST /api/gacha/import/:uid` - Импортировать данные круток
- `GET /api/gacha/banner/:bannerId` - Получить крутки по баннеру

### Статистика
- `GET /api/stats/overall` - Общая статистика по всем пользователям
- `GET /api/stats/user/:uid` - Детальная статистика пользователя
- `GET /api/stats/banner/:bannerId` - Статистика конкретного баннера
- `GET /api/stats/pity/:uid` - Распределение питы пользователя
- `GET /api/stats/games` - Статистика по играм

### Баннеры
- `GET /api/banners` - Получить все баннеры
- `GET /api/banners/:id` - Получить баннер по ID
- `POST /api/banners` - Создать новый баннер (админ)
- `PUT /api/banners/:id` - Обновить баннер (админ)
- `DELETE /api/banners/:id` - Удалить баннер (админ)

### Переводы (Translations)
- `GET /api/translations` - Получить все переводы
- `POST /api/translations` - Создать перевод (админ)
- `PUT /api/translations/:id` - Обновить перевод (админ)
- `DELETE /api/translations/:id` - Удалить перевод (админ)

### Админ-панель
- `GET /api/admin/stats` - Статистика админ-панели
- `GET /api/admin/cache/settings` - Настройки кеширования
- `PUT /api/admin/cache/settings` - Обновить настройки кеша
- `POST /api/admin/cache/clear` - Очистить весь кеш
- `GET /api/admin/cache/info` - Детальная информация о кеше
- `GET /api/admin/cache/metrics` - Метрики кеширования
- `GET /api/admin/health` - Здоровье системы

### Загрузка данных
- `POST /api/upload/json/:uid` - Загрузка JSON файла
- `POST /api/upload/url/:uid` - Загрузка через URL API
- `GET /api/upload/history/:uid` - История загрузок

### Изображения
- `GET /api/images/:type/:id` - Получить изображение
- `POST /api/images/upload` - Загрузить изображение (админ)
- `DELETE /api/images/:id` - Удалить изображение (админ)

## 🛠 Разработка

### Запуск в режиме разработки
```bash
# Все сервисы одновременно
npm run dev

# Только сервер
npm run dev:server

# Только клиент
npm run dev:client
```

### Работа с базой данных
```bash
# Генерация Prisma клиента
cd server && npm run db:generate

# Применение миграций
cd server && npm run db:push

# Открыть Prisma Studio (веб-интерфейс для БД)
cd server && npm run db:studio

# Сброс базы данных
cd server && npm run db:reset
```

### Работа с кешем
```bash
# Очистить Redis кеш
cd server && npm run cache:clear

# Проверить статус кеша
cd server && npm run cache:stats

# Проверить здоровье системы
cd server && npm run health:check
```

### Сборка для продакшена
```bash
# Полная сборка (клиент + сервер)
npm run build

# Только клиент
npm run build:client

# Только сервер
npm run build:server
```

### Анализ и отладка
```bash
# Проверить логи сервера
tail -f server/logs/combined.log

# Проверить логи ошибок
tail -f server/logs/error.log

# Анализ производительности кеша
cd server && npm run analyze:cache

# Проверка синтаксиса
npm run lint

# Форматирование кода
npm run format
```

### Скрипты для получения данных
```bash
# Получить URL для Honkai Star Rail
.\scripts\hsr_getlink.ps1

# Получить URL для Genshin Impact
.\scripts\get-genshin-url.ps1

# Проверить статус кеша
.\check_cache_stats.ps1
```

## 🔧 Конфигурация

### Переменные окружения

**Server (.env):**
```env
# База данных
DATABASE_URL="mysql://root@localhost:3306/hsr_gacha_db"

# Сервер
PORT=3001
NODE_ENV=development

# JWT Аутентификация
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Redis (кеширование)
REDIS_URL="redis://localhost:6379"
CACHE_ENABLED=true
CACHE_TTL_SECONDS=3600

# Логирование
LOG_LEVEL="info"
LOG_DIR="logs"

# Загрузка файлов
UPLOAD_MAX_SIZE="10mb"
ALLOWED_FILE_TYPES="json,txt"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Админ настройки
ADMIN_EMAIL="admin@example.com"
DEFAULT_ADMIN_PASSWORD="changeme"
```

**Client (.env):**
```env
# API сервер
VITE_API_URL="http://localhost:3001/api"

# Режим разработки
VITE_NODE_ENV="development"
```

**Docker (docker-compose.yml):**
- **MySQL**: порт 3306 (база данных)
- **Redis**: порт 6379 (кеширование)
- **phpMyAdmin**: порт 8080 (управление БД)
- **API Server**: порт 3001 (backend)
- **Frontend**: порт 5173 (React приложение)

## 📈 Функциональность

### Основные функции
- ✅ **Импорт данных** через URL API (Honkai Star Rail и Genshin Impact)
- ✅ **Импорт данных** через JSON файлы с валидацией
- ✅ **Отслеживание питы** по всем баннерам с визуализацией
- ✅ **Детальная статистика** круток с графиками и диаграммами
- ✅ **Визуализация данных** с интерактивными чартами
- ✅ **Адаптивный дизайн** с темной темой
- ✅ **Поддержка нескольких игр** в одном интерфейсе
- ✅ **JWT аутентификация** с ролевой моделью
- ✅ **Админ-панель** с полным управлением системой

### Функции админ-панели
- ✅ **Управление пользователями** - CRUD операции, смена ролей
- ✅ **Управление баннерами** - добавление, редактирование баннеров
- ✅ **Управление переводами** - мультиязычная поддержка (EN/RU)
- ✅ **Управление кешем** - мониторинг Redis, настройка TTL
- ✅ **Системная статистика** - здоровье сервера, метрики производительности
- ✅ **Логирование** - структурированные логи с ротацией
- ✅ **Мониторинг кеша** - hit/miss ratio, очистка кеша

### Планируемые функции
- 🔄 Автоматическое обновление данных через API
- 🔄 Сравнение статистики с другими игроками
- 🔄 Экспорт статистики в различные форматы
- 🔄 Push-уведомления о важных событиях
- 🔄 Мобильное приложение (React Native)
- 🔄 Расширенная поддержка других gacha-игр
- 🔄 Интеграция с Discord/Twitter для автоматических постов
- 🔄 Темная/светлая тема с сохранением предпочтений

## 🐛 Решение проблем

### Общие проблемы

**Ошибка подключения к базе данных:**
```bash
# Убедитесь, что MySQL запущен
npm run docker:up

# Проверьте логи контейнеров
npm run docker:logs

# Проверьте статус MySQL
docker ps | grep mysql
```

**Проблемы с Redis кешем:**
```bash
# Проверьте статус Redis
docker ps | grep redis

# Очистите кеш через админ-панель
# Или через API: POST /api/admin/cache/clear

# Проверьте логи Redis
docker logs hsr-gacha-redis
```

**Проблемы с аутентификацией:**
```bash
# Проверьте JWT секрет в .env файле
# Убедитесь, что токен не истек
# Попробуйте перезайти в систему
```

**Проблемы с CORS:**
- Убедитесь, что сервер запущен на порту 3001
- Проверьте настройки CORS в `server/src/index.ts`
- Для разработки добавьте `http://localhost:5173` в CORS_ORIGIN

**Ошибки импорта данных:**
- Проверьте формат JSON файла
- Убедитесь, что UID корректный
- Проверьте логи сервера на ошибки валидации

**Проблемы с изображениями:**
- Проверьте права доступа к папке `client/public/images/`
- Убедитесь, что изображения оптимизированы
- Проверьте настройки Sharp в middleware

**Ошибки TypeScript:**
```bash
# Переустановите зависимости
npm run setup

# Очистите node_modules и package-lock.json
rm -rf node_modules package-lock.json
npm install

# Проверьте типы
npm run type-check
```

**Проблемы с логами:**
```bash
# Проверьте права доступа к папке logs/
chmod 755 server/logs/

# Проверьте конфигурацию Winston
# Логи должны писаться в server/logs/
```

**Проблемы с Docker:**
```bash
# Пересоберите контейнеры
npm run docker:rebuild

# Проверьте использование портов
netstat -tulpn | grep :3306
netstat -tulpn | grep :6379
netstat -tulpn | grep :3001
```

## � Структура проекта

```
/
├── client/                 # Frontend React приложение
│   ├── public/            # Статические файлы
│   │   └── images/        # Изображения персонажей и баннеров
│   ├── src/
│   │   ├── components/    # Переиспользуемые компоненты
│   │   ├── pages/         # Страницы приложения
│   │   │   ├── AdminPanel.tsx    # Админ-панель
│   │   │   ├── Dashboard.tsx     # Главная панель пользователя
│   │   │   └── ...
│   │   ├── context/       # React контексты
│   │   ├── hooks/         # Пользовательские хуки
│   │   └── utils/         # Утилиты
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Backend Node.js приложение
│   ├── prisma/            # Схема базы данных
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API маршруты
│   │   ├── services/      # Бизнес-логика
│   │   ├── types/         # TypeScript типы
│   │   └── utils/         # Утилиты сервера
│   ├── logs/              # Логи приложения
│   ├── package.json
│   └── tsconfig.json
├── database/              # Инициализация базы данных
│   └── init.sql
├── scripts/               # PowerShell скрипты для получения данных
│   ├── hsr_getlink.ps1    # Скрипт для HSR
│   ├── get-genshin-url.ps1 # Скрипт для Genshin
│   └── ...
├── docker-compose.yml     # Docker конфигурация
├── package.json           # Корневые скрипты
└── README.md
```

### Ключевые файлы

- **`client/src/pages/AdminPanel.tsx`** - Админ-панель с управлением системой
- **`server/src/routes/admin.ts`** - API маршруты админ-панели
- **`server/src/services/cacheService.ts`** - Сервис кеширования Redis
- **`server/prisma/schema.prisma`** - Схема базы данных
- **`docker-compose.yml`** - Конфигурация Docker сервисов

MIT License - см. файл [LICENSE](LICENSE)

## 🤝 Участие в разработке

Мы приветствуем вклад в развитие проекта! Вот как вы можете помочь:

### Для контрибьюторов
1. **Форкните репозиторий** на GitHub
2. **Создайте ветку** для новой функции: `git checkout -b feature/amazing-feature`
3. **Сделайте коммит изменений**: `git commit -m 'Add amazing feature'`
4. **Отправьте Pull Request** с подробным описанием изменений

### Требования к PR
- Код должен проходить линтинг: `npm run lint`
- Все тесты должны проходить
- Добавьте описание изменений в PR
- Обновите документацию при необходимости

### Виды вкладов
- 🐛 **Исправление багов** - найдите и исправьте проблемы
- ✨ **Новые функции** - добавьте полезные возможности
- 📚 **Документация** - улучшите README и код
- 🎨 **UI/UX** - улучшите пользовательский интерфейс
- 🧪 **Тесты** - добавьте автоматические тесты
- 🌐 **Переводы** - добавьте поддержку новых языков

## 📞 Поддержка

### Документация
- 📖 **[API Documentation](docs/api.md)** - подробная документация API
- 🏗️ **[Architecture Guide](docs/architecture.md)** - архитектура проекта
- 🚀 **[Deployment Guide](docs/deployment.md)** - руководство по развертыванию

### Сообщество
- 🐛 **[Issues](https://github.com/Enable-V/honkai/issues)** - сообщите о багах
- 💡 **[Discussions](https://github.com/Enable-V/honkai/discussions)** - обсудите идеи
- 📧 **Email**: для серьезных вопросов

### Отладка проблем
```bash
# Проверьте логи сервера
tail -f server/logs/combined.log

# Проверьте логи ошибок
tail -f server/logs/error.log

# Проверьте статус системы
curl http://localhost:3001/api/admin/health

# Проверьте статус кеша
curl http://localhost:3001/api/admin/cache/info
```

### Популярные проблемы
- **"Redis connection failed"** - проверьте `docker-compose.yml`
- **"Database connection error"** - выполните `npm run docker:up`
- **"Authentication failed"** - проверьте JWT_SECRET в `.env`
- **"Image not loading"** - проверьте права доступа к `client/public/images/`

## 📊 Метрики проекта

- **⭐ Stars**: показывает интерес сообщества
- **🍴 Forks**: количество форков проекта
- **🐛 Issues**: активные проблемы и фичи
- **✅ Pull Requests**: вклад сообщества
- **📦 Releases**: стабильные версии

## 🎯 Roadmap

### Версия 2.0 (Текущая)
- ✅ Полная админ-панель
- ✅ Redis кеширование
- ✅ Многоязычная поддержка
- ✅ Система логирования

### Версия 2.1 (Планируется)
- 🔄 Автоматическое обновление данных
- 🔄 Экспорт статистики
- 🔄 Push-уведомления
- 🔄 Темная/светлая тема

### Версия 3.0 (Будущее)
- 📱 Мобильное приложение
- 🤖 Discord/Twitter интеграция
- 📊 Расширенная аналитика
- 🌍 Поддержка других gacha-игр

---

## 📝 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

**Автор**: [Enable-V](https://github.com/Enable-V)

⭐ **Не забудьте поставить звезду репозиторию, если проект оказался полезным!**
