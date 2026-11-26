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

## Acceso de clientes
Los clientes nuevos pueden registrarse desde `/registro`. Si el cliente ya existe en la base
pero todavía no tiene contraseña, debe elegir **Activa tu cuenta** y verificar el correo, DNI y
teléfono guardados en su perfil. El código vence a los 10 minutos y se limita a cinco intentos.
En desarrollo, Django muestra el correo y el código en la consola del backend.

En producción, configura `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`,
`EMAIL_HOST_PASSWORD` y `DEFAULT_FROM_EMAIL` en el entorno del backend para enviar el código
al cliente por correo.
