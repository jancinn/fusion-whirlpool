# Flujo de Gobierno - Iglesia Nuevo Nacimiento

Este documento describe el flujo de aprobación y ejecución implementado en la aplicación, basado en la estructura jerárquica de la iglesia.

## 1. Roles y Jerarquía

*   **Director de Ministerio:** (Ej. Jóvenes, Alabanza)
    *   *Función:* Propone eventos y actividades.
    *   *Acceso:* Solo ve `Inicio` (Calendario) y `Nueva Propuesta`. No ve procesos internos.
*   **Coordinador de Área (Ministerial):**
    *   *Función:* Filtra y avala las propuestas de sus directores. Es el responsable de la calidad de la propuesta.
    *   *Acceso:* Ve `Agenda / Aprobaciones` para dar el "Aval".
*   **Coordinador Operativo:**
    *   *Función:* Ejecuta la logística (Músculo).
    *   *Acceso:* Ve `Tablero de Ejecución` (ToDo) y `Agenda`.
*   **Administrador General (Pastor) y Staff/Secretaria:**
    *   *Función:* Toman decisiones finales en la Junta de Coordinación.
    *   *Acceso:* Acceso total, incluyendo `Generador de Actas`.

## 2. El Flujo del "Río"

### Fase 1: Nacimiento (Propuesta)
*   El **Director** crea una propuesta en `/propuestas`.
*   Define: Título, Fecha, Visión, Justificación y **Requerimientos Operativos**.
*   Estado inicial: `pendiente`.

### Fase 2: Filtrado (Aval)
*   El **Coordinador de Área** revisa la propuesta en `/aprobaciones`.
*   Si está de acuerdo, le da clic a **"Avalar"**.
*   Estado cambia a: `avalado`.
*   *Nota:* Si el Coordinador rechaza, muere ahí. No llega al Admin.

### Fase 3: La Junta (Decisión)
*   El **Admin/Secretaria** abre `/actas` (Generador de Actas).
*   A la izquierda aparecen todas las solicitudes con estado `avalado`.
*   A la derecha se pueden agregar **Asuntos Generales / Urgencias** (improvisaciones).
*   Se decide: Aprobar o Rechazar.
*   Al finalizar, se da clic en **"Cerrar Acta"**.
*   Estado cambia a: `aprobado` (para las aceptadas).

### Fase 4: Ejecución (Músculo)
*   El **Coordinador Operativo** revisa `/todo` (Tablero de Ejecución).
*   Las propuestas `aprobadas` aparecen automáticamente en la columna "Por Iniciar".
*   El Operativo inicia la tarea (`en_proceso`), gestiona el Checklist de actividades y finalmente la marca como `terminado`.

## 3. Notas Técnicas
*   **Tablas:** Todo se maneja en la tabla `solicitudes` de Supabase.
*   **Estados:** `pendiente` -> `avalado` -> `aprobado` -> `en_proceso` -> `terminado`.
*   **Permisos:** Controlados en `Layout.jsx` mediante el array de `roles`.
