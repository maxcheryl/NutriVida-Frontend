# Clínica NutriVida — Frontend

Proyecto de frontend correspondiente a la **Evaluación 3 (IE3)** de la asignatura **DSY1104**. Es una aplicación web para que clientes de la Clínica NutriVida consulten servicios nutricionales y realicen reservas.

## Sobre el proyecto

Este repositorio contiene la interfaz de usuario de NutriVida. La aplicación consume la API REST Spring Boot del repositorio backend para obtener el catálogo y gestionar autenticación, perfiles y órdenes.

## Funcionalidades

- Inicio con productos destacados cargados desde la API.
- Catálogo de servicios, categorías, filtros y vista de detalle.
- Carrito y confirmación de reservas; consulta del historial de órdenes.
- Registro, inicio y cierre de sesión; persistencia y renovación de sesión mediante cookies JWT `HttpOnly`.
- Perfil de usuario y restricciones de rutas y acciones según el rol.
- Paneles de administración y recepción para las funciones autorizadas.
- Formularios con validaciones y mensajes en español.

### Roles

- **Administrador:** gestiona usuarios, productos, categorías y órdenes.
- **Recepcionista:** gestiona las funciones de recepción, como modificar cupos/stock, registrar clientes y consultar órdenes.
- **Cliente:** consulta servicios, crea reservas, revisa su historial y administra su perfil.

Las operaciones disponibles están limitadas también por los permisos que aplica el backend.

## Endpoints utilizados

La API local usa el prefijo `http://localhost:8080/api/v1`. Entre los recursos consumidos por el frontend están:

| Recurso | Operaciones |
| --- | --- |
| `/auth` | `POST /login`, `/registro`, `/refresh`, `/logout`; `GET /me` |
| `/productos` | `GET` y `GET /{identificador}`; `POST`; `PUT /{identificador}` y `PUT /{identificador}/stock`; `DELETE /{identificador}` |
| `/categorias` | `GET` y `GET /{id}`; `POST`; `PUT /{id}`; `DELETE /{id}` |
| `/usuarios` | `GET` y `GET /{id}`; `POST`; `PUT /{id}` y `PUT /{id}/activar`; `DELETE /{id}` |
| `/ordenes` | `POST`; `GET /mias`, `GET`, `GET /{id}`; `PUT /{id}/cancelar` |
| `/perfil` | `GET`; `PUT` |

El inicio de sesión, registro, renovación/cierre de sesión y las consultas `GET` de productos y categorías son públicos. Las demás operaciones requieren autenticación y permisos de rol. Los errores de la API se responden en JSON.

Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)  
Especificación OpenAPI: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

## Credenciales de demostración

El backend crea estas cuentas al ejecutar sus migraciones iniciales:

| Rol | Correo |
| --- | --- |
| Administrador | `admin@duocuc.cl` |
| Recepcionista | `recepcion@duocuc.cl` |
| Cliente | `cliente@duocuc.cl` |

**Contraseña común:** `Nutrivida2026`

Son cuentas compartidas para demostración local. No deben utilizarse en producción; reemplázalas por credenciales seguras antes de desplegar.

## Tecnologías utilizadas

- React 19, TypeScript 5.8 y Vite 6.
- Bootstrap 5 y Bootstrap Icons.
- Axios para las solicitudes HTTP.
- React Router 7 para navegación y rutas protegidas.
- API relacionada: Java 21, Spring Boot 4.1.2, MySQL y Spring Security.

## Estructura del proyecto

```text
Frontend/
├── src/
│   ├── api/          # Axios y configuración de la API
│   ├── assets/       # Recursos estáticos
│   ├── components/   # Componentes reutilizables y protección de rutas
│   ├── constants/    # Constantes de la aplicación
│   ├── contexts/     # Estado compartido de sesión, carrito y notificaciones
│   ├── data/         # Datos auxiliares
│   ├── layout/       # Navbar, footer y estructura compartida
│   ├── pages/        # Vistas de la aplicación
│   ├── services/     # Funciones de acceso a recursos del backend
│   ├── types/        # Tipos TypeScript
│   ├── ui/           # Elementos de interfaz reutilizables
│   └── utils/        # Validaciones y utilidades
├── package.json
└── vite.config.ts
```

## Requisitos

- Node.js y npm.
- Un navegador web moderno.
- El backend NutriVida iniciado en `http://localhost:8080`.
- Para que el backend funcione: JDK 21 y MySQL con la base `nutrivida` preparada. Consulta el README del repositorio backend para sus pasos de instalación.

La dirección de la API está configurada en `src/api/axiosConfig.ts` como `http://localhost:8080/api/v1`. Para otra dirección, actualiza esa configuración y permite el origen del frontend en CORS en el backend.

## Pasos para ejecutar

1. Inicia MySQL y el backend. La base de datos debe estar creada y Flyway debe haber ejecutado sus migraciones.
2. Desde la raíz de este repositorio, instala dependencias e inicia Vite:

   ```bash
   npm install
   npm run dev
   ```

3. Abre la dirección que muestra Vite, normalmente [http://localhost:5173](http://localhost:5173).

Para generar la compilación de producción:

```bash
npm run build
```

## Notas de seguridad

- La sesión usa cookies JWT `HttpOnly`; no almacenes ni publiques tokens de sesión.
- Las credenciales y la configuración incluidas son solo para desarrollo y demostración local.
- Configura credenciales propias y seguras antes de publicar o desplegar el sistema.
