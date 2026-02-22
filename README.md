#  Gasha Tracker  Client

**Клиентская часть трекера круток для Honkai Star Rail и Genshin Impact**

[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-4.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

>  Это только клиентская часть приложения. Серверная часть находится в приватном репозитории.

##  Демо

**[gacha-tracker.ru](https://gacha-tracker.ru)**

##  Возможности

###  Поддержка игр
- **Honkai Star Rail**  полный трекинг всех типов баннеров
- **Genshin Impact**  поддержка всех игровых баннеров

###  Аналитика
- Детальная статистика по всем круткам
- Трекинг pity счетчиков для каждого баннера
- Визуализация данных с графиками и диаграммами
- Расчет вероятностей и статистики удачи

###  Аутентификация
- Регистрация и вход по email/паролю
- Вход через **Google** (Firebase Authentication)
- Восстановление пароля через email

###  Импорт данных
- **URL импорт**  автоматический импорт через API игры
- **JSON импорт**  поддержка файлов из расширений pom-moe/paimon-moe

###  Интерфейс
- Адаптивный дизайн (мобильные + десктоп)
- Мультиязычность (RU/EN)
- Изображения персонажей и оружия
- Админ-панель для управления

##  Технологический стек

| Технология | Назначение |
|---|---|
| [React 18](https://reactjs.org/) | UI фреймворк |
| [TypeScript](https://www.typescriptlang.org/) | Типизация |
| [Vite](https://vitejs.dev/) | Сборщик |
| [TailwindCSS](https://tailwindcss.com/) | Стилизация |
| [React Router 6](https://reactrouter.com/) | Маршрутизация |
| [Chart.js](https://www.chartjs.org/) | Графики |
| [Firebase](https://firebase.google.com/) | Google авторизация |
| [Axios](https://axios-http.com/) | HTTP клиент |
| [React Query](https://tanstack.com/query/) | Кэширование запросов |

##  Установка и запуск

### Требования
- Node.js 18+
- npm или yarn

### Установка

`ash
cd client
npm install
`

### Переменные окружения

Создайте `client/.env`:

`env
VITE_API_URL=http://localhost:3003/api

# Firebase (для Google авторизации)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
`

### Запуск

`ash
# Режим разработки
npm run dev

# Сборка для продакшена
npm run build

# Превью сборки
npm run preview
`

##  Структура проекта

`
client/
 public/           # Статические файлы
    images/       # Изображения
    robots.txt
    sitemap.xml
 src/
    components/   # React компоненты
       auth/     # Компоненты авторизации
       BannerImage.tsx
       CharacterImage.tsx
       ImageWithFallback.tsx
       Layout.tsx
    context/      # React контексты
       AuthContext.tsx
    pages/        # Страницы
       Home.tsx
       Dashboard.tsx
       Statistics.tsx
       BannerDetails.tsx
       Upload.tsx
       UserProfile.tsx
       AdminPanel.tsx
       ...
    firebaseConfig.ts
    App.tsx
    main.tsx
    index.css
 index.html
 package.json
 tailwind.config.js
 tsconfig.json
 vite.config.ts
`

##  Скрипты для импорта

В папке `scripts/` находятся PowerShell-скрипты для получения URL истории круток из клиентов игр:

- `hsr_getlink.ps1`  Honkai Star Rail
- `get-genshin-url.ps1`  Genshin Impact

### Использование

`powershell
# Honkai Star Rail
.\scripts\hsr_getlink.ps1

# Genshin Impact
.\scripts\get-genshin-url.ps1
`

URL будет скопирован в буфер обмена. Вставьте его на странице Upload в приложении.

##  Лицензия

MIT License  см. [LICENSE](LICENSE) для деталей.
