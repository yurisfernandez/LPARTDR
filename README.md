# Landing ART + Leads Panel

Este workspace contiene:

- Landing estatica en la raiz.
- App separada de panel/API en `leads-panel/`.

## Landing en Coolify

Configurar estas variables de entorno en el servicio de la landing:

```env
LEADS_API_ENDPOINT=https://tu-dominio-panel.com/api/leads
LEADS_API_KEY=<mismo INTERNAL_API_KEY del panel>
```

Usar como build command:

```bash
npm run build
```

El build genera `config.js` desde variables de entorno. Ese archivo esta ignorado por Git.

## Panel en Coolify

Configurar el servicio del panel con root directory:

```text
leads-panel
```

Install command:

```bash
npm ci
```

Start command:

```bash
npm start
```

Variables requeridas:

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
INTERNAL_API_KEY=
ADMIN_USERNAME=
ADMIN_PASSWORD=
SESSION_SECRET=
LANDING_ORIGIN=https://tu-dominio-landing.com
```

`LEADS_API_KEY` de la landing debe tener el mismo valor que `INTERNAL_API_KEY` del panel.
