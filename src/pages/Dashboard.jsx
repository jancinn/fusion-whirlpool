import { useAuth } from '../context/AuthContext';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  FileText,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  // Get user name from metadata (if available from our new registration form)
  const firstName = user?.user_metadata?.first_name;
  const lastName = user?.user_metadata?.last_name || '';

  // Fallback only for legacy/error cases, but make it obvious
  const fullName = firstName ? `${firstName} ${lastName}`.trim() : user?.email?.split('@')[0] || 'Usuario';

  // Mock Data for Dashboard Stats (In real app, fetch from Supabase)
  const stats = {
    pendingProposals: 3,
    approvedProposals: 12,
    upcomingEvents: 2,
    activeUsers: 24
  };

  const isAdmin = userRole === 'admin';
  const isCoordinator = userRole === 'coordinador';
  const isLeader = userRole === 'lider_ministerio';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 1. Hero / Welcome Section */}
      <div className="animate-fade-in" style={{
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            Hola, <span style={{ color: 'var(--color-primary)' }}>{fullName}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}>
          <Activity size={16} color="var(--color-accent)" />
          Sistema Operativo: <span style={{ color: '#22c55e', fontWeight: '600' }}>En Línea</span>
        </div>
      </div>

      {/* 2. KPI Cards (Role Based) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        {/* Card 1: Pending Actions */}
        <div className="card hover-scale" onClick={() => navigate(isAdmin || isCoordinator ? '/approvals' : '/proposals')} style={{ cursor: 'pointer', borderLeft: '4px solid #eab308' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
                {isAdmin || isCoordinator ? 'Por Aprobar' : 'En Revisión'}
              </p>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)' }}>
                {stats.pendingProposals}
              </h3>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: '8px', color: '#eab308' }}>
              <Clock size={24} />
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {isAdmin ? 'Requieren tu atención inmediata' : 'Propuestas esperando respuesta'}
          </p>
        </div>

        {/* Card 2: Approved / Execution */}
        <div className="card hover-scale" onClick={() => navigate('/todo')} style={{ cursor: 'pointer', borderLeft: '4px solid #22c55e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
                {isAdmin || isCoordinator ? 'En Ejecución' : 'Aprobadas'}
              </p>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)' }}>
                {stats.approvedProposals}
              </h3>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', color: '#22c55e' }}>
              <CheckCircle size={24} />
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {isAdmin ? 'Proyectos activos actualmente' : 'Listas para iniciar'}
          </p>
        </div>

        {/* Card 3: Events / Calendar */}
        <div className="card hover-scale" onClick={() => navigate('/calendar')} style={{ cursor: 'pointer', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Próximos Eventos</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)' }}>
                {stats.upcomingEvents}
              </h3>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: 'var(--color-primary)' }}>
              <CalendarIcon size={24} />
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Programados para esta semana
          </p>
        </div>

        {/* Card 4: Admin Only Stats */}
        {isAdmin && (
          <div className="card hover-scale" onClick={() => navigate('/registro-usuarios')} style={{ cursor: 'pointer', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Equipo Activo</p>
                <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {stats.activeUsers}
                </h3>
              </div>
              <div style={{ padding: '0.5rem', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', color: '#8b5cf6' }}>
                <Users size={24} />
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Líderes y Coordinadores
            </p>
          </div>
        )}
      </div>

      {/* 3. Main Content Area: Strategic View */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

        {/* Left Column: Weekly Agenda (The Future) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon size={20} /> Agenda de la Semana
            </h3>
            <button className="btn-ghost" onClick={() => navigate('/calendar')}>Ver Mes</button>
          </div>

          {/* Mock Events List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { day: 'MIE', date: '13 Dic', title: 'Servicio de Oración', time: '19:30', type: 'service' },
              { day: 'VIE', date: '15 Dic', title: 'Reunión de Jóvenes', time: '20:00', type: 'event' },
              { day: 'DOM', date: '17 Dic', title: 'Servicio Dominical', time: '10:00', type: 'service' }
            ].map((event, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-body)',
                borderRadius: 'var(--radius-md)',
                borderLeft: `4px solid ${event.type === 'service' ? 'var(--color-primary)' : '#eab308'}`
              }}>
                <div style={{ textAlign: 'center', minWidth: '50px' }}>
                  <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>{event.day}</span>
                  <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>{event.date.split(' ')[0]}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {event.title}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={14} /> {event.time} hrs
                  </p>
                </div>
                <button className="btn-icon" style={{ opacity: 0.5 }}>
                  <TrendingUp size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Official Announcements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ borderTop: '4px solid #ef4444' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
              <AlertCircle size={20} /> Comunicados Oficiales
            </h3>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>Entrega de Presupuestos 2026</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Recordatorio a todos los directores: La fecha límite para presentar el plan anual es el 20 de Diciembre.
              </p>
            </div>
            <button className="btn-ghost" style={{ width: '100%', fontSize: '0.85rem' }}>Ver todos los avisos</button>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Accesos Rápidos
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button onClick={() => navigate('/proposals')} className="btn" style={{ fontSize: '0.85rem', justifyContent: 'center', backgroundColor: 'var(--bg-body)', color: 'var(--text-main)' }}>
                + Propuesta
              </button>
              <button onClick={() => navigate('/documentos')} className="btn" style={{ fontSize: '0.85rem', justifyContent: 'center', backgroundColor: 'var(--bg-body)', color: 'var(--text-main)' }}>
                Documentos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
