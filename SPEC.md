# SPEC.md - ABM Empleados

## 1. Project Overview

- **Nombre**: ABM Empleados
- **Tipo**: Full-stack Web Application
- **Descripción**: Sistema de gestión de empleados con CRUD completo, dashboard y API RESTful
- **Usuario objetivo**: Administradores de recursos humanos (demo)

---

## 2. API Specification

### Base URL
```
/api/employees
```

### Endpoints

| Método | Path | Descripción |
|--------|------|-------------|
| GET | / | Listar todos los empleados |
| POST | / | Crear nuevo empleado |
| GET | /:id | Obtener empleado por ID |
| PUT | /:id | Actualizar empleado |
| DELETE | /:id | Eliminar empleado |

### Data Model

```typescript
interface Employee {
  id: string;          // UUID
  name: string;        // Required, min 2 chars
  email: string;       // Required, unique, valid email
  department: string;  // Required
  position: string;    // Required
  hireDate: Date;      // Required
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}
```

### Responses

- **200**: Success
- **201**: Created
- **400**: Validation error
- **404**: Not found
- **500**: Server error

---

## 3. Frontend Specification

### Pages

1. **Dashboard** (`/`)
   - Tabla de empleados
   - Estadísticas rápidas (total, activos, inactivos)
   - Botón para crear nuevo empleado

2. **Employee Form** (`/employee/new`, `/employee/:id/edit`)
   - Formulario con validaciones
   - Campos: name, email, department, position, hireDate, status

### Components

- `EmployeeTable` - Tabla con paginación
- `EmployeeForm` - Formulario de creación/edición
- `EmployeeCard` - Vista de card individual
- `StatsCard` - Tarjeta de estadísticas
- `Modal` - Modal para confirmaciones
- `Button` - Botón reutilizable
- `Input` - Input con validación
- `Select` - Select dropdown

### UI/UX

- **Estilo**: Clean, moderno, profesional
- **Colores**: 
  - Primary: Blue (#3B82F6)
  - Success: Green (#10B981)
  - Danger: Red (#EF4444)
  - Background: Gray-50
- **Responsive**: Mobile-first
- **Feedback**: Loading states, toast notifications

---

## 4. Tech Stack

| Layer | Technology |
|-------|------------|
| Backend Runtime | Node.js 20+ |
| Framework | Express.js |
| ORM | Prisma |
| Database | SQLite |
| Frontend | React 18 + Vite |
| Styling | TailwindCSS |
| Testing | Vitest + Supertest |
| HTTP Client | Fetch API |

---

## 5. Acceptance Criteria

- [ ] API responde correctamente a los 5 endpoints
- [ ] Validaciones de datos funcionan (email único, campos requeridos)
- [ ] Frontend muestra lista de empleados
- [ ] Frontend permite crear empleado
- [ ] Frontend permite editar empleado
- [ ] Frontend permite eliminar empleado
- [ ] Tests pasan con coverage > 80%
- [ ] Pipeline CI/CD funciona correctamente
- [ ] Auto-heal genera fix cuando tests fallan

---

## 6. Non-Functional Requirements

- **Performance**: < 200ms response time
- **Security**: Input sanitization, no SQL injection (Prisma handles this)
- **Maintainability**: Clean code, tests, documentation
- **Extensibilidad**: Estructura para agregar auth después