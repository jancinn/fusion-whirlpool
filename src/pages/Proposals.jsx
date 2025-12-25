import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { FileText, Briefcase, PenTool, Layout, Calendar, ArrowRight, Shield } from 'lucide-react';

export default function Proposals() {
    const { user } = useAuth(); // Hook moved to top
    const userRole = user?.user_metadata?.role || 'lider_ministerio';
    const isDirector = userRole === 'lider_ministerio';

    const [formData, setFormData] = useState({
        title: '',
        area: 'ministerial', // 'ministerial' or 'operaciones'
        department: '', // New field for specific sub-area
        proposal_text: '',
        justification_text: '',
        requirements: '',
        execution_date: '',
        meeting_date: '',
        check_meeting: false,
        check_approval: false,
        ministerialLevel: 'atomo', // atomo, molecular, celular
        target_audience: 'general',
        connection_goal: 'consolidar'
    });

    const ministerialDepts = [
        'Control (Mayordomía, Mantenimiento, Fondos, Presupuestos)',
        'Desarrollo (Música, Liturgia, Ujieres, Consejería)',
        'Discipulado (Iglesia Infantil, Ministerio de Jóvenes, Grupos Pequeños, Escuela de Liderazgo)',
        'Interacción (Social, Artes, Deportes, Eventos)',
        'Alcance (Evangelismo)'
    ];

    const operationalDepts = [
        'Producción (Video, Sonido)',
        'Comunicación (Redes, Diseño)',
        'Logística (Montaje, Espacios)',
        'Tecnología (Sistemas, Equipos)'
    ];

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Insert into 'propuestas' table (we will create this table or reuse solicitudes with new fields)
            // For now, let's reuse 'solicitudes' but map fields differently or create a new table structure mentally.
            // Ideally, we should create a new table 'propuestas'.
            // Let's assume we use 'solicitudes' for now but with 'type' = 'propuesta'.

            let descriptionPayload = '';
            let statusPayload = 'propuesta';
            let resourcesPayload = {
                ministerial_level: formData.ministerialLevel,
                target_audience: formData.target_audience,
                connection_goal: formData.connection_goal
            };

            if (formData.area === 'operaciones') {
                descriptionPayload = `ORDEN DE EJECUCIÓN: ${formData.proposal_text}\n\nFECHA EJECUCIÓN: ${formData.execution_date}\n\nACORDADO EN JUNTA: ${formData.meeting_date}`;
                statusPayload = 'ejecucion'; // Special status for execution orders
                resourcesPayload = {
                    ...resourcesPayload,
                    execution_date: formData.execution_date,
                    meeting_date: formData.meeting_date,
                    signed_meeting: formData.check_meeting,
                    signed_approval: formData.check_approval
                };
            } else {
                descriptionPayload = `PROPUESTA: ${formData.proposal_text}\n\nJUSTIFICACIÓN: ${formData.justification_text}\n\nREQUERIMIENTOS: ${formData.requirements}`;
            }

            // Ensure date is valid or fallback to today
            const finalEventDate = formData.execution_date || new Date().toISOString().split('T')[0];

            const payload = {
                user_id: user.id, // Ensure user_id is sent
                area: formData.area,
                activity_type: formData.title,
                description: descriptionPayload,
                status: statusPayload === 'ejecucion' ? 'avalado' : 'pendiente',
                event_date: finalEventDate,
                event_time: '09:00',
                attendees: 0,
                resources: resourcesPayload
            };

            // DEBUG: Show what we are sending
            alert("Intentando enviar: " + JSON.stringify(payload, null, 2));

            const { error } = await supabase
                .from('solicitudes')
                .insert([payload]);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Propuesta enviada correctamente.' });
            // Reset form logic...
            setFormData({ ...formData, title: '', proposal_text: '', justification_text: '', requirements: '' });

        } catch (error) {
            console.error('Error submitting proposal:', error);
            // Show detailed error
            alert(`Error técnico: ${error.message || error.details || JSON.stringify(error)}`);
            setMessage({ type: 'error', text: `Error: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Nueva Propuesta</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Ingresa un punto para discutir en la próxima Junta de Coordinación.
                </p>
            </div>

            <div className="card">
                {message.text && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1.5rem',
                        backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: message.type === 'success' ? '#22c55e' : '#ef4444',
                        border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`
                    }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Area Selection - The Two Rooms */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Origen de la Propuesta</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {/* Room 1: Ministerio */}
                            <div
                                onClick={() => setFormData({ ...formData, area: 'ministerial' })}
                                style={{
                                    padding: '1.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: `2px solid ${formData.area === 'ministerial' ? 'var(--color-primary)' : 'var(--border-light)'}`,
                                    backgroundColor: formData.area === 'ministerial' ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-card)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ color: formData.area === 'ministerial' ? 'var(--color-primary)' : 'var(--text-secondary)' }}>
                                    <Briefcase size={32} />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>Área Ministerial</span>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Visión, Enseñanza, Alcance y Control</span>
                                </div>
                            </div>

                            {/* Room 2: Operaciones */}
                            <div
                                onClick={() => {
                                    if (isDirector) {
                                        alert("Solo los Coordinadores pueden iniciar solicitudes operativas directas.");
                                        return;
                                    }
                                    setFormData({ ...formData, area: 'operaciones' });
                                }}
                                style={{
                                    padding: '1.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: `2px solid ${formData.area === 'operaciones' ? 'var(--color-accent)' : 'var(--border-light)'}`,
                                    backgroundColor: formData.area === 'operaciones' ? 'rgba(234, 179, 8, 0.1)' : 'var(--bg-card)',
                                    cursor: isDirector ? 'not-allowed' : 'pointer',
                                    opacity: isDirector ? 0.5 : 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    transition: 'all 0.2s',
                                    position: 'relative'
                                }}
                            >
                                {isDirector && (
                                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: 'var(--text-secondary)' }}>
                                        <Shield size={16} />
                                    </div>
                                )}
                                <div style={{ color: formData.area === 'operaciones' ? 'var(--color-accent)' : 'var(--text-secondary)' }}>
                                    <PenTool size={32} />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>Área Operativa</span>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Logística, Recursos y Ejecución</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Department Selector (Dynamic based on Area) */}
                    <div className="animate-fade-in" style={{ marginTop: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            {formData.area === 'ministerial' ? 'Departamento Ministerial' : 'Área Operativa Específica'}
                        </label>
                        <select
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-light)', color: 'var(--text-main)', fontSize: '1rem' }}
                        >
                            <option value="">-- Seleccione una opción --</option>
                            {(formData.area === 'ministerial' ? ministerialDepts : operationalDepts).map((dept) => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <FileText size={18} /> Asunto / Título
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            placeholder="Ej: Campaña de Jóvenes, Reparación de Techos, Evento Especial..."
                            style={{ fontSize: '1.1rem' }}
                        />
                    </div>

                    {/* Split Description Fields - CONDITIONAL RENDERING */}

                    {/* CASE 1: MINISTERIAL (PROPOSAL) */}
                    {
                        formData.area === 'ministerial' && (
                            <div className="animate-fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
                                {/* Field 1: The What */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                        1. ¿Qué propones hacer?
                                    </label>
                                    <textarea
                                        name="proposal_text"
                                        value={formData.proposal_text || ''}
                                        onChange={handleInputChange}
                                        required={formData.area === 'ministerial'}
                                        rows={3}
                                        placeholder="Ej: Pintar el salón 3, Comprar 2 micrófonos inalámbricos..."
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-light)', color: 'var(--text-main)', fontSize: '1rem' }}
                                    />
                                </div>

                                {/* Field 2: The Why (Justification) */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                        2. ¿Por qué es necesario hacerlo ahora?
                                    </label>
                                    <textarea
                                        name="justification_text"
                                        value={formData.justification_text || ''}
                                        onChange={handleInputChange}
                                        required={formData.area === 'ministerial'}
                                        rows={3}
                                        placeholder="Ej: Porque la pintura actual da mala imagen a las visitas, Porque los actuales cortan la predicación..."
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-light)', color: 'var(--text-main)', fontSize: '1rem' }}
                                    />
                                </div>
                            </div>
                        )
                    }

                    {/* CASE 2: OPERATIONS (EXECUTION ORDER) */}
                    {
                        formData.area === 'operaciones' && (
                            <div className="animate-fade-in" style={{ display: 'grid', gap: '1.5rem', backgroundColor: 'rgba(234, 179, 8, 0.05)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-accent)' }}>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>
                                    <Shield size={24} />
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Orden de Ejecución</h3>
                                </div>

                                {/* Action to Execute */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                        Acción a Ejecutar (Detalles Técnicos)
                                    </label>
                                    <textarea
                                        name="proposal_text" // Reusing this field for the main action text
                                        value={formData.proposal_text || ''}
                                        onChange={handleInputChange}
                                        required={formData.area === 'operaciones'}
                                        rows={4}
                                        placeholder="Describa la acción operativa exacta que se va a realizar..."
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-light)', color: 'var(--text-main)', fontSize: '1rem' }}
                                    />
                                </div>

                                {/* Dates */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Fecha de Ejecución</label>
                                        <input
                                            type="date"
                                            name="execution_date"
                                            value={formData.execution_date || ''}
                                            onChange={handleInputChange}
                                            required={formData.area === 'operaciones'}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Fecha de Acuerdo en Junta</label>
                                        <input
                                            type="date"
                                            name="meeting_date"
                                            value={formData.meeting_date || ''}
                                            onChange={handleInputChange}
                                            required={formData.area === 'operaciones'}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                </div>

                                {/* Digital Signature Checkboxes */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            name="check_meeting"
                                            checked={formData.check_meeting || false}
                                            onChange={(e) => setFormData({ ...formData, check_meeting: e.target.checked })}
                                            required={formData.area === 'operaciones'}
                                            style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent)' }}
                                        />
                                        <span style={{ fontSize: '0.95rem' }}>Certifico que esta acción fue discutida en Junta de Coordinación.</span>
                                    </label>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            name="check_approval"
                                            checked={formData.check_approval || false}
                                            onChange={(e) => setFormData({ ...formData, check_approval: e.target.checked })}
                                            required={formData.area === 'operaciones'}
                                            style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent)' }}
                                        />
                                        <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>Confirmo que cuento con la Aprobación del Coordinador General.</span>
                                    </label>
                                </div>

                            </div>
                        )
                    }

                    {/* Requirements from Operations */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-accent)' }}>¿Qué se necesita de Operaciones?</label>
                        <textarea
                            name="requirements"
                            value={formData.requirements}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Materiales, compras, personal, logística..."
                            style={{ borderColor: 'var(--color-accent)' }}
                        />
                    </div>

                    {/* Feedback Message based on Role */}
                    <div style={{ padding: '1rem', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: 'var(--color-primary)' }}>
                            <Shield size={20} />
                        </div>
                        <div>
                            {isDirector ? (
                                <span>Esta propuesta será analizada por su <strong>Coordinador de Área</strong>.</span>
                            ) : (
                                <span>Esta propuesta será enviada directamente al <strong>Coordinador General</strong>.</span>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ marginTop: '1rem', padding: '1rem' }}
                    >
                        {loading ? 'Enviando...' : (isDirector ? 'Enviar a Coordinación' : 'Enviar a Coordinador General')}
                        <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
                    </button>

                </form >
            </div >
        </div >
    );
}
