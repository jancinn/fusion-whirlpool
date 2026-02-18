import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Clock, AlertCircle, LayoutGrid, List as ListIcon, ArrowRight, ClipboardList } from 'lucide-react';

// --- Components defined OUTSIDE the main component to prevent re-renders ---

const TaskCard = ({ task, fetchTasks, updateTaskStatus }) => {
    // Initialize checklist from resources JSON
    const [checklist, setChecklist] = useState(task.resources?.checklist || []);
    const [newItem, setNewItem] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isPlanning, setIsPlanning] = useState(false);

    // Logistics State
    const [logistics, setLogistics] = useState({
        startDate: task.event_date,
        endDate: task.event_date,
        location: task.resources?.location || 'Auditorio Principal',
        setupType: task.resources?.setupType || 'Auditorio',
        promoInternal: task.resources?.promoInternal || false,
        promoExternal: task.resources?.promoExternal || false,
        needsSound: task.resources?.needsSound || false
    });

    const completedCount = checklist.filter(i => i.done).length;
    const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

    // Helper to update resources with new checklist
    const updateResourcesWithChecklist = async (newChecklist) => {
        const currentResources = task.resources || {};
        const updatedResources = {
            ...currentResources,
            checklist: newChecklist
        };

        const { error } = await supabase
            .from('solicitudes')
            .update({ resources: updatedResources })
            .eq('id', task.id);

        if (error) console.error("Error updating checklist:", error);
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newItem.trim()) return;
        const updatedList = [...checklist, { text: newItem, done: false }];
        setChecklist(updatedList);
        setNewItem('');
        await updateResourcesWithChecklist(updatedList);
    };

    const toggleItem = async (index) => {
        const updatedList = [...checklist];
        updatedList[index].done = !updatedList[index].done;
        setChecklist(updatedList);
        await updateResourcesWithChecklist(updatedList);
    };

    const handleSaveLogistics = async () => {
        // 1. Auto-generate checklist items based on selections
        let updatedChecklist = [...checklist];

        const addIfNotExists = (text) => {
            if (!updatedChecklist.some(item => item.text === text)) {
                updatedChecklist.push({ text: text, done: false });
            }
        };

        if (logistics.promoInternal) {
            addIfNotExists("Anuncio en Pantallas / Boletín");
            addIfNotExists("Notificar a Directores de Servicio para Anuncio");
        }
        if (logistics.promoExternal) {
            addIfNotExists("Diseño de Flyer para Redes");
            addIfNotExists("Publicar en Facebook / Instagram");
            addIfNotExists("Actualizar página Web");
        }
        if (logistics.setupType === 'Restaurante') {
            addIfNotExists("Montaje de Mesas y Mantelería");
        }
        if (logistics.needsSound) {
            addIfNotExists("Coordinar horario de Sound Check");
            addIfNotExists("Asignar Técnico de Audio");
        }

        // 2. Prepare resources object (Handle null resources safely)
        const currentResources = task.resources || {};
        const updatedResources = {
            ...currentResources,
            checklist: updatedChecklist, // Save checklist INSIDE resources
            logistics_plan: {
                startDate: logistics.startDate,
                endDate: logistics.endDate,
                location: logistics.location,
                setupType: logistics.setupType,
                promoInternal: logistics.promoInternal,
                promoExternal: logistics.promoExternal,
                needsSound: logistics.needsSound
            }
        };

        const { error } = await supabase
            .from('solicitudes')
            .update({
                resources: updatedResources,
                status: 'en_proceso'
            })
            .eq('id', task.id);

        if (error) {
            console.error("Error detallado al guardar logística:", error);
            alert(`Error al guardar logística: ${error.message}`);
        } else {
            setIsPlanning(false);
            fetchTasks();
        }
    };

    // If in Planning Mode
    if (isPlanning) {
        return (
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-primary)', boxShadow: 'var(--shadow-md)' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ClipboardList size={18} /> Planificación Operativa
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>

                    {/* SECCION 1: INFRAESTRUCTURA */}
                    <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-sm)' }}>
                        <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-main)' }}>📍 Infraestructura y Ambiente</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lugar</label>
                                <input
                                    type="text"
                                    value={logistics.location}
                                    onChange={e => setLogistics({ ...logistics, location: e.target.value })}
                                    style={{ width: '100%', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.85rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Montaje</label>
                                <select
                                    value={logistics.setupType}
                                    onChange={e => setLogistics({ ...logistics, setupType: e.target.value })}
                                    style={{ width: '100%', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.85rem', backgroundColor: 'white', color: '#333' }}
                                >
                                    <option value="Auditorio">Auditorio (Sillas)</option>
                                    <option value="Restaurante">Restaurante (Mesas)</option>
                                    <option value="Clase">Tipo Clase</option>
                                    <option value="Libre">Espacio Libre</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECCION 2: DIFUSIÓN */}
                    <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-sm)' }}>
                        <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-main)' }}>📢 Difusión y Medios</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={logistics.promoInternal}
                                    onChange={e => setLogistics({ ...logistics, promoInternal: e.target.checked })}
                                    style={{ accentColor: 'var(--color-primary)' }}
                                />
                                Publicidad Interna (Pantallas/Boletín)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={logistics.promoExternal}
                                    onChange={e => setLogistics({ ...logistics, promoExternal: e.target.checked })}
                                    style={{ accentColor: 'var(--color-primary)' }}
                                />
                                Publicidad Externa (FB, Web, IG)
                            </label>
                        </div>
                    </div>

                    {/* SECCION 3: AUDIO Y TÉCNICA */}
                    <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-sm)' }}>
                        <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-main)' }}>🎹 Audio y Multimedia</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={logistics.needsSound}
                                    onChange={e => setLogistics({ ...logistics, needsSound: e.target.checked })}
                                    style={{ accentColor: 'var(--color-primary)' }}
                                />
                                Requiere Música en Vivo / Micrófonos
                            </label>
                        </div>
                    </div>

                    {/* SECCION 3: CHECKLIST */}
                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Acciones Requeridas (Checklist)</label>
                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                            {checklist.map((item, idx) => (
                                <li key={idx} style={{ fontSize: '0.85rem', padding: '0.25rem 0', borderBottom: '1px dashed var(--border-light)' }}>
                                    • {item.text}
                                </li>
                            ))}
                        </ul>
                        <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="Escribe una tarea personalizada..."
                                style={{ flex: 1, padding: '0.25rem', fontSize: '0.85rem' }}
                            />
                            <button type="submit" style={{ padding: '0.25rem 0.5rem', cursor: 'pointer' }}>+</button>
                        </form>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setIsPlanning(false)} className="btn" style={{ flex: 1, fontSize: '0.85rem' }}>Cancelar</button>
                    <button onClick={handleSaveLogistics} className="btn btn-primary" style={{ flex: 1, fontSize: '0.85rem' }}>
                        Validar y Ejecutar <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        );
    }

    // Normal Card View
    return (
        <div style={{ backgroundColor: 'var(--bg-body)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: '600', textTransform: 'uppercase' }}>
                    {task.activity_type}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date(task.event_date).toLocaleDateString()}
                </span>
            </div>

            <p style={{ fontSize: '0.95rem', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                {(task.description || '').includes('ORDEN DE EJECUCIÓN:')
                    ? (task.description || '').split('ORDEN DE EJECUCIÓN:')[1].split('\n\n')[0].substring(0, 100) + '...'
                    : (task.description || 'Sin descripción').substring(0, 100) + '...'}
            </p>

            {/* Progress Bar */}
            {checklist.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                        <span>Progreso</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', backgroundColor: progress === 100 ? '#22c55e' : 'var(--color-primary)', transition: 'width 0.3s' }}></div>
                    </div>
                </div>
            )}

            {/* Checklist Toggle (View Only or Edit if Active) */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    width: '100%', padding: '0.5rem', marginBottom: '1rem',
                    backgroundColor: 'var(--bg-surface)', border: '1px dashed var(--border-light)',
                    color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer'
                }}
            >
                {isExpanded ? 'Ocultar Desglose' : `Ver Desglose (${completedCount}/${checklist.length})`}
            </button>

            {isExpanded && (
                <div className="animate-fade-in" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '0.5rem' }}>
                        {checklist.map((item, idx) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={item.done}
                                    onChange={() => toggleItem(idx)}
                                    style={{ accentColor: 'var(--color-primary)' }}
                                    disabled={task.status === 'aprobado'} // Can't check items until execution starts
                                />
                                <span style={{ textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text-secondary)' : 'var(--text-main)' }}>
                                    {item.text}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                {/* PLANNING PHASE (Status: aprobado or ejecucion) */}
                {(task.status === 'aprobado' || task.status === 'ejecucion') && (
                    <button
                        onClick={() => setIsPlanning(true)}
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', backgroundColor: 'var(--color-primary)', border: 'none', color: 'white', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                    >
                        <ClipboardList size={14} /> Definir Logística
                    </button>
                )}

                {/* EXECUTION PHASE (Status: en_proceso) */}
                {task.status === 'en_proceso' && (
                    <>
                        <button
                            onClick={() => setIsPlanning(true)} // Re-open planning allows editing and effectively keeps it here or saves again
                            title="Editar Logística"
                            style={{ padding: '0.4rem', fontSize: '0.8rem', backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                        >
                            <ClipboardList size={14} />
                        </button>
                        <button
                            onClick={() => {
                                if (checklist.length > 0 && progress < 100) {
                                    alert("No puedes terminar la orden hasta completar todas las tareas del desglose.");
                                    return;
                                }
                                updateTaskStatus(task.id, 'terminado');
                            }}
                            style={{
                                flex: 1, padding: '0.4rem', fontSize: '0.8rem',
                                backgroundColor: (checklist.length === 0 || progress === 100) ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-surface)',
                                border: (checklist.length === 0 || progress === 100) ? '1px solid #22c55e' : '1px solid var(--border-light)',
                                color: (checklist.length === 0 || progress === 100) ? '#22c55e' : 'var(--text-secondary)',
                                borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem',
                                opacity: (checklist.length > 0 && progress < 100) ? 0.5 : 1
                            }}
                        >
                            Terminar <CheckCircle size={14} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const KanbanColumn = ({ title, subtitle, status, items, icon, fetchTasks, updateTaskStatus }) => (
    <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '1rem', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {icon}
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{title}</h3>
                <span style={{ marginLeft: 'auto', fontSize: '0.8rem', backgroundColor: 'var(--bg-body)', padding: '0.2rem 0.5rem', borderRadius: '1rem' }}>{items.length}</span>
            </div>
            {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, paddingLeft: '1.75rem' }}>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.map(task => (
                <TaskCard key={task.id} task={task} fetchTasks={fetchTasks} updateTaskStatus={updateTaskStatus} />
            ))}
            {items.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                    No hay tareas en esta etapa
                </div>
            )}
        </div>
    </div>
);

// --- Main Component ---

export default function ToDoList() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('board'); // 'board' or 'list'

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            // Fetch items with status 'ejecucion' (Pending Execution), 'en_proceso', or 'terminado'
            // 'aprobado' is excluded because the trigger now creates a separate 'ejecucion' record for them.
            const { data, error } = await supabase
                .from('solicitudes')
                .select('*')
                .in('status', ['ejecucion', 'en_proceso', 'terminado'])
                .order('event_date', { ascending: true });

            if (error) throw error;
            setTasks(data || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            const { error } = await supabase
                .from('solicitudes')
                .update({ status: newStatus })
                .eq('id', taskId);

            if (error) throw error;
            fetchTasks(); // Refresh UI
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ejecucion': return 'var(--color-accent)';
            case 'en_proceso': return 'var(--color-primary)';
            case 'terminado': return '#22c55e';
            default: return 'var(--text-secondary)';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'ejecucion': return 'Pendiente';
            case 'en_proceso': return 'En Proceso';
            case 'terminado': return 'Terminado';
            default: return status;
        }
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Tablero de Ejecución</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Seguimiento de órdenes operativas y tareas en curso.
                    </p>
                </div>

                {/* View Switcher */}
                <div style={{ display: 'flex', backgroundColor: 'var(--bg-surface)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <button
                        onClick={() => setViewMode('board')}
                        style={{
                            padding: '0.5rem', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            backgroundColor: viewMode === 'board' ? 'var(--bg-body)' : 'transparent',
                            color: viewMode === 'board' ? 'var(--color-primary)' : 'var(--text-secondary)'
                        }}
                        title="Ver como Tablero"
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        style={{
                            padding: '0.5rem', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            backgroundColor: viewMode === 'list' ? 'var(--bg-body)' : 'transparent',
                            color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--text-secondary)'
                        }}
                        title="Ver como Lista"
                    >
                        <ListIcon size={20} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Cargando tablero...</div>
            ) : (
                <>
                    {viewMode === 'board' ? (
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingBottom: '1rem' }}>
                            <KanbanColumn
                                title="Pendiente"
                                subtitle="Junta de Operaciones: Definir Logística"
                                status="ejecucion"
                                items={tasks.filter(t => t.status === 'ejecucion')}
                                icon={<AlertCircle size={20} color="var(--color-accent)" />}
                                fetchTasks={fetchTasks}
                                updateTaskStatus={updateTaskStatus}
                            />
                            <KanbanColumn
                                title="En Proceso"
                                subtitle="Ejecución: Completar Checklist"
                                status="en_proceso"
                                items={tasks.filter(t => t.status === 'en_proceso')}
                                icon={<Clock size={20} color="var(--color-primary)" />}
                                fetchTasks={fetchTasks}
                                updateTaskStatus={updateTaskStatus}
                            />
                            <KanbanColumn
                                title="Terminado"
                                subtitle="Historial de Tareas Completadas"
                                status="terminado"
                                items={tasks.filter(t => t.status === 'terminado')}
                                icon={<CheckCircle size={20} color="#22c55e" />}
                                fetchTasks={fetchTasks}
                                updateTaskStatus={updateTaskStatus}
                            />
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '0' }}>
                            {tasks.map((task, index) => (
                                <div key={task.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                                    borderBottom: index < tasks.length - 1 ? '1px solid var(--border-light)' : 'none'
                                }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getStatusColor(task.status) }}></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{task.activity_type}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            {task.description.includes('ORDEN DE EJECUCIÓN:')
                                                ? task.description.split('ORDEN DE EJECUCIÓN:')[1].split('\n\n')[0].substring(0, 100) + '...'
                                                : task.description.substring(0, 100) + '...'}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: '100px' }}>
                                        {new Date(task.event_date).toLocaleDateString()}
                                    </div>
                                    <div style={{ minWidth: '120px' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: '500',
                                            backgroundColor: `${getStatusColor(task.status)}20`, color: getStatusColor(task.status)
                                        }}>
                                            {getStatusLabel(task.status)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {tasks.length === 0 && (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay tareas activas</div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
