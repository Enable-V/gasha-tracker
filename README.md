# HSR Gacha Tracker

Профессиональный трекер круток для Honkai Star Rail с современным веб-интерфейсом и подробной аналитикой.

## 🌟 Особенности

- **Полная статистика круток** - детальный анализ ваших круток по всем баннерам
- **Трекинг питы** - отслеживание счетчика гарантии для каждого типа банера
- **Визуализация данных** - красивые графики и диаграммы вашей удачи
- **Импорт данных** - поддержка импорта через URL и JSON файлы
- **Современный интерфейс** - адаптивный дизайн с темной темой
- **База данных MySQL** - надежное хранение данных
- **Docker поддержка** - легкое развертывание

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

1. **Закройте игру Honkai Star Rail**

2. **Запустите PowerShell от имени администратора**

3. **Выполните команду:**
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex "&{$((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/honkai/865622de5fcb9b6e2646708a6e1e98e1747cfd64/hsr_getlink.ps1?token=REMOVED_TOKEN'))}"
   ```

4. **Скопируйте полученную ссылку**

### Импорт данных

1. Перейдите на страницу "Загрузка данных"
2. Введите ваш UID из игры
3. Вставьте полученную ссылку или загрузите JSON файл
4. Нажмите "Загрузить данные"

## 🏗 Архитектура

### Frontend (React + TypeScript + Vite)
- **React 18** с TypeScript для типобезопасности
- **Vite** для быстрой разработки и сборки
- **TailwindCSS** для современного дизайна
- **React Query** для управления состоянием сервера
- **React Router** для маршрутизации
- **Chart.js** для визуализации данных

### Backend (Node.js + Express + TypeScript)
- **Express.js** REST API сервер
- **Prisma ORM** для работы с базой данных
- **TypeScript** для типобезопасности
- **Winston** для логирования
- **Helmet** для безопасности

### База данных (MySQL 8.0)
- Оптимизированная схема для хранения данных круток
- Индексы для быстрых запросов
- Поддержка транзакций

### Контейнеризация (Docker)
- Docker Compose для всего стека
- Автоматическая инициализация базы данных
- Изолированная среда разработки

## 📊 API Endpoints

### Пользователи
- `GET /api/users` - Получить всех пользователей
- `GET /api/users/:uid` - Получить пользователя по UID
- `POST /api/users` - Создать/обновить пользователя
- `DELETE /api/users/:uid` - Удалить пользователя

### Крутки
- `GET /api/gacha/user/:uid` - Получить крутки пользователя
- `GET /api/gacha/stats/:uid` - Получить статистику пользователя
- `POST /api/gacha/import/:uid` - Импортировать данные круток

### Статистика
- `GET /api/stats/overall` - Общая статистика
- `GET /api/stats/user/:uid` - Статистика пользователя
- `GET /api/stats/banner/:bannerId` - Статистика банера
- `GET /api/stats/pity/:uid` - Распределение питы

### Загрузка
- `POST /api/upload/json/:uid` - Загрузка JSON файла
- `POST /api/upload/url/:uid` - Загрузка через URL

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

# Открыть Prisma Studio
cd server && npm run db:studio
```

### Сборка для продакшна
```bash
npm run build
```

## 🔧 Конфигурация

### Переменные окружения

**Server (.env):**
```env
DATABASE_URL="mysql://root@localhost:3306/hsr_gacha_db"
PORT=3001
NODE_ENV=development
JWT_SECRET="your-secret-key"
```

**Docker (docker-compose.yml):**
- MySQL: порт 3306
- PhpMyAdmin: порт 8080
- API Server: порт 3001
- Frontend: порт 5173

## 📈 Функциональность

### Основные функции
- ✅ Импорт данных через URL HSR API
- ✅ Импорт данных через JSON файлы
- ✅ Отслеживание питы по всем баннерам
- ✅ Детальная статистика круток
- ✅ Визуализация данных
- ✅ Адаптивный дизайн

### Планируемые функции
- 🔄 Автоматическое обновление данных
- 🔄 Сравнение с другими игроками
- 🔄 Экспорт статистики
- 🔄 Уведомления о важных событиях
- 🔄 Мобильное приложение

## 🐛 Решение проблем

### Общие проблемы

**Ошибка подключения к базе данных:**
```bash
# Убедитесь, что MySQL запущен
npm run docker:up

# Проверьте логи
npm run docker:logs
```

**Проблемы с CORS:**
- Убедитесь, что сервер запущен на порту 3001
- Проверьте настройки CORS в server/src/index.ts

**Ошибки TypeScript:**
```bash
# Переустановите зависимости
npm run setup
```

## 📝 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Сделайте коммит изменений
4. Отправьте Pull Request

## 📞 Поддержка

Если у вас есть вопросы или проблемы:
- Создайте Issue в GitHub
- Проверьте документацию API
- Изучите логи приложения

---

⭐ **Не забудьте поставить звезду репозиторию, если проект оказался полезным!**
