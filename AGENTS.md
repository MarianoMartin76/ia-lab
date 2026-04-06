# AGENTS.md - Proyecto ABM Empleados

## Descripción del Proyecto

Aplicación full-stack con ABM de empleados (CRUD completo), pipeline CI/CD con auto-heal usando AI.

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Node.js + Express |
| ORM | Prisma + SQLite |
| Frontend | React + Vite + TailwindCSS |
| CI/CD | GitHub Actions |
| AI | OpenCode (fallback: Ollama local) |

## Estructura del Proyecto

```
ia-lab/
├── SPEC.md                 # Especificación del proyecto
├── AGENTS.md               # Este archivo
├── .github/
│   └── workflows/
│       └── ci-cd.yml       # Pipeline CI/CD
├── backend/
│   ├── src/
│   │   ├── routes/         # Endpoints API
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── services/       # Servicios auxiliares
│   │   └── index.js        # Entry point
│   ├── prisma/
│   │   └── schema.prisma  # Modelo de datos
│   ├── tests/              # Tests
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/    # Componentes React
    │   ├── pages/          # Páginas
    │   └── App.jsx         # Componente principal
    ├── tests/              # Tests
    └── package.json
```

## Spec del API (SPEC.md)

### Endpoints
- `GET /api/employees` - Listar empleados
- `POST /api/employees` - Crear empleado
- `GET /api/employees/:id` - Obtener empleado
- `PUT /api/employees/:id` - Actualizar empleado
- `DELETE /api/employees/:id` - Eliminar empleado

### Modelo de Datos
```prisma
model Employee {
  id          String   @id @default(uuid())
  name        String
  email       String   @unique
  department  String
  position    String
  hireDate    DateTime
  status      Status   @default(ACTIVE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Status {
  ACTIVE
  INACTIVE
}
```

## Comandos Útiles

### Backend
```bash
cd backend
npm install
npx prisma db push      # Crear/migrar DB
npm run dev             # Dev server
npm test                # Run tests
```

### Frontend
```bash
cd frontend
npm install
npm run dev             # Dev server
npm run build           # Build producción
npm test                # Run tests
```

## GitHub Actions Pipeline

1. **validate-spec** - Verifica SPEC.md existe y formato válido
2. **build** - Instala dependencias y compila
3. **test** - Ejecuta tests con coverage
4. **auto-heal** - Si tests fallan, AI genera fix (max 3 intentos)
5. **merge** - Auto-merge si pasa, fallback manual si falla

## Notas para Agentes

### Subagentes Disponibles

Este proyecto tiene acceso a subagentes especializados que deben utilizarse según la tarea:

| Subagente | Uso recomendado |
|-----------|-----------------|
| `frontend-expert` | React components, Vite config, Tailwind |
| `node-backend-expert` | Express APIs, Node.js, Prisma |
| `explorer` | Búsqueda en codebase, entender estructura |
| `code-reviewer` | Revisión de código, best practices |
| `ci-cd-expert` | GitHub Actions, pipelines |

**Ejemplo de uso:**
```bash
# Para tareas de frontend
Task(description="Crear nuevo componente", prompt="...", subagent_type="frontend-expert")

# Para tareas de backend
Task(description="Agregar endpoint", prompt="...", subagent_type="node-backend-expert")
```

### Skills Disponibles

Estos skills están instalados y deben activarse según necesidad:

| Skill | Cuándo usar |
|-------|-------------|
| `nodejs-backend-patterns` | Construir servicios Node.js, Express, auth |
| `prisma-database-setup` | Configurar/migrar base de datos Prisma |
| `vercel-react-best-practices` | Optimizar React/Next.js performance |
| `vite` | Configuración Vite, plugins, SSR |
| `find-skills` | Buscar funcionalidad adicional |

**Ejemplo de activación:**
```bash
# Cargar skill para tareas específicas
skill(name="nodejs-backend-patterns")
skill(name="prisma-database-setup")
```

### Directrices de Uso

1. **Tareas simples**: Resolver directamente sin subagentes
2. **Tareas complejas**: Usar subagentes especializados
3. **Configuración de DB**: Activar skill `prisma-database-setup`
4. **Performance React**: Consultar `vercel-react-best-practices`
5. **CI/CD**: Usar subagente `ci-cd-expert` para pipelines

### Recomendaciones

- Mantener el código limpio y bien estructurado
- Agregar tests cuando se modifica funcionalidad
- Antes de hacer cambios significativos, revisar SPEC.md
- Si hay dudas sobre el stack, consultar este archivo

- Usar Prisma para abstracción de DB (permite migración fácil a PostgreSQL después)
- Frontend usar Tailwind para estilos rápidos
- Los tests deben cubrir al menos 80% del código
- Si auto-heal falla 3 veces, marcar PR para revisión manual
- Dejar camino para auth (estructura de roles) pero no implementar aún