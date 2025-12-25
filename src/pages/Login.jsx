import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: ''
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false); // Toggle for registration mode
    const [showPassword, setShowPassword] = useState(false);
    const { user, signIn, signOut } = useAuth();
    const navigate = useNavigate();

    // If user is already logged in, give them option to logout or go to dashboard
    if (user && !loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-body)'
            }}>
                <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%',
                            backgroundColor: 'var(--bg-surface)', margin: '0 auto 1rem auto',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem', fontWeight: 'bold'
                        }}>
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Sesión Activa</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Has iniciado sesión como <br />
                            <strong style={{ color: 'var(--text-main)' }}>{user.email}</strong>
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            onClick={() => navigate('/')}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                        >
                            Ir al Dashboard
                        </button>

                        <div style={{ position: 'relative', margin: '1rem 0' }}>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)' }} />
                            <span style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                backgroundColor: 'var(--bg-card)', padding: '0 0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)'
                            }}>
                                O
                            </span>
                        </div>

                        <button
                            onClick={async () => {
                                await signOut();
                                // State update will trigger re-render showing login form
                            }}
                            style={{
                                background: 'none', border: '1px solid var(--border-light)',
                                padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                color: 'var(--text-secondary)', cursor: 'pointer', width: '100%'
                            }}
                        >
                            Cerrar Sesión para Registrar Nueva Cuenta
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                // 1. Register in Supabase (Real Backend)
                const { data, error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            first_name: formData.firstName,
                            last_name: formData.lastName,
                            phone: formData.phone,
                            role: 'admin' // Default to admin for self-registration
                        }
                    }
                });

                if (error) throw error;

                // 2. MAGIC STEP: Auto-approve locally for Dev Mode
                // Save to local storage so the 'signIn' backdoor works immediately
                const newUser = {
                    id: data.user?.id || Math.random().toString(),
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    role: 'admin',
                    department: '',
                    status: 'active'
                };

                const existingUsers = JSON.parse(localStorage.getItem('inn_users_list') || '[]');
                // Avoid duplicates
                const filteredUsers = existingUsers.filter(u => u.email !== formData.email);
                localStorage.setItem('inn_users_list', JSON.stringify([...filteredUsers, newUser]));

                // 3. Auto Login
                await signIn(formData.email, formData.password);
                navigate('/');

            } else {
                // Normal Login
                await signIn(formData.email, formData.password);
                navigate('/');
            }
        } catch (err) {
            console.error('Error de autenticación:', err);
            setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-body)',
            padding: '1rem'
        }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '450px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', color: 'var(--color-primary)', fontWeight: '800', marginBottom: '0.5rem' }}>
                        {isSignUp ? 'Crear Cuenta' : 'Bienvenido'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {isSignUp ? 'Ingresa tus datos para registrarte' : 'Sistema Administrativo INN'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {isSignUp && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Nombre</label>
                                    <input
                                        type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-main)' }}
                                        placeholder="Tu Nombre"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Apellido</label>
                                    <input
                                        type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-main)' }}
                                        placeholder="Tu Apellido"
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Teléfono</label>
                                <input
                                    type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-main)' }}
                                    placeholder="+1 555 000 0000"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Correo Electrónico</label>
                        <input
                            type="email" name="email" value={formData.email} onChange={handleInputChange} required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-main)' }}
                            placeholder="nombre@iglesia.com"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} required
                                style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-main)' }}
                                placeholder="••••••••"
                                minLength={6}
                            />
                            <button
                                type="button" onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', marginTop: '1rem', padding: '0.875rem', fontSize: '1rem' }}
                    >
                        {loading ? 'Procesando...' : (isSignUp ? 'Registrarme e Iniciar' : 'Iniciar Sesión')}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {isSignUp ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?'}
                    </p>
                    <button
                        onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' }}
                    >
                        {isSignUp ? 'Inicia Sesión aquí' : 'Crear Cuenta Nueva'}
                    </button>
                </div>
            </div>
        </div>
    );
}
