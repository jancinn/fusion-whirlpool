import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Calendar as CalendarIcon,
    Clock,
    FileText,
    Users,
    AlertCircle,
    CheckCircle2,
    Megaphone,
    ArrowRight,
    Edit2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Home() {
    const { user } = useAuth();

    // Smart Name Detection
    const getDisplayName = () => {
        if (!user) return 'Director de Ministerio';
        const meta = user.user_metadata || {};
        if (meta.full_name) return meta.full_name.split(' ')[0];
        if (meta.first_name) return meta.first_name;
        const localUsers = JSON.parse(localStorage.getItem('inn_users_list') || '[]');
        const found = localUsers.find(u => u.email === user.email);
        if (found && found.firstName) return found.firstName;
        return user.email?.split('@')[0] || 'Director de Ministerio';
    };

    const userName = getDisplayName();
    const currentDate = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

    // Get User Role
    const userRole = user?.user_metadata?.role || 'director_ministerio';
    const isAdmin = userRole === 'administrador_general';

    // Real Data State
    const [nextEvent, setNextEvent] = useState(null);
    const [weeklyAgenda, setWeeklyAgenda] = useState([]);
    const [pendingCount, setPendingCount] = useState(0); // New state for count
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Approved Events for Calendar/Agenda
                const { data: eventsData, error: eventsError } = await supabase
                    .from('solicitudes')
                    .select('*')
                    .eq('status', 'aprobado')
                    .gte('event_date', new Date().toISOString().split('T')[0])
                    .order('event_date', { ascending: true })
                    .order('event_time', { ascending: true });

                if (eventsError) throw eventsError;

                if (eventsData && eventsData.length > 0) {
                    setNextEvent(eventsData[0]);
                    setWeeklyAgenda(eventsData.slice(0, 4).map(event => {
                        const d = new Date(event.event_date);
                        const isValid = !isNaN(d.getTime());
                        return {
                            day: isValid ? d.toLocaleDateString('es-MX', { weekday: 'long' }) : 'N/A',
                            dateNum: isValid ? d.getDate() : '-',
                            time: event.event_time ? event.event_time.slice(0, 5) : '--:--',
                            title: event.activity_type || 'Evento',
                            location: "Auditorio Principal"
                        };
                    }));
                } else {
                    setNextEvent(null);
                    setWeeklyAgenda([]);
                }

                // 2. Fetch Pending Requests Count (for Admin KPI)
                if (isAdmin) {
                    const { count, error: countError } = await supabase
                        .from('solicitudes')
                        .select('*', { count: 'exact', head: true })
                        .in('status', ['pendiente', 'avalado']); // Count both stages

                    if (!countError) {
                        setPendingCount(count || 0);
                    }
                }

            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAdmin]); // Re-run if admin status changes

    // Get Real Member Count
    const localUsers = JSON.parse(localStorage.getItem('inn_users_list') || '[]');
    const activeMemberCount = localUsers.length;

    // Update KPI with Real Next Event
    const nextEventKPI = {
        id: 'event',
        title: "Próximo Evento",
        value: nextEvent?.activity_type || "Sin eventos",
        label: (nextEvent && nextEvent.event_date)
            ? `${new Date(nextEvent.event_date).toLocaleDateString('es-MX', { weekday: 'long' })}, ${nextEvent.event_time ? nextEvent.event_time.slice(0, 5) : ''}`
            : "Agenda libre",
        icon: <CalendarIcon size={24} />,
        color: "#3b82f6",
        link: "/calendario",
        roles: ['all']
    };

    // Real Data for Dashboard
    const allKpis = [
        {
            id: 'requests',
            title: "Solicitudes Pendientes",
            value: pendingCount.toString(), // Real Count
            label: pendingCount === 1 ? "Requiere atención" : "Requieren atención",
            icon: <AlertCircle size={24} />,
            color: "#f59e0b",
            link: "/aprobaciones",
            roles: ['administrador_general'],
            hasNotification: pendingCount > 0 // Only show dot if > 0
        },
        nextEventKPI
    ];

    // Filter KPIs based on Role
    const kpis = allKpis.filter(kpi => {
        if (kpi.roles.includes('all')) return true;
        return kpi.roles.includes(userRole) || isAdmin; // Admin sees everything
    });

    const announcements = [
        { title: "Reunión de Directores", date: "15 Dic", content: "Recordatorio: Junta mensual de planeación este sábado a las 9 AM." },
        { title: "Actualización de Manual", date: "12 Dic", content: "Se ha actualizado el manual de roles en el Sistema Admin. Favor de revisar." }
    ];

    // Verse & Quote State
    const [verse, setVerse] = useState(() => {
        const saved = localStorage.getItem('inn_dashboard_verse');
        return saved ? JSON.parse(saved) : {
            text: "Y todo lo que hacéis, hacedlo de corazón, como para el Señor y no para los hombres.",
            reference: "COLOSENSES 3:23"
        };
    });

    const [quote, setQuote] = useState(() => {
        const saved = localStorage.getItem('inn_dashboard_quote');
        return saved ? JSON.parse(saved) : {
            text: "La cultura no cambia por decreto, cambia por hábito.",
            author: "Gestión Moderna"
        };
    });

    const [isEditingVerse, setIsEditingVerse] = useState(false);
    const [tempVerse, setTempVerse] = useState(verse);
    const [tempQuote, setTempQuote] = useState(quote);

    const handleSaveMessages = () => {
        setVerse(tempVerse);
        setQuote(tempQuote);
        localStorage.setItem('inn_dashboard_verse', JSON.stringify(tempVerse));
        localStorage.setItem('inn_dashboard_quote', JSON.stringify(tempQuote));
        setIsEditingVerse(false);
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>

            {/* Header Section */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '2.5rem',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '1.5rem'
            }}>
                <div>
                    <p style={{ textTransform: 'capitalize', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                        {currentDate}
                    </p>
                    <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', margin: 0 }}>
                        Bienvenido, {userName}
                    </h1>
                </div>
            </div>

            {/* Inspiration Section (Verse + Quote) */}
            <div style={{
                textAlign: 'center',
                marginBottom: '3rem',
                padding: '3rem 2rem',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(255,255,255,0.05)',
                position: 'relative'
            }}>
                {isAdmin && !isEditingVerse && (
                    <button
                        onClick={() => {
                            setTempVerse(verse);
                            setTempQuote(quote);
                            setIsEditingVerse(true);
                        }}
                        title="Editar Mensajes"
                        style={{
                            position: 'absolute', top: '1rem', right: '1rem',
                            background: 'none', border: 'none', color: 'var(--text-secondary)',
                            cursor: 'pointer', opacity: 0.5
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = 1}
                        onMouseLeave={(e) => e.target.style.opacity = 0.5}
                    >
                        <Edit2 size={18} />
                    </button>
                )}

                {isEditingVerse ? (
                    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Edit Verse */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <label style={{ textAlign: 'left', color: 'var(--color-primary)', fontSize: '0.9rem' }}>Versículo Bíblico</label>
                            <textarea
                                value={tempVerse.text}
                                onChange={(e) => setTempVerse({ ...tempVerse, text: e.target.value })}
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'var(--bg-body)', color: 'var(--text-main)',
                                    border: '1px solid var(--color-primary)', fontFamily: 'Georgia, serif', fontSize: '1.1rem'
                                }}
                                rows={3}
                            />
                            <input
                                type="text"
                                value={tempVerse.reference}
                                onChange={(e) => setTempVerse({ ...tempVerse, reference: e.target.value })}
                                placeholder="Referencia (ej. Juan 3:16)"
                                style={{
                                    width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'var(--bg-body)', color: 'var(--text-main)',
                                    border: '1px solid var(--border-light)', textAlign: 'center', fontWeight: 'bold'
                                }}
                            />
                        </div>

                        {/* Edit Quote */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px dashed var(--border-light)', paddingTop: '2rem' }}>
                            <label style={{ textAlign: 'left', color: 'var(--color-accent)', fontSize: '0.9rem' }}>Frase de Liderazgo</label>
                            <textarea
                                value={tempQuote.text}
                                onChange={(e) => setTempQuote({ ...tempQuote, text: e.target.value })}
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'var(--bg-body)', color: 'var(--text-main)',
                                    border: '1px solid var(--color-accent)', fontFamily: 'Inter, sans-serif', fontSize: '1rem', fontStyle: 'italic'
                                }}
                                rows={2}
                            />
                            <input
                                type="text"
                                value={tempQuote.author}
                                onChange={(e) => setTempQuote({ ...tempQuote, author: e.target.value })}
                                placeholder="Autor (ej. John Maxwell)"
                                style={{
                                    width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'var(--bg-body)', color: 'var(--text-main)',
                                    border: '1px solid var(--border-light)', textAlign: 'center', fontSize: '0.9rem'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                            <button onClick={() => setIsEditingVerse(false)} className="btn">Cancelar</button>
                            <button onClick={handleSaveMessages} className="btn btn-primary">Guardar Cambios</button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                        {/* Display Verse */}
                        <div>
                            <p style={{
                                fontFamily: 'Georgia, serif',
                                fontStyle: 'italic',
                                fontSize: '1.5rem',
                                color: 'var(--text-main)',
                                lineHeight: '1.6',
                                maxWidth: '800px',
                                margin: '0 auto'
                            }}>
                                "{verse.text}"
                            </p>
                            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                — {verse.reference}
                            </p>
                        </div>

                        {/* Display Quote */}
                        <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
                            <span style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '2rem', color: 'var(--border-light)', opacity: 0.5 }}>•••</span>
                            <p style={{
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '1.1rem',
                                color: 'var(--text-secondary)',
                                lineHeight: '1.5',
                                marginTop: '1rem'
                            }}>
                                {quote.text}
                            </p>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                                {quote.author}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {kpis.map((kpi, index) => (
                    <Link key={index} to={kpi.link} className="card hover-scale" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', position: 'relative' }}>
                        {kpi.hasNotification && (
                            <span className="animate-pulse" style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                width: '12px',
                                height: '12px',
                                backgroundColor: '#ef4444',
                                borderRadius: '50%',
                                boxShadow: '0 0 0 2px var(--bg-surface)'
                            }} title="Nuevas notificaciones"></span>
                        )}
                        <div style={{
                            width: '56px', height: '56px',
                            borderRadius: '12px',
                            backgroundColor: `${kpi.color}20`,
                            color: kpi.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {kpi.icon}
                        </div>
                        <div>
                            <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1' }}>{kpi.value}</h3>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{kpi.title}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{kpi.label}</div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Main Content Grid: Agenda & Announcements */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>

                {/* Weekly Agenda */}
                <div className="card" style={{ padding: '0' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <CalendarIcon size={20} color="var(--color-primary)" />
                            Agenda de la Semana
                        </h3>
                        <Link to="/calendario" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none' }}>Ver todo</Link>
                    </div>
                    <div style={{ padding: '0' }}>
                        {weeklyAgenda.length > 0 ? (
                            weeklyAgenda.map((item, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    padding: '1.25rem 1.5rem',
                                    borderBottom: idx !== weeklyAgenda.length - 1 ? '1px solid var(--border-light)' : 'none',
                                    alignItems: 'center'
                                }}>
                                    <div style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        width: '60px', height: '60px', borderRadius: '8px',
                                        backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-light)'
                                    }}>
                                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', color: 'var(--text-secondary)' }}>{item.day ? item.day.substring(0, 3) : ''}</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{item.dateNum}</span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{item.title}</h4>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} /> {item.time}</span>
                                            <span>•</span>
                                            <span>{item.location}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <p style={{ fontStyle: 'italic' }}>No hay actividades programadas para esta semana.</p>
                                <Link to="/propuestas" style={{ fontSize: '0.9rem', color: 'var(--color-primary)', marginTop: '0.5rem', display: 'inline-block' }}>
                                    + Agendar nueva actividad
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Official Announcements */}
                <div className="card" style={{ padding: '0', height: 'fit-content' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Megaphone size={20} color="#ec4899" />
                            Comunicados Oficiales
                        </h3>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                        {announcements.map((ann, idx) => (
                            <div key={idx} style={{ marginBottom: '1.5rem', paddingLeft: '1rem', borderLeft: '3px solid var(--color-primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>{ann.title}</h4>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-body)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{ann.date}</span>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                    {ann.content}
                                </p>
                            </div>
                        ))}
                        <button style={{
                            width: '100%', padding: '0.75rem',
                            backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500'
                        }}>
                            Ver Historial de Anuncios
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
