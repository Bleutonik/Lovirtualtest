# MI TRABAJO VIRTUAL - Documentación Completa

## Estado Actual
El proyecto está completo y funcional. Solo necesita iniciar los servidores.

## Credenciales
- **Empleado**: `rock` / `123456`
- **Admin**: `admin` / `admin123`

---

## CÓMO INICIAR (2 terminales)

### Terminal 1 - Backend
```bash
cd C:\Users\alexa\lovirtual\server
npm install
del database\database.json   # Borrar DB vieja si existe
node index.js
```
Backend corre en: **http://localhost:3001**

### Terminal 2 - Frontend
```bash
cd C:\Users\alexa\lovirtual
npm install
npm run dev
```
Frontend corre en: **http://localhost:5173** (o siguiente disponible)

---

## Estructura del Proyecto

```
lovirtual/
├── package.json
├── vite.config.js
├── postcss.config.js          # Usa @tailwindcss/postcss
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx                # Router con rutas protegidas
│   ├── index.css              # Tailwind + custom CSS
│   ├── context/
│   │   └── AuthContext.jsx    # Estado global de auth
│   ├── components/
│   │   └── Header.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx      # Pantalla principal
│   │   ├── Tasks.jsx
│   │   ├── Notes.jsx
│   │   ├── Incidents.jsx
│   │   ├── Permissions.jsx
│   │   └── Chat.jsx
│   └── services/
│       ├── api.js             # Base URL: localhost:3001/api
│       ├── auth.js            # login, logout, register
│       ├── attendance.js      # clockIn, clockOut
│       ├── breaks.js          # startBreak, endBreak
│       ├── tasks.js
│       ├── notes.js
│       ├── incidents.js
│       ├── permissions.js
│       ├── announcements.js
│       └── chat.js
│
└── server/
    ├── package.json
    ├── index.js               # Express server puerto 3001
    ├── middleware/
    │   └── auth.js            # JWT middleware
    ├── database/
    │   ├── db.js              # JSON database wrapper
    │   └── database.json      # Auto-generado
    └── routes/
        ├── auth.js
        ├── attendance.js
        ├── breaks.js
        ├── tasks.js
        ├── notes.js
        ├── incidents.js
        ├── permissions.js
        ├── announcements.js
        └── chat.js
```

---

## Funcionalidades Implementadas

### Dashboard
- [x] Banner "MI TRABAJO VIRTUAL"
- [x] Reloj en tiempo real
- [x] Cards de información (horario, notas, acciones rápidas)
- [x] Control de Asistencia (Clock In/Out)
- [x] Sistema de Breaks (AM, Almuerzo, PM)
- [x] Estado de conexión
- [x] Chat interno
- [x] Anuncios recientes
- [x] Navegación a otras páginas

### Autenticación
- [x] Login con JWT
- [x] Persistencia de sesión (localStorage)
- [x] Rutas protegidas
- [x] Logout

### Páginas
- [x] Login - Formulario de acceso
- [x] Dashboard - Panel principal
- [x] Tasks - Gestión de tareas
- [x] Notes - Notas personales
- [x] Incidents - Reportar incidentes
- [x] Permissions - Solicitar permisos
- [x] Chat - Mensajería grupal

### Backend API
- [x] POST /api/auth/login
- [x] POST /api/auth/register
- [x] GET /api/auth/me
- [x] POST /api/attendance/clock-in
- [x] POST /api/attendance/clock-out
- [x] GET /api/attendance/today
- [x] POST /api/breaks/start
- [x] POST /api/breaks/end
- [x] GET /api/breaks/today
- [x] CRUD /api/tasks
- [x] CRUD /api/notes
- [x] CRUD /api/incidents
- [x] CRUD /api/permissions
- [x] GET /api/announcements
- [x] GET/POST /api/chat

---

## Configuración Importante

### postcss.config.js
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### vite.config.js
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### index.css (Tailwind v4)
```css
@import "tailwindcss";
@source "../index.html";
@source "./**/*.{js,jsx}";
```

### server/index.js CORS
```js
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:5179', 'http://localhost:5180'],
  credentials: true
}));
```

---

## Colores del Tema
| Variable | Color | Uso |
|----------|-------|-----|
| --bg-primary | #0a0a0a | Fondo principal |
| --bg-card | #1f2937 | Fondo de cards |
| --border-color | #374151 | Bordes |
| --cyan | #0891b2 | Acento principal |
| --cyan-light | #22d3d1 | Acento hover |
| --red | #ef4444 | Estados negativos |
| --green | #22c55e | Estados positivos |

---

## Hashes de Contraseñas (bcrypt)
```
rock (123456):    $2a$10$9Dk9dcObPzZYCZo4cR6EFeGHZig5dHTpInP7q0ngvsLsJfZb3AYqK
admin (admin123): $2a$10$ZZsAjHNFfXEODMmXOCDnk.8yEqnmlNQYVwn7HqsSE/.AAIxG92ijG
```

---

## Solución de Problemas

### "Pantalla negra después del login"
1. Borrar `server/database/database.json`
2. Reiniciar el backend
3. Los hashes correctos están en `server/database/db.js`

### "Failed to fetch" o errores de conexión
1. Verificar que el backend está corriendo en puerto 3001
2. Verificar CORS en server/index.js

### "Puerto en uso"
```bash
# Windows - matar proceso en puerto 3001
netstat -ano | findstr :3001
taskkill /F /PID [numero]

# O simplemente usar el siguiente puerto disponible
```

### Tailwind no funciona
1. Verificar `@import "tailwindcss"` en index.css
2. Verificar `@tailwindcss/postcss` en postcss.config.js
3. Reinstalar: `npm install`

---

## Dependencias

### Frontend (package.json)
- react
- react-dom
- react-router-dom
- vite
- tailwindcss
- @tailwindcss/postcss
- postcss

### Backend (server/package.json)
- express
- cors
- helmet
- bcryptjs
- jsonwebtoken
- dotenv

---

## Próximos Pasos Sugeridos
1. [ ] Agregar sistema de reportes diarios
2. [ ] Implementar notificaciones push
3. [ ] Agregar panel de administración
4. [ ] Implementar gráficos de estadísticas
5. [ ] Agregar sistema de puntos/gamificación
6. [ ] Responsive design para móviles
7. [ ] Modo offline con service worker
