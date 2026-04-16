# Reporte Tecnico

Aplicacion React + Vite para captura de reportes tecnicos con:

- autenticacion local simple,
- persistencia en MongoDB,
- generacion de PDF sobre la plantilla Xerox ya ajustada,
- historial de reportes,
- comparacion automatica por serie,
- firmas dibujadas para cliente y tecnico.

## Requisitos

- Node.js 20+
- MongoDB accesible por `MONGODB_URI`

## Variables de entorno

Usa `.env.example` como base:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/reporte-tecnico
JWT_SECRET=change-this-secret
PORT=4000
SEED_USERNAME=admin
SEED_PASSWORD=Admin123!
SEED_DISPLAY_NAME=Ing. Demo Tecnico
SEED_EMPLOYEE_NUMBER=IDS-001
```

## Instalacion

```bash
npm install
```

## Desarrollo

Levanta frontend y API en paralelo:

```bash
npm run dev
```

- Frontend Vite: `http://127.0.0.1:5173`
- API Express: `http://127.0.0.1:4000`

## Usuario inicial

Si la coleccion `users` esta vacia, el servidor crea automaticamente:

- Usuario: `admin`
- Contrasena: `Admin123!`

## Scripts

- `npm run dev`: frontend + API
- `npm run dev:client`: solo Vite
- `npm run dev:server`: solo API con recarga
- `npm run build`: build del frontend
- `npm run lint`: revision ESLint
- `npm run start`: API en modo normal

## Deploy permanente (Render)

Despliegue en un clic con el `render.yaml` incluido:

- [Deploy to Render](https://render.com/deploy?repo=https://github.com/Diamond16-lab/APP__/tree/reporte-tecnico-app)

Al crear el servicio, solo completa estos secretos en Render:

- `MONGODB_URI`
- `JWT_SECRET`
- `SEED_PASSWORD`

Cuando termine el deploy, Render entrega una URL publica `https://...onrender.com` que ya no depende de tu maquina.

## Flujo del reporte

1. El tecnico inicia sesion.
2. Captura el reporte por pasos.
3. El reporte se valida y se guarda en MongoDB.
4. El PDF se genera usando exactamente el documento persistido.
5. El historial permite buscar por serie, cliente, razon social, tecnico y fecha.
6. El detalle muestra comparacion contra el reporte anterior de la misma serie e historial de partes.
