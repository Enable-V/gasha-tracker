# 🎲 Gasha Tracker

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-4.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

Универсальный трекер круток для **Honkai Star Rail** и **Genshin Impact** с современным веб-интерфейсом, подробной аналитикой и удобным импортом данных.

## 🌐 Демо

**[gacha-tracker.ru](https://gacha-tracker.ru)**

---

## ✨ Возможности

### 🎮 Поддержка игр
- **Honkai Star Rail** — полный трекинг всех типов баннеров
- **Genshin Impact** — поддержка всех игровых баннеров
- **Мульти-игровая статистика** — объединённая аналитика

### 📊 Аналитика и статистика
- Детальная статистика по всем круткам
- Трекинг pity-счётчиков для каждого баннера
- Визуализация данных с графиками и диаграммами (Chart.js)
- Распределение по редкости (3★ / 4★ / 5★)
- Расчёт вероятностей и статистики удачи

### 🔐 Аутентификация
- Регистрация и вход по email/паролю
- Вход через **Google** (Firebase Authentication)
- Восстановление пароля через email

### 🔄 Импорт данных
- **URL импорт** — автоматический импорт через API игры
- **JSON импорт** — файлы из расширений pom-moe / paimon-moe

### 🎨 Интерфейс
- Адаптивный дизайн (мобильные + десктоп)
- Тёмная тема
- Мультиязычность (RU / EN)
- Изображения персонажей и оружия
- Админ-панель для управления

---

## 🛠️ Технологический стек

| Технология | Назначение |
|---|---|
| [React 18](https://reactjs.org/) | UI фреймворк |
| [TypeScript](https://www.typescriptlang.org/) | Типизация |
| [Vite](https://vitejs.dev/) | Сборщик |
| [TailwindCSS](https://tailwindcss.com/) | Стилизация |
| [React Router 6](https://reactrouter.com/) | Маршрутизация |
| [React Query](https://tanstack.com/query/) | Кэширование запросов |
| [Chart.js](https://www.chartjs.org/) | Графики и диаграммы |
| [Firebase](https://firebase.google.com/) | Google авторизация |
| [Axios](https://axios-http.com/) | HTTP клиент |
| [Heroicons](https://heroicons.com/) | Иконки |

---

## 📦 Установка и запуск

### Требования
- Node.js 18+
- npm или yarn

### Установка

```bash
git clone https://github.com/Enable-V/gasha-tracker.git
cd gasha-tracker/client
npm install
```

### Переменные окружения

Создайте файл `client/.env`:

```env
VITE_API_URL=http://localhost:3003/api

# Firebase (для Google авторизации)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Запуск

```bash
# Режим разработки
npm run dev

# Сборка для продакшена
npm run build

# Превью сборки
npm run preview
```

---

## 🔑 Получение данных круток

### Honkai Star Rail

1. Откройте историю круток в игре
2. Запустите PowerShell
3. Выполните команду:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
iex "&{$((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/gasha-tracker/main/scripts/hsr_getlink.ps1'))}"
```

4. URL скопируется в буфер обмена → вставьте на странице Upload

### Genshin Impact

1. Откройте историю молитв в игре
2. Запустите PowerShell
3. Выполните команду:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
iex "&{$((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Enable-V/gasha-tracker/main/scripts/get-genshin-url.ps1'))}"
```

4. URL скопируется в буфер обмена → вставьте на странице Upload

---

## 📁 Структура проекта

```
client/
├── public/                # Статические файлы
│   ├── images/            # Изображения
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── components/        # React компоненты
│   │   ├── auth/          # Компоненты авторизации
│   │   ├── BannerImage.tsx
│   │   ├── CharacterImage.tsx
│   │   ├── ImageWithFallback.tsx
│   │   └── Layout.tsx
│   ├── context/           # React контексты
│   │   └── AuthContext.tsx
│   ├── pages/             # Страницы
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Statistics.tsx
│   │   ├── BannerDetails.tsx
│   │   ├── Upload.tsx
│   │   ├── UserProfile.tsx
│   │   └── AdminPanel.tsx
│   ├── firebaseConfig.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts

scripts/
├── hsr_getlink.ps1          # Получение URL для HSR
└── get-genshin-url.ps1      # Получение URL для Genshin
```

---

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку: `git checkout -b feature/my-feature`
3. Сделайте коммит: `git commit -m "Add my feature"`
4. Отправьте Pull Request

---

## 📄 Лицензия

MIT License — см. файл [LICENSE](LICENSE)

**Автор**: [Enable-V](https://github.com/Enable-V)

⭐ **Поставьте звезду, если проект оказался полезным!**
