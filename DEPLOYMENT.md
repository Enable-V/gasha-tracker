# 🎉 HSR Gacha Tracker - Готово к использованию!

Поздравляем! Ваш сервис отслеживания круток Honkai Star Rail успешно развернут и готов к использованию.

## ✅ Что работает

### 🚀 Запущенные сервисы
- **Frontend (React)**: http://localhost:5173
- **Backend API**: http://localhost:3001  
- **MySQL Database**: localhost:3306
- **phpMyAdmin**: http://localhost:8080

### 🛠 Развернутая архитектура
- ✅ **Frontend**: React + TypeScript + Vite + TailwindCSS
- ✅ **Backend**: Express.js + TypeScript + Prisma ORM
- ✅ **Database**: MySQL 8.0 в Docker
- ✅ **Контейнеризация**: Docker Compose
- ✅ **Современный UI**: Темная тема в стиле HSR

## 📱 Как использовать

### 1. Получение данных круток
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex "&{$((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/honkai/main/hsr_getlink.ps1'))}"
```

### 2. Импорт данных
1. Откройте http://localhost:5173
2. Перейдите в "Загрузка данных"
3. Введите ваш UID
4. Вставьте полученную ссылку
5. Нажмите "Загрузить данные"

### 3. Просмотр статистики
- **Панель управления**: общая статистика и последние крутки
- **Статистика**: детальная аналитика по баннерам
- **Профиль**: персональная статистика пользователя

## 🔧 Управление сервисами

### Запуск
```bash
# Все сервисы
npm run dev

# Только база данных
docker-compose up -d

# Только сервер
cd server && npm run dev

# Только клиент
cd client && npm run dev
```

### Остановка
```bash
# Остановка Docker
docker-compose down

# Остановка приложения
Ctrl + C в терминалах
```

## 🗄 База данных

### Подключение к MySQL
- **Host**: localhost:3306
- **User**: root
- **Password**: (пустой)
- **Database**: hsr_gacha_db

### Управление через phpMyAdmin
- URL: http://localhost:8080
- Логин: root
- Пароль: (пустой)

## 📊 API Endpoints

### Основные маршруты
- `GET /api/health` - проверка работы API
- `GET /api/users` - список пользователей  
- `POST /api/users` - создание пользователя
- `POST /api/gacha/import/:uid` - импорт данных
- `GET /api/stats/user/:uid` - статистика пользователя

## 🎯 Следующие шаги

### Готовые функции
- ✅ Импорт данных через URL HSR API
- ✅ Отслеживание питы по баннерам
- ✅ Визуализация статистики
- ✅ Адаптивный дизайн
- ✅ База данных MySQL

### Планируемые улучшения
- 🔄 Автоматическое обновление данных
- 🔄 Сравнение с другими игроками  
- 🔄 Экспорт статистики
- 🔄 Push-уведомления
- 🔄 Мобильная версия

## 🚨 Устранение неполадок

### База данных
```bash
# Перезапуск контейнеров
docker-compose restart

# Проверка логов
docker-compose logs mysql
```

### Приложение
```bash
# Переустановка зависимостей
npm run setup

# Очистка кэша
rm -rf node_modules package-lock.json
npm install
```

## 🔗 Полезные ссылки

- **Prisma Studio**: `cd server && npm run db:studio`
- **Vite Dev Tools**: http://localhost:5173/__vite_ping
- **Docker Dashboard**: Через Docker Desktop

---

🎮 **Удачных круток в Honkai Star Rail!** ⭐

Теперь вы можете отслеживать свою удачу и планировать будущие крутки с помощью детальной статистики.
