#chiper

Chiper — это медиа-платформа для инсайдеров и датамайнеров, публикующих утечки информации об играх, слухи о разработке и скрытые новости индустрии развлечений.

## Структура

```text
backend/
frontend/
assets/
src/
```

## Стек

- Бэкенд: Django, Python
- Фронтенд: React, Vite

## Быстрый старт

### Бэкенд

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Фронтенд

```bash
cd frontend
npm install
npm run dev
```

## Следующие шаги

- Добавить приложения Django для постов, категорий, источников и профилей пользователей
- Подключить React к API Django
- Добавить процесс аутентификации и модерации