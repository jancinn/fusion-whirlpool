import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Check, X, Clock, Calendar, User, FileText, AlertCircle, ArrowUpRight, ShieldCheck } from 'lucide-react';

export default function Approvals() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const userRole = user?.user_metadata?.role || 'director_ministerio';
    const isAdmin = userRole === 'administrador_general';
    const isCoordinator = userRole === 'coordinador_operativo' || userRole === 'coordinador' || isAdmin;

    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            // OPTIMIZED: Fetch only relevant requests directly from DB
            const { data, error } = await supabase
                .from('solicitudes')
                .select('*')
                .in('status', ['pendiente', 'avalado']) // Server-side filtering
                .eq('tipo', 'propuesta') // ONLY show formal proposals, not suggestions
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log("DEBUG: Fetched requests:", data);

            // Sort locally (Avalados first)
            const sortedData = (data || []).sort((a, b) => {
                if (a.status === 'avalado' && b.status !== 'avalado') return -1;
                if (a.status !== 'avalado' && b.status === 'avalado') return 1;
                return 0;
            });

            setRequests(sortedData);
        } catch (error) {
            console.error('Error fetching requests:', error);
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const { error } = await supabase
                .from('solicitudes')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            if (newStatus === 'aprobado' || newStatus === 'rechazado') {
                // Remove from list if finalized
                setRequests(prev => prev.filter(req => req.id !== id));
            } else {
                // Update status in place (e.g. pendiente -> avalado)
                setRequests(prev => prev.map(req =>
                    req.id === id ? { ...req, status: newStatus } : req
                ));
            }

        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar la solicitud');
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando solicitudes...</div>;
    }

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Bandeja de Aprobaciones</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {requests.length === 0
                        ? 'No hay solicitudes pendientes por revisar.'
                        : `Tienes ${requests.length} solicitud(es) en curso.`}
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {requests.map(request => {
                    const isAvalado = request.status === 'avalado';

                    return (
                        <div key={request.id} className="card" style={{
                            display: 'flex', flexDirection: 'column', gap: '1rem',
                            borderLeft: `4px solid ${isAvalado ? '#22c55e' : 'var(--color-accent)'}`,
                            position: 'relative'
                        }}>
                            {/* Stage Badge */}
                            <div style={{
                                position: 'absolute', top: '1rem', right: '1rem',
                                padding: '0.25rem 0.75rem', borderRadius: '999px',
                                fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase',
                                backgroundColor: isAvalado ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                color: isAvalado ? '#22c55e' : '#f59e0b',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                {isAvalado ? (
                                    <>
                                        <ShieldCheck size={14} />
                                        En Agenda (Avalado)
                                    </>
                                ) : (
                                    <>
                                        <Clock size={14} />
                                        Esperando Aval
                                    </>
                                )}
                            </div>

                            {/* Header: Activity & Date */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingRight: '140px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{request.activity_type}</h3>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '999px',
                                        backgroundColor: 'var(--bg-body)',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.85rem',
                                        fontWeight: '500',
                                        border: '1px solid var(--border-light)'
                                    }}>
                                        {request.area.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={16} />
                                    <span>{new Date(request.event_date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={16} />
                                    <span>{request.event_time.slice(0, 5)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <User size={16} />
                                    <span>{request.attendees} personas</span>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', backgroundColor: 'var(--bg-body)', padding: '1rem', borderRadius: 'var(--radius-md)', marginTop: '0.5rem' }}>

                                {request.description && (
                                    <div>
                                        <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Detalles de la Propuesta</span>
                                        <p style={{
                                            fontSize: '0.95rem',
                                            color: 'var(--text-main)',
                                            margin: 0,
                                            whiteSpace: 'pre-wrap', // Respect line breaks
                                            lineHeight: '1.5'
                                        }}>
                                            {request.description}
                                        </p>
                                    </div>
                                )}

                                {/* Technical/Resource Details */}
                                {request.resources && Object.keys(request.resources).length > 0 && (
                                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                        <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Datos Técnicos / Recursos</span>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {Object.entries(request.resources).map(([key, val]) => {
                                                // Skip internal flags or empty values
                                                if (!val || key === 'signed_meeting' || key === 'signed_approval') return null;

                                                // Format key for display
                                                const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                                                return (
                                                    <span key={key} style={{
                                                        fontSize: '0.8rem',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        backgroundColor: 'var(--bg-card-action)',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}>
                                                        <span style={{ opacity: 0.7 }}>{label}:</span>
                                                        <strong>{val.toString()}</strong>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {errorMsg && (
                                <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px', marginBottom: '1rem' }}>
                                    <strong>Error Técnico:</strong> {typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}
                                    <br />
                                    <small>Por favor comparte este mensaje con soporte.</small>
                                </div>
                            )}
                            {/* Actions Toolbar */}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                                <button
                                    onClick={() => handleStatusUpdate(request.id, 'rechazado')}
                                    className="btn"
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'transparent',
                                        border: '1px solid #ef4444',
                                        color: '#ef4444'
                                    }}
                                >
                                    <X size={18} style={{ marginRight: '0.5rem' }} />
                                    Rechazar
                                </button>

                                {/* Logic for Approval Buttons */}
                                {!isAvalado && isCoordinator && (
                                    <button
                                        onClick={() => handleStatusUpdate(request.id, 'avalado')}
                                        className="btn"
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#f59e0b', // Amber for Aval
                                            color: 'white'
                                        }}
                                    >
                                        <ArrowUpRight size={18} style={{ marginRight: '0.5rem' }} />
                                        Avalar para Agenda
                                    </button>
                                )}

                                {isAvalado && isAdmin && (
                                    <button
                                        onClick={() => handleStatusUpdate(request.id, 'aprobado')}
                                        className="btn"
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#22c55e', // Green for Final Approval
                                            color: 'white'
                                        }}
                                    >
                                        <Check size={18} style={{ marginRight: '0.5rem' }} />
                                        Aprobar Final
                                    </button>
                                )}

                                {/* If Avalado but user is NOT admin (e.g. Coordinator looking at it), show status */}
                                {isAvalado && !isAdmin && (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                        Esperando Aprobación Final...
                                    </div>
                                )}
                            </div>

                        </div>
                    );
                })}
            </div>
        </div>
    );
}
