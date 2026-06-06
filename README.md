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

Usar como start command:

```bash
npm start
```

El build genera un `config.js` placeholder si Coolify no expone variables durante la fase de build. En produccion, `npm start` sirve `/config.js` dinamicamente desde las variables de entorno runtime del contenedor. Ese archivo esta ignorado por Git.

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
