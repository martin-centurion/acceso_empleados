# Ingreso Personal

Web app para registrar ingreso/egreso de empleados con QR por sucursal, geolocalizacion y reportes CSV.

## Estructura
- `server/`: API Node/Express + Supabase
- `client/`: React + Vite

## Requisitos
- Node 18+
- Supabase (PostgreSQL)

## Configuracion

### Base de datos (Supabase)
1) Crear proyecto en Supabase.

2) Ejecutar el esquema (SQL Editor en Supabase):

```bash
# copiar y pegar el contenido de server/sql/schema.supabase.sql
```

### Backend
1) Copiar y editar variables de entorno:

```bash
cp server/.env.example server/.env
```

2) Editar `server/.env`:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `ADMIN_PASSCODE`
- `CORS_ORIGIN` (ej: http://localhost:5173)
- `PUBLIC_APP_URL` (ej: http://localhost:5173)

3) Instalar dependencias y levantar:

```bash
cd server
npm install
npm run dev
```

### Frontend
1) Copiar y editar variables de entorno:

```bash
cp client/.env.example client/.env
```

2) Instalar dependencias y levantar:

```bash
cd client
npm install
npm run dev
```

## Flujo de uso
- Admin entra a `/#/admin` y usa el passcode.
- Crea empleados y sucursales.
- En sucursales, genera QR y pega el link en el establecimiento.
- Empleado escanea el QR y registra ingreso/egreso con geolocalizacion.
- Admin exporta reportes CSV desde el panel.

## Notas
- El token de sucursal viaja en el QR como `/#/check?token=...`.
- Si un empleado tiene PIN, el PIN es requerido al registrar.
