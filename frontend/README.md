# AVICONTROL - Sistema de Gestión Avícola 🥚

Sistema de gestión para granjas productoras y comercializadoras de huevos.

## Stack
- **Backend:** Django + Strawberry GraphQL + PostgreSQL + JWT
- **Frontend:** React + Vite + TailwindCSS + Apollo Client
- **Auth:** SimpleJWT

## Estructura
- `backend/`: API, modelos, migraciones y autenticación.
- `frontend/`: aplicación web React.

## Acceso administrativo
Abre `/admin-login` en el frontend e inicia sesión con un usuario que tenga rol de administrador.
Para crear datos de demostración, usa `python manage.py seed_avicontrol` desde `backend`.
