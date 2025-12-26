import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { FileText, Check, X, Plus, AlertTriangle, Save, Clock, Calendar } from 'lucide-react';

export default function MeetingMinutes() {
    const { user } = useAuth();
    const [agendaItems, setAgendaItems] = useState([]);
    const [newItems, setNewItems] = useState([]); // Items "Chavo del Ocho"
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // State for the "Quick Agreement" form
    const [quickForm, setQuickForm] = useState({
        title: '',
        description: '',
        responsible: 'operaciones', // Default
        dueDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchAgenda();
    }, []);

    const fetchAgenda = async () => {
        try {
            // Fetch only 'avalado' items (Ready for meeting)
            const { data, error } = await supabase
                .from('solicitudes')
                .select('*')
                .eq('status', 'avalado')
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Add a local 'decision' field to manage UI state before saving
            const itemsWithState = (data || []).map(item => ({
                ...item,
                decision: 'pending', // pending, approved, rejected
                notes: ''
            }));

            setAgendaItems(itemsWithState);
        } catch (error) {
            console.error('Error fetching agenda:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDecision = (id, decision) => {
        setAgendaItems(prev => prev.map(item =>
            item.id === id ? { ...item, decision } : item
        ));
    };

    const handleAddQuickItem = (e) => {
        e.preventDefault();
        if (!quickForm.title.trim()) return;

        const newItem = {
            id: `temp-${Date.now()}`,
            activity_type: quickForm.title,
            description: `ACUERDO RÁPIDO (JUNTA): ${quickForm.description}`,
            event_date: quickForm.dueDate,
            area: 'direccion', // Admin/Direction origin
            status: 'aprobado', // Auto-approved
            isNew: true // Flag to identify insertion vs update
        };

        setNewItems([...newItems, newItem]);
        setQuickForm({ title: '', description: '', responsible: 'operaciones', dueDate: new Date().toISOString().split('T')[0] });
    };

    const handleRemoveQuickItem = (id) => {
        setNewItems(prev => prev.filter(item => item.id !== id));
    };

    const saveMeeting = async (status = 'borrador') => {
        const actionName = status === 'borrador' ? 'Guardar Borrador' : 'Cerrar Acta';
        if (!window.confirm(`¿Estás seguro de ${actionName}?`)) return;

        setProcessing(true);
        try {
            // 1. Prepare Snapshot (Frozen state of approved items)
            const approvedItems = agendaItems.filter(i => i.decision === 'approved');
            const rejectedItems = agendaItems.filter(i => i.decision === 'rejected');

            // Snapshot includes full details of approved items for history
            const snapshot = approvedItems.map(item => ({
                id: item.id,
                activity: item.activity_type,
                area: item.area,
                date: item.event_date,
                description: item.description,
                decision: 'aprobado'
            }));

            // 2. Insert into 'actas' table
            const { error: insertError } = await supabase.from('actas').insert([{
                fecha_reunion: new Date().toISOString().split('T')[0],
                tipo_reunion: 'Junta de Coordinación', // Could be dynamic
                estado: status, // 'borrador' or 'cerrada'
                asistentes: [], // Should be captured via UI input in a real scenario
                snapshot_solicitudes: snapshot,
                creado_por: user.id
            }]);

            if (insertError) throw insertError;

            // 3. Update Status of Solicitudes (Only if closing)
            if (status === 'cerrada') {
                for (const item of approvedItems) {
                    await supabase.from('solicitudes').update({ status: 'aprobado' }).eq('id', item.id);
                }
                for (const item of rejectedItems) {
                    await supabase.from('solicitudes').update({ status: 'rechazado' }).eq('id', item.id);
                }
            }

            alert(`¡Acta ${status === 'cerrada' ? 'cerrada' : 'guardada'} con éxito!`);

            // Refresh
            setAgendaItems([]);
            setNewItems([]);
            fetchAgenda();

        } catch (error) {
            console.error("Error saving meeting:", error);
            alert("Error al guardar el acta: " + error.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando Agenda...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Junta de Coordinación</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => saveMeeting('borrador')}
                        disabled={processing}
                        className="btn"
                        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}
                    >
                        <Save size={20} style={{ marginRight: '0.5rem' }} />
                        Guardar Borrador
                    </button>
                    <button
                        onClick={() => saveMeeting('cerrada')}
                        disabled={processing}
                        className="btn btn-primary"
                        style={{ backgroundColor: processing ? 'var(--text-secondary)' : 'var(--color-primary)' }}
                    >
                        <Check size={20} style={{ marginRight: '0.5rem' }} />
                        {processing ? 'Procesando...' : 'Cerrar Acta'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>

                {/* LEFT COLUMN: AGENDA (Planned) */}
                <div style={{ flex: '2 1 400px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={20} /> Orden del Día (Avalados)
                    </h2>

                    {agendaItems.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                            No hay puntos avalados en la agenda.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {agendaItems.map(item => (
                                <div key={item.id} className="card" style={{
                                    borderLeft: item.decision === 'approved' ? '4px solid #22c55e' :
                                        item.decision === 'rejected' ? '4px solid #ef4444' :
                                            '4px solid var(--border-light)',
                                    opacity: item.decision === 'rejected' ? 0.6 : 1
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.activity_type}</h3>
                                        <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-body)' }}>
                                            {item.area}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                                        {item.description.substring(0, 150)}...
                                    </p>

                                    {/* Decision Buttons */}
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleDecision(item.id, 'approved')}
                                            style={{
                                                flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                                                backgroundColor: item.decision === 'approved' ? '#22c55e' : 'var(--bg-body)',
                                                color: item.decision === 'approved' ? 'white' : 'var(--text-main)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem'
                                            }}
                                        >
                                            <Check size={16} /> Aprobar
                                        </button>
                                        <button
                                            onClick={() => handleDecision(item.id, 'rejected')}
                                            style={{
                                                flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                                                backgroundColor: item.decision === 'rejected' ? '#ef4444' : 'var(--bg-body)',
                                                color: item.decision === 'rejected' ? 'white' : 'var(--text-main)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem'
                                            }}
                                        >
                                            <X size={16} /> Rechazar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: IMPROVISATION (Quick Agreements) */}
                <div style={{ flex: '1 1 300px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent)' }}>
                        <AlertTriangle size={20} /> Asuntos Generales / Urgencias
                    </h2>

                    <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--color-accent)' }}>
                        <form onSubmit={handleAddQuickItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Título del Acuerdo (Ej. Reparar fuga)"
                                value={quickForm.title}
                                onChange={e => setQuickForm({ ...quickForm, title: e.target.value })}
                                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}
                                required
                            />
                            <textarea
                                placeholder="Detalles de la orden..."
                                value={quickForm.description}
                                onChange={e => setQuickForm({ ...quickForm, description: e.target.value })}
                                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', resize: 'vertical' }}
                                rows={3}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Fecha Límite</label>
                                    <input
                                        type="date"
                                        value={quickForm.dueDate}
                                        onChange={e => setQuickForm({ ...quickForm, dueDate: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn" style={{ backgroundColor: 'var(--color-accent)', color: 'black' }}>
                                <Plus size={16} style={{ marginRight: '0.5rem' }} /> Agregar Acuerdo
                            </button>
                        </form>
                    </div>

                    {/* List of New Items */}
                    {newItems.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {newItems.map(item => (
                                <div key={item.id} style={{
                                    padding: '0.75rem', backgroundColor: 'var(--bg-surface)',
                                    borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-accent)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.activity_type}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(item.event_date).toLocaleDateString()}</div>
                                    </div>
                                    <button onClick={() => handleRemoveQuickItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
