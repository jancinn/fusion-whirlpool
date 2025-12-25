import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Menu, X, Home, PlusCircle, CheckSquare, ClipboardList,
    Folder, FileText, MessageSquare, Calendar, Users, Settings, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAutoLogout } from '../hooks/useAutoLogout';
import { supabase } from '../lib/supabase';

const Watermark = () => (
    <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60vw',
        height: '60vw',
        backgroundImage: 'url("/inn_logo_official.png")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'contain',
        opacity: '0.03',
        pointerEvents: 'none',
        zIndex: 0,
        filter: 'grayscale(100%)'
    }} />
);

export default function Layout({ children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [pendingCount, setPendingCount] = useState(0);

    // Auto-logout after 5 minutes (300000 ms) of inactivity
    useAutoLogout(300000);

    // Filter nav links based on role
    // Ideally, we should get the role from user metadata in AuthContext.
    // For now, let's assume we can check it. If not available yet, we might need to fetch it.
    // Let's assume user object has app_metadata or user_metadata with role.

    const userRole = user?.user_metadata?.role || 'director_ministerio';
    const isAdmin = userRole === 'admin';
    // isCoordinator now includes both Operational Coordinators and Admins
    const isCoordinator = userRole === 'coordinador_operativo' || userRole === 'coordinador' || isAdmin;

    // Check for notifications (Pending Requests)
    useEffect(() => {
        const checkNotifications = async () => {
            if (isCoordinator) {
                try {
                    const { count, error } = await supabase
                        .from('solicitudes')
                        .select('*', { count: 'exact', head: true })
                        .in('status', ['pendiente', 'avalado']);

                    if (!error) {
                        setPendingCount(count || 0);
                    }
                } catch (err) {
                    console.error("Error checking notifications:", err);
                }
            }
        };

        checkNotifications();

        // Optional: Set up an interval to poll every minute
        const interval = setInterval(checkNotifications, 60000);
        return () => clearInterval(interval);
    }, [isCoordinator]);

    const menuItems = [
        { name: 'Inicio', path: '/', icon: <Home size={20} />, roles: ['all'] },
        { name: 'Nueva Propuesta', path: '/propuestas', icon: <PlusCircle size={20} />, roles: ['admin', 'coordinador', 'coordinador_operativo', 'director_ministerio', 'staff'] },
        {
            name: 'Agenda / Aprobaciones',
            path: '/aprobaciones',
            icon: <CheckSquare size={20} />,
            roles: ['admin', 'coordinador', 'coordinador_operativo'], // Coordinators and Admins see approvals
            hasNotification: pendingCount > 0
        },
        { name: 'Tablero Ejecución', path: '/todo', icon: <ClipboardList size={20} />, roles: ['admin', 'coordinador_operativo', 'staff'] },
        { name: 'Archivo Digital', path: '/documentos', icon: <Folder size={20} />, roles: ['admin', 'secretaria'] },
        { name: 'Generador de Actas', path: '/actas', icon: <FileText size={20} />, roles: ['admin', 'secretaria'] },
        { name: 'Comunicación', path: '/comunicacion', icon: <MessageSquare size={20} />, roles: ['all'], hasNotification: false }, // Keep false for now until connected
        { name: 'Calendario', path: '/calendario', icon: <Calendar size={20} />, roles: ['all'] },
        { name: 'Usuarios', path: '/registro-usuarios', icon: <Users size={20} />, roles: ['admin'] },
        { name: 'Sistema Admin', path: '/sistema', icon: <Settings size={20} />, roles: ['admin'] },
    ];

    const filteredMenuItems = menuItems.filter(item => {
        if (item.roles.includes('all')) return true;
        return item.roles.includes(userRole);
    });

    const isActive = (path) => location.pathname === path;

    const handleSignOut = async () => {
        try {
            await signOut();
            setIsMobileMenuOpen(false);
            navigate('/login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    // If on login page, render full screen without sidebar
    if (location.pathname === '/login') {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-body)' }}>
                <Watermark />
                {children}
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex' }}>
            <Watermark />
            {/* Sidebar (Desktop) */}
            <aside className="desktop-sidebar">

                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Logo Container - Removed circle, added drop-shadow contour */}
                    <div style={{
                        width: '80px', height: '80px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        {/* OFFICIAL LOGO (Original with Contour) */}
                        <img
                            src="/inn_logo_official.png"
                            alt="INN Logo"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 2px white) drop-shadow(0 0 2px white)'
                            }}
                        />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1rem', color: 'white', margin: 0, lineHeight: '1.2' }}>Iglesia Nuevo Nacimiento</h1>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>INN Admin</span>
                    </div>
                </div>

                {/* User Profile Mini */}
                <div style={{
                    marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', gap: '0.75rem'
                }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.email?.split('@')[0] || 'Usuario'}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7, textTransform: 'capitalize' }}>
                            {userRole.replace('_', ' ')}
                        </p>
                    </div>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filteredMenuItems.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: isActive(link.path) ? 'var(--color-sidebar-active)' : 'transparent',
                                color: isActive(link.path) ? 'var(--text-main)' : 'var(--text-secondary)',
                                fontWeight: isActive(link.path) ? '600' : '400',
                                transition: 'all 0.2s',
                                position: 'relative'
                            }}
                        >
                            {link.icon}
                            {link.name}
                            {link.hasNotification && (
                                <span style={{
                                    marginLeft: 'auto',
                                    width: '8px',
                                    height: '8px',
                                    backgroundColor: '#ef4444',
                                    borderRadius: '50%'
                                }}></span>
                            )}
                        </Link>
                    ))}
                </nav>

                <button
                    onClick={handleSignOut}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
                        cursor: 'pointer', marginTop: 'auto'
                    }}
                >
                    <LogOut size={20} />
                    Cerrar Sesión
                </button>
            </aside>

            {/* Mobile Header */}
            <div className="mobile-header">
                <div style={{
                    backgroundColor: 'var(--color-sidebar)', color: 'white',
                    padding: '1rem', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px', height: '40px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <img
                                src="/inn_logo_official.png"
                                alt="INN Logo"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 0 1px white) drop-shadow(0 0 1px white)'
                                }}
                            />
                        </div>
                        <span style={{ fontWeight: 'bold' }}>INN Admin</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: 'none', border: 'none', color: 'white' }}>
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div style={{
                    position: 'fixed', top: '60px', left: 0, right: 0, bottom: 0,
                    backgroundColor: 'var(--color-sidebar)', zIndex: 50, padding: '1rem'
                }}>
                    {filteredMenuItems.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                padding: '1rem', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            {link.icon}
                            {link.name}
                        </Link>
                    ))}

                    <button
                        onClick={handleSignOut}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '1rem', color: 'rgba(255,255,255,0.7)',
                            background: 'none', border: 'none', width: '100%',
                            textAlign: 'left', cursor: 'pointer',
                            marginTop: '1rem'
                        }}
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </button>
                </div>
            )}

            {/* Main Content Area */}
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                {children}
            </main>
        </div>
    );
}
