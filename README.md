# chiper

Chiper is a media platform for insiders and dataminers who publish gaming leaks, development rumors, and hidden entertainment news.

## Structure

```text
backend/
frontend/
  assets/
  src/
```

## Stack

- Backend: Django, Python
- Frontend: React, Vite

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Next steps

- Add Django apps for posts, categories, sources, and user profiles
- Connect React to Django API
- Add authentication and moderation flow
