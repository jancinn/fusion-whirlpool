import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
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
                            Cerrar Sesión
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
            // Normal Login
            await signIn(formData.email, formData.password);
            navigate('/');
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
                        Bienvenido
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Sistema Administrativo INN
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
                        {loading ? 'Procesando...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
}
