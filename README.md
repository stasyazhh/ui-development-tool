# UI Development Tool

Инструмент для визуальной разработки мобильных интерфейсов с помощью AI-ассистента. Создавайте проекты, проектируйте UI, общайтесь с ассистентом на естественном языке и мгновенно получайте готовый результат.

## Возможности

- **Проекты** — создавайте, переименовывайте и удаляйте проекты через боковую панель.
- **Визуальный конструктор** — перетаскивайте компоненты, редактируйте свойства, настраивайте цвета, размеры и расположение.
- **AI-ассистент** — описывайте желаемые изменения текстом, и ассистент обновит интерфейс.
- **Превью** — запускайте интерактивный превью проекта и тестируйте диалог с ассистентом в реальном времени.
- **История изменений** — отслеживайте все правки UI в панели изменений.

---

## Технологии

### Клиент

- React 19
- Vite 8
- Tailwind CSS v4
- TypeScript

### Сервер

- FastAPI
- PostgreSQL
- psycopg2
- uv

---

## Структура проекта

```
ui-development-tool/
├── client/                 # React + Vite приложение
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   ├── theme.ts
│   │   ├── types.ts
│   │   └── ...
│   ├── workplace-ui/       # Рабочее пространство
│   ├── projects-browser/   # Браузер проектов
│   ├── ui-kit/             # UI-конструктор
│   ├── ui-viewer/          # Превью
│   ├── llm-communicator/   # Панель диалога с AI
│   └── changes-panel/      # Панель изменений
│
└── server/                 # FastAPI бэкенд
    ├── src/server/
    │   ├── main.py         # Точка входа FastAPI
    │   ├── config.py       # Конфигурация
    │   ├── schemas.py      # Pydantic-схемы
    │   ├── ai/             # Клиент LLM
    │   ├── preview/        # Генерация HTML-превью
    │   └── projects_manager/  # Работа с БД
    ├── pyproject.toml
    └── README.md
```

---

## Установка и запуск

### 1. Клонирование репозитория

```bash
git clone <URL репозитория>
cd ui-development-tool
```

### 2. Запуск сервера

```bash
cd server
uv run server
```

Сервер поднимется на `http://localhost:8000`.

#### Альтернативный запуск через uvicorn

```bash
cd server
uv run uvicorn server.main:app --reload
```

### 3. Запуск клиента

В новом терминале:

```bash
cd client
pnpm install
pnpm dev
```

Клиент откроется на порту `8443` (или на том, что указан в переменной `PORT`).


## Переменные окружения

Создайте файл `server/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ui_projects_db
DB_USER=postgres
DB_PASSWORD=password

AI_BASE_URL=https://url
AI_MODEL=your_model
AI_API_KEY=your_api_key_here
```

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `DB_HOST` | Хост PostgreSQL | `localhost` |
| `DB_PORT` | Порт PostgreSQL | `5432` |
| `DB_NAME` | Имя базы данных | `ui_projects_db` |
| `DB_USER` | Пользователь БД | `postgres` |
| `DB_PASSWORD` | Пароль пользователя БД | `password` |
| `AI_BASE_URL` | Базовый URL API LLM | — |
| `AI_MODEL` | Модель LLM | — |
| `AI_API_KEY` | API-ключ для LLM | — |

---

## API

Основные endpoint'ы:

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/projects` | Список проектов |
| POST | `/api/projects` | Создать проект |
| GET | `/api/projects/{id}` | Получить проект с файлами |
| PATCH | `/api/projects/{id}` | Переименовать проект |
| DELETE | `/api/projects/{id}` | Удалить проект |
| GET | `/api/projects/{id}/files` | Файлы проекта |
| POST | `/api/projects/{id}/files` | Создать файл/папку |
| GET | `/api/projects/{id}/ui-state` | Текущее состояние UI |
| PATCH | `/api/projects/{id}/ui-state` | Обновить UI |
| GET | `/api/projects/{id}/ui-changes` | История изменений UI |
| POST | `/api/chat` | Диалог с AI-ассистентом |
| POST | `/api/ui/apply` | Применить изменения UI через AI |
| GET | `/preview/{id}` | HTML-превью проекта |

Полная документация доступна по адресу `http://localhost:8000/docs` после запуска сервера.

---

## Скриншоты

### Главный экран / рабочее пространство

> **Место для скриншота:** общий вид приложения с открытым проектом.

![Главный экран](docs/screenshots/main-screen.png)

### Панель проектов

> **Место для скриншота:** боковая панель со списком проектов и деревом файлов.

![Панель проектов](docs/screenshots/projects-panel.png)

### Визуальный конструктор

> **Место для скриншота:** холст с размещёнными компонентами и панелью свойств.

![Конструктор](docs/screenshots/ui-builder.png)

### Диалог с AI-ассистентом

> **Место для скриншота:** панель LLM-общения с запросом и ответом ассистента.

![AI-ассистент](docs/screenshots/llm-chat.png)

### Превью проекта

> **Место для скриншота:** интерактивный превью с диалогом.

![Превью](docs/screenshots/preview.png)

### История изменений

> **Место для скриншота:** панель с историей правок UI.

![История изменений](docs/screenshots/changes-history.png)

---

## Лицензия

[LICENSE](LICENSE)
