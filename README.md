# ABM Empleados

Aplicación full-stack con ABM de empleados (CRUD completo), pipeline CI/CD con auto-heal usando AI.

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Node.js + Express |
| ORM | Prisma + SQLite |
| Frontend | React + Vite + TailwindCSS |
| CI/CD | GitHub Actions |
| AI | OpenCode |

## Estructura del Proyecto

```
ia-lab/
├── SPEC.md                 # Especificación del proyecto
├── AGENTS.md               # Guía para agentes AI
├── .github/
│   └── workflows/
│       └── ci-cd.yml       # Pipeline CI/CD
├── backend/
│   ├── src/
│   │   ├── routes/         # Endpoints API
│   │   ├── controllers/    # Lógica de negocio
│   │   └── index.js        # Entry point
│   ├── prisma/
│   │   └── schema.prisma  # Modelo de datos
│   ├── tests/              # Tests
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/     # Componentes React
    │   ├── pages/          # Páginas
    │   └── App.jsx         # Componente principal
    ├── tests/              # Tests
    └── package.json
```

## API Endpoints

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/employees` | Listar todos los empleados |
| POST | `/api/employees` | Crear nuevo empleado |
| GET | `/api/employees/:id` | Obtener empleado por ID |
| PUT | `/api/employees/:id` | Actualizar empleado |
| DELETE | `/api/employees/:id` | Eliminar empleado |

## Modelo de Datos

```prisma
model Employee {
  id         String   @id @default(uuid())
  name       String
  email      String   @unique
  department String
  position   String
  hireDate   DateTime
  status     String   @default("ACTIVE")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## Desarrollo Local

### Requisitos
- Node.js 20+
- npm

### Instalación y ejecución

```bash
# Instalar dependencias backend
cd backend
npm install
npx prisma db push

# Instalar dependencias frontend
cd ../frontend
npm install

# Ejecutar backend (puerto 3001)
cd backend
npm run dev

# Ejecutar frontend (puerto 5173)
cd frontend
npm run dev
```

### Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## GitHub Actions Pipeline

El pipeline se ejecuta en cada PR a `main`:

1. **validate-spec** - Verifica SPEC.md existe
2. **build-backend** - Instala dependencias y compila backend
3. **build-frontend** - Instala dependencias y compila frontend
4. **test-backend** - Ejecuta tests backend con coverage
5. **test-frontend** - Ejecuta tests frontend
6. **auto-heal** - Si tests fallan, marca PR para revisión manual

## Deployment

Deploy compatible con Dokploy (Docker/self-hosted) o cualquier plataforma que soporte Node.js.

## Licencia

MIT
