-- 🚀 AUTOMATIZACIÓN: Creación de Acciones en Tablero de Ejecución
-- Cuando una propuesta pasa a 'aprobado', se crea un clon con estado 'ejecucion'.

BEGIN;

-- 1️⃣ Función del Trigger
CREATE OR REPLACE FUNCTION public.handle_proposal_approval()
RETURNS TRIGGER AS $$
DECLARE
  existing_action_id uuid;
  new_resources jsonb;
BEGIN
  -- Solo actuar si el estado cambia a 'aprobado'
  IF NEW.status = 'aprobado' AND OLD.status <> 'aprobado' THEN
    
    -- Verificar si ya existe una acción generada para esta propuesta
    -- Buscamos en el campo resources->>'source_id'
    SELECT id INTO existing_action_id
    FROM public.solicitudes
    WHERE resources->>'source_id' = NEW.id::text
    LIMIT 1;

    -- Si NO existe, creamos la acción
    IF existing_action_id IS NULL THEN
      
      -- Preparamos los recursos incluyendo el source_id y copiando el checklist si existe
      new_resources := coalesce(NEW.resources, '{}'::jsonb) || 
                       jsonb_build_object(
                         'source_id', NEW.id,
                         'created_from_proposal', true,
                         'original_approver', auth.uid() -- El usuario que aprobó (si se ejecuta en contexto auth)
                       );

      INSERT INTO public.solicitudes (
        user_id,
        area,
        activity_type,
        description,
        status, -- 'ejecucion' para que aparezca en "Pendiente" del Tablero
        event_date,
        event_time,
        attendees,
        resources,
        created_at
      ) VALUES (
        NEW.user_id, -- Mismo dueño original (o podría asignarse a un coordinador)
        NEW.area,
        NEW.activity_type, -- Mismo título
        NEW.description,
        'ejecucion', -- ESTADO CLAVE: Inicia como Pendiente de Ejecución
        NEW.event_date,
        NEW.event_time,
        NEW.attendees,
        new_resources,
        now()
      );
      
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2️⃣ Crear el Trigger
DROP TRIGGER IF EXISTS on_proposal_approved ON public.solicitudes;

CREATE TRIGGER on_proposal_approved
AFTER UPDATE ON public.solicitudes
FOR EACH ROW
EXECUTE FUNCTION public.handle_proposal_approval();

COMMIT;
