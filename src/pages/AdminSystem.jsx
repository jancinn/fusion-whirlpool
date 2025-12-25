import { useState } from 'react';
import { Users, Shield, BookOpen, Heart, Globe, Music, Briefcase, DollarSign, PenTool, Truck, Wifi, X, CheckCircle, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminSystem() {
    const [selectedRole, setSelectedRole] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [statusType, setStatusType] = useState('success'); // 'success' or 'error'

    const ministerialAreas = [
        {
            title: "Control",
            subtitle: "Mayordomía Integral",
            icon: <Shield size={32} color="#eab308" />,
            desc: "Administración fiel de recursos, mantenimiento de bienes y generación de fondos.",
            pillars: [
                { name: "Mayordomía", desc: "Enseñanza y promoción de la administración fiel de los recursos de Dios." },
                { name: "Mantenimiento", desc: "Cuidado, limpieza, reparación y preservación de las instalaciones." },
                { name: "Fondos", desc: "Estrategias y campañas para la captación de recursos financieros." },
                { name: "Presupuestos", desc: "Planificación, asignación y vigilancia del gasto operativo." }
            ],
            responsibilities: [
                "Supervisar el estado físico de las instalaciones (Mantenimiento).",
                "Planear y ejecutar campañas de recaudación de fondos.",
                "Capacitar a la iglesia en principios de mayordomía bíblica.",
                "Elaborar y vigilar el cumplimiento de los presupuestos anuales."
            ]
        },
        {
            title: "Desarrollo",
            subtitle: "Experiencia del Servicio",
            icon: <Music size={32} color="#3b82f6" />,
            desc: "Crear la atmósfera y el orden para el encuentro con Dios.",
            pillars: [
                { name: "Música", desc: "Dirección de la alabanza y adoración musical con excelencia." },
                { name: "Liturgia", desc: "Diseño y conducción del orden del culto para una experiencia fluida." },
                { name: "Ujieres", desc: "Ministerio de bienvenida, orden, acomodo y atención al visitante." },
                { name: "Consejería", desc: "Atención espiritual inmediata y acompañamiento pastoral básico." }
            ],
            responsibilities: [
                "Coordinar los equipos de alabanza y ensayos.",
                "Diseñar el orden del culto (liturgia) para cada servicio.",
                "Supervisar al equipo de ujieres para la bienvenida y orden.",
                "Proveer consejería y atención inmediata a las personas."
            ]
        },
        {
            title: "Discipulado",
            subtitle: "Formación de Carácter",
            icon: <BookOpen size={32} color="#22c55e" />,
            desc: "Formar el carácter de Cristo en los creyentes.",
            pillars: [
                { name: "Iglesia Infantil", desc: "Atención integral desde Cuna hasta terminar 8vo Grado." },
                { name: "Ministerio de Jóvenes", desc: "Desde 9no Grado hasta terminar High School." },
                { name: "Grupos Pequeños", desc: "Reuniones en hogares para estudio bíblico y comunión." },
                { name: "Escuela de Liderazgo", desc: "Entrenamiento para el desarrollo ministerial." }
            ],
            responsibilities: [
                "Supervisar el currículo y enseñanza de cada nivel.",
                "Coordinar a los maestros y anfitriones.",
                "Dar seguimiento al crecimiento espiritual de los miembros."
            ]
        },
        {
            title: "Interacción",
            subtitle: "Vida y Cultura",
            icon: <Heart size={32} color="#ec4899" />,
            desc: "Fomentar la unidad, las artes y la expresión del Reino.",
            pillars: [
                { name: "Social", desc: "Fomento de la comunión a través de convivios y celebraciones." },
                { name: "Artes", desc: "Expresión creativa del Reino mediante teatro, danza y otras artes." },
                { name: "Deportes", desc: "Integración y salud física a través de actividades deportivas." },
                { name: "Eventos", desc: "Logística y coordinación de actividades especiales masivas." }
            ],
            responsibilities: [
                "Organizar convivios y celebraciones (Día de la Madre, Pastor, etc.).",
                "Promover grupos de teatro, danza y talentos.",
                "Coordinar torneos deportivos y olimpiadas.",
                "Planear retiros y veladas de oración."
            ]
        },
        {
            title: "Alcance",
            subtitle: "Extensión del Reino",
            icon: <Globe size={32} color="#f97316" />,
            desc: "Llevar el mensaje fuera de las cuatro paredes.",
            pillars: [
                { name: "Evangelismo", desc: "Proclamación del Evangelio a nivel personal y urbano." },
                { name: "Misiones", desc: "Apoyo, envío y sostenimiento de obras transculturales." },
                { name: "Obra Social", desc: "Servicio práctico y ayuda humanitaria a la comunidad." }
            ],
            responsibilities: [
                "Planear estrategias de evangelismo urbano.",
                "Coordinar viajes misioneros y apoyo a misiones.",
                "Organizar brigadas de ayuda social a la comunidad.",
                "Dar seguimiento a las personas alcanzadas."
            ]
        }
    ];

    const operationalAreas = [
        {
            name: "Producción",
            detail: "Audio, Video, Streaming",
            icon: <PenTool size={20} />,
            responsibilities: [
                "Operar la consola de audio y asegurar la calidad del sonido.",
                "Manejar la proyección de letras y videos (ProPresenter/EasyWorship).",
                "Gestionar la transmisión en vivo (Streaming).",
                "Cuidar y mantener el equipo técnico."
            ]
        },
        {
            name: "Comunicación",
            detail: "Redes, Diseño, Web",
            icon: <Wifi size={20} />,
            responsibilities: [
                "Administrar las redes sociales de la iglesia.",
                "Diseñar gráficos para series, eventos y anuncios.",
                "Mantener actualizado el sitio web y la app.",
                "Tomar fotografía y video durante los eventos."
            ]
        },
        {
            name: "Logística",
            detail: "Montaje, Espacios",
            icon: <Truck size={20} />,
            responsibilities: [
                "Montaje y desmontaje de escenarios y sillas.",
                "Asegurar que los espacios estén limpios y listos antes del evento.",
                "Coordinar el transporte si es necesario.",
                "Gestionar el inventario de mobiliario (sillas, mesas)."
            ]
        },
        {
            name: "Tecnología",
            detail: "Sistemas, Redes",
            icon: <Briefcase size={20} />,
            responsibilities: [
                "Asegurar la conectividad a Internet en las instalaciones.",
                "Dar mantenimiento a las computadoras y servidores.",
                "Administrar el software administrativo (este sistema).",
                "Soporte técnico a las demás áreas."
            ]
        }
    ];

    const pastoralStaff = [
        {
            name: "Tesorería",
            detail: "Cuentas por Pagar, Reportes",
            icon: <DollarSign size={20} />,
            responsibilities: [
                "Realizar los pagos de servicios (Luz, Agua, Internet).",
                "Pagar compromisos fijos (Mortgage, Seguros).",
                "Elaborar reportes financieros mensuales.",
                "Custodiar los comprobantes y facturas."
            ]
        },
        {
            name: "Secretaría",
            detail: "Agenda, Actas, Oficina",
            icon: <BookOpen size={20} />,
            responsibilities: [
                "Gestionar el funcionamiento diario de la Oficina.",
                "Manejar la agenda del Pastor y de la Iglesia.",
                "Levantar actas de las reuniones oficiales.",
                "Mantener organizado el archivo físico y digital.",
                "Atender llamadas y correos oficiales."
            ]
        },
        {
            name: "Administración",
            detail: "RRHH, Legal, Oficina",
            icon: <Shield size={20} />,
            responsibilities: [
                "Gestionar contratos y asuntos legales.",
                "Supervisar al personal empleado (RRHH).",
                "Asegurar los suministros de oficina.",
                "Velar por el cumplimiento de las normativas."
            ]
        }
    ];

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>Estructura Organizacional</h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto' }}>
                    Manual de Roles y Funciones Oficial (Versión 2025-2026)
                </p>
            </div>

            {/* 1. Liderazgo Ministerial */}
            <div style={{ marginBottom: '4rem' }}>
                <h2 style={{
                    fontSize: '1.5rem',
                    borderBottom: '2px solid var(--border-light)',
                    paddingBottom: '0.5rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <Users size={28} /> Liderazgo Ministerial (El QUÉ)
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {ministerialAreas.map((area, index) => (
                        <div
                            key={index}
                            className="card hover-scale"
                            style={{ borderTop: `4px solid ${area.icon.props.color}`, cursor: 'pointer' }}
                            onClick={() => setSelectedRole({ ...area, type: 'ministerial' })}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: '50%' }}>
                                    {area.icon}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{area.title}</h3>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        {area.subtitle}
                                    </span>
                                </div>
                            </div>
                            <p style={{ marginBottom: '1.5rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                                {area.desc}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {area.pillars.map((pillar, i) => (
                                    <span key={i} style={{
                                        fontSize: '0.8rem',
                                        padding: '0.25rem 0.75rem',
                                        backgroundColor: 'var(--bg-surface)',
                                        borderRadius: '999px',
                                        border: '1px solid var(--border-light)',
                                        fontWeight: '500'
                                    }}>
                                        {pillar.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                {/* 2. Coordinación Operacional */}
                <div>
                    <h2 style={{
                        fontSize: '1.5rem',
                        borderBottom: '2px solid var(--border-light)',
                        paddingBottom: '0.5rem',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <Briefcase size={28} /> Coordinación Operacional (El CÓMO)
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                        {operationalAreas.map((op, index) => (
                            <div
                                key={index}
                                className="card hover-scale"
                                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', cursor: 'pointer' }}
                                onClick={() => setSelectedRole({ title: op.name, subtitle: "Operaciones", desc: op.detail, responsibilities: op.responsibilities, icon: op.icon, type: 'operational' })}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {op.icon}
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{op.name}</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{op.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Staff Pastoral */}
                <div>
                    <h2 style={{
                        fontSize: '1.5rem',
                        borderBottom: '2px solid var(--border-light)',
                        paddingBottom: '0.5rem',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        color: '#a78bfa'
                    }}>
                        <Shield size={28} /> <span translate="no" className="notranslate">Staff Pastoral</span>
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                        {pastoralStaff.map((staff, index) => (
                            <div
                                key={index}
                                className="card hover-scale"
                                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderLeft: '4px solid #8b5cf6', cursor: 'pointer' }}
                                onClick={() => setSelectedRole({ title: staff.name, subtitle: "Staff Pastoral", desc: staff.detail, responsibilities: staff.responsibilities, icon: staff.icon, type: 'pastoral' })}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                    color: '#8b5cf6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {staff.icon}
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{staff.name}</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{staff.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Role Detail Modal */}
            {selectedRole && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }} onClick={() => setSelectedRole(null)}>
                    <div
                        className="card animate-scale-in"
                        style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedRole(null)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--bg-body)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem auto',
                                color: selectedRole.type === 'pastoral' ? '#8b5cf6' : 'var(--color-primary)'
                            }}>
                                {selectedRole.icon}
                            </div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem' }}>{selectedRole.title}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{selectedRole.subtitle}</p>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                                Descripción General
                            </h3>
                            <p style={{ lineHeight: '1.6' }}>{selectedRole.desc}</p>
                        </div>

                        {/* New Section: Program Definitions (Pillars) */}
                        {selectedRole.pillars && selectedRole.pillars[0]?.desc && (
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                                    Programas y Definiciones
                                </h3>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {selectedRole.pillars.map((pillar, idx) => (
                                        <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--bg-body)', borderRadius: '8px', borderLeft: '4px solid var(--color-primary)' }}>
                                            <h4 style={{ fontWeight: '700', marginBottom: '0.25rem' }}>{pillar.name}</h4>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{pillar.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                                Responsabilidades Clave
                            </h3>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {selectedRole.responsibilities?.map((item, idx) => (
                                    <li key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <CheckCircle size={18} color="var(--color-primary)" style={{ marginTop: '3px', flexShrink: 0 }} />
                                        <span style={{ lineHeight: '1.5' }}>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Herramientas de Programación */}
            <div style={{ marginTop: '4rem', borderTop: '1px solid var(--border-light)', paddingTop: '3rem' }}>
                <h2 style={{
                    fontSize: '1.5rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: 'var(--text-main)'
                }}>
                    <Calendar size={28} /> Programación Automática 2026
                </h2>

                <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Generar Juntas de Coordinación</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            Esta herramienta generará automáticamente los eventos para todo el año 2026 según la regla:
                            <br />• <strong>2º Martes:</strong> Coordinación Ministerial
                            <br />• <strong>4º Martes:</strong> Coordinación Operacional
                        </p>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        {statusMessage && (
                            <div style={{
                                padding: '1rem',
                                borderRadius: '8px',
                                backgroundColor: statusType === 'success' ? '#dcfce7' : '#fee2e2',
                                color: statusType === 'success' ? '#166534' : '#991b1b',
                                border: `1px solid ${statusType === 'success' ? '#bbf7d0' : '#fecaca'}`,
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                {statusType === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                <span>{statusMessage}</span>
                            </div>
                        )}

                        <button
                            onClick={async () => {
                                if (!confirm('¿Estás seguro de generar las juntas para 2026? Esto agregará eventos a la base de datos.')) return;

                                setProcessing(true);
                                setStatusMessage(null);

                                try {
                                    const year = 2026;
                                    const newEvents = [];

                                    for (let month = 0; month < 12; month++) {
                                        // Find First Tuesday
                                        const firstDayOfMonth = new Date(year, month, 1);
                                        const dayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, ...
                                        const daysUntilTuesday = (2 - dayOfWeek + 7) % 7;
                                        const firstTuesdayDate = 1 + daysUntilTuesday;

                                        // Calculate 2nd and 4th Tuesday
                                        const secondTuesday = firstTuesdayDate + 7;
                                        const fourthTuesday = firstTuesdayDate + 21;

                                        // Create Dates
                                        const dateMinisterial = new Date(year, month, secondTuesday);
                                        const dateOperational = new Date(year, month, fourthTuesday);

                                        // Ministerial Event
                                        newEvents.push({
                                            activity_type: 'Coordinación Ministerial',
                                            event_date: dateMinisterial.toISOString().split('T')[0],
                                            event_time: '19:00:00', // Default time
                                            status: 'aprobado',
                                            requester_name: 'Sistema Admin',
                                            requester_email: 'admin@inn.org',
                                            department: 'Liderazgo',
                                            description: 'Junta mensual de coordinación ministerial (2º Martes).'
                                        });

                                        // Operational Event
                                        newEvents.push({
                                            activity_type: 'Coordinación Operacional',
                                            event_date: dateOperational.toISOString().split('T')[0],
                                            event_time: '19:00:00', // Default time
                                            status: 'aprobado',
                                            requester_name: 'Sistema Admin',
                                            requester_email: 'admin@inn.org',
                                            department: 'Operaciones',
                                            description: 'Junta mensual de coordinación operacional (4º Martes).'
                                        });
                                    }

                                    const { error } = await supabase.from('solicitudes').insert(newEvents);

                                    if (error) throw error;

                                    setStatusType('success');
                                    setStatusMessage(`¡Éxito! Se han generado ${newEvents.length} juntas para el año 2026. Revisa el Calendario.`);

                                } catch (err) {
                                    console.error(err);
                                    setStatusType('error');
                                    setStatusMessage('Error al generar juntas: ' + (err.message || 'Error desconocido'));
                                } finally {
                                    setProcessing(false);
                                }
                            }}
                            className="btn btn-primary"
                            disabled={processing}
                        >
                            {processing ? 'Generando...' : 'Generar Juntas 2026'}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
