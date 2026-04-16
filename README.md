# Reporte Tecnico Xerox | IDS Service

Aplicacion web para captura, trazabilidad y generacion de reportes tecnicos con formato Xerox.

> Este repositorio usa `main` como portada de presentacion.
> El desarrollo activo del sistema vive en la rama `reporte-tecnico-app`.

## Enlace Principal Del Proyecto

[Ver rama activa `reporte-tecnico-app`](https://github.com/Diamond16-lab/APP__/tree/reporte-tecnico-app)

## Lo Que Ya Hace La App

- Autenticacion local con sesion segura.
- Flujo guiado de captura de reporte por pasos.
- Guardado real en MongoDB como fuente de verdad.
- Generacion de PDF respetando el formato tecnico.
- Historial con filtros por cliente, serie, fecha y tecnico.
- Comparacion automatica contra reporte previo por serie.
- Firma dibujada de cliente e ingeniero.

## Visualizacion Recomendada En GitHub

1. Abre el selector de ramas.
2. Cambia de `main` a `reporte-tecnico-app`.
3. Revisa README, codigo y configuracion de deploy en esa rama.

## Deploy

El despliegue productivo se gestiona con Render y variables de entorno (`MONGODB_URI`, `JWT_SECRET`, `SEED_PASSWORD`) definidas por ambiente.
