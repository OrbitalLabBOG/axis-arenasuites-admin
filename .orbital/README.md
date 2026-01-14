# 📋 Protocolo HANDOFF — Arena Suites Admin

Este directorio gestiona la comunicación asíncrona entre ORBIX (orquestador) y ejecutores (Codex, Claude, humanos).

## 📁 Estructura

```
.orbital/
├── README.md          # Este archivo
├── config.yaml        # Metadata del proyecto
├── OBJETIVO.md        # Tarea actual asignada (si existe)
├── ACTA_*.md          # Entregas pendientes de revisar
└── historial/         # Actas archivadas
```

## 🔄 Flujo de Trabajo

### Para el Ejecutor:

1. **Leer** `OBJETIVO.md` para entender la tarea
2. **Trabajar** en los entregables
3. **Crear** `ACTA_ENTREGA_YYYY-MM-DD.md` con el resultado
4. **Commit + Push** al repo

### Para ORBIX:

1. **Revisar** con `/handoff revisar axis-arenasuites-admin`
2. **Procesar** el acta y actualizar Supabase
3. **Archivar** el acta en `historial/`
4. **Asignar** nuevo objetivo si hay tareas pendientes

## 📝 Template de ACTA_ENTREGA

```markdown
# ACTA DE ENTREGA — [Título de la tarea]

**Fecha:** YYYY-MM-DD
**Ejecutor:** [Nombre/Sistema]
**Task ID:** [UUID de Supabase]
**Horas reales:** Xh

## Resumen Ejecutivo
[2-3 oraciones describiendo qué se logró]

## Entregables Completados
- [x] Entregable 1
- [x] Entregable 2
- [ ] Entregable 3 (parcial/pendiente)

## Cambios Realizados
| Archivo | Cambio |
|---------|--------|
| `src/...` | Descripción |

## Métricas / Resultados
[Si aplica: performance, tests, coverage, etc.]

## Problemas Encontrados
[Si hubo bloqueantes o decisiones importantes]

## Próximos Pasos Sugeridos
1. [Siguiente tarea lógica]
2. [Mejora identificada]

---
*Generado para protocolo HANDOFF — Orbital Lab*
```

## 🔗 Links

- **Repo:** https://github.com/OrbitalLabBOG/axis-arenasuites-admin
- **Deploy:** https://axis-arenasuites-admin.vercel.app/
- **Supabase:** dlvzvztvqpagaiqkulhr

---
*Protocolo HANDOFF v1.0 — ORBIX*
