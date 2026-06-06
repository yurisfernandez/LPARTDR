# Leads Panel

App separada para recibir leads desde la landing y administrarlos en un panel interno.

## Configuracion

1. Instalar dependencias:

```bash
npm install
```

2. Copiar variables de entorno:

```bash
cp .env.example .env
```

3. Completar `.env` con:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INTERNAL_API_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `LANDING_ORIGIN`

4. Ejecutar el SQL de `sql/setup.sql` en Supabase.

5. Iniciar la app:

```bash
npm run dev
```

Panel: `http://localhost:3000`

## API

### Crear lead

`POST /api/leads`

Header:

```text
X-Internal-Api-Key: <INTERNAL_API_KEY>
```

Body:

```json
{
  "nombre": "Juan Perez",
  "telefono": "11 1234-5678",
  "lesion": "Dolor lumbar",
  "enBlanco": "si",
  "tiempo": "menos18",
  "source": "landing-art"
}
```

### Login del panel

`POST /api/login`

```json
{
  "username": "<ADMIN_USERNAME>",
  "password": "<ADMIN_PASSWORD>"
}
```

### Listar leads

`GET /api/leads`

Requiere sesion iniciada.

### Actualizar estado

`PATCH /api/leads/:id`

```json
{
  "status": "contacted"
}
```

Estados validos: `new`, `contacted`, `closed`.
