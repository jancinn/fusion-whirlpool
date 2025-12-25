import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Mail, Lock, Shield, Eye, EyeOff, Trash2, RefreshCw, AlertTriangle, CheckCircle, Briefcase, Edit2, X } from 'lucide-react';

export default function Users() {
    const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'edit'
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        password: '', // Only for creation
        role: 'director_ministerio',
        department: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Load users from Supabase
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            // Fallback for demo if table doesn't exist yet
            if (error.code === 'PGRST205') {
                setMessage({ type: 'error', text: 'Error: La tabla "profiles" no existe. Por favor ejecuta el script SQL.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const startEdit = (user) => {
        setEditingId(user.id);
        setFormData({
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            phone: user.phone || '',
            email: user.email,
            password: '',
            role: user.role,
            department: user.department || ''
        });
        setActiveTab('edit');
        setMessage({ type: '', text: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const profileData = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone: formData.phone,
                email: formData.email,
                role: formData.role,
                department: formData.department
            };

            if (activeTab === 'edit') {
                // UPDATE LOGIC
                const { error } = await supabase
                    .from('profiles')
                    .update(profileData)
                    .eq('id', editingId);

                if (error) throw error;

                setMessage({ type: 'success', text: 'Usuario actualizado correctamente.' });
                fetchUsers(); // Refresh list
                setTimeout(() => { setActiveTab('list'); setEditingId(null); }, 1500);

            } else {
                // CREATE LOGIC
                if (!formData.firstName.trim() || !formData.lastName.trim()) {
                    throw new Error('El Nombre y Apellido son obligatorios.');
                }

                // Insert into profiles table
                // Note: In a full auth system, we would create the Auth User first.
                // Here we just create the profile record for the dashboard.
                const { error } = await supabase
                    .from('profiles')
                    .insert([profileData]);

                if (error) throw error;

                setMessage({ type: 'success', text: `Usuario ${formData.firstName} creado.` });
                setFormData({ firstName: '', lastName: '', phone: '', email: '', password: '', role: 'director_ministerio', department: '' });
                fetchUsers(); // Refresh list
            }

        } catch (error) {
            console.error('Error:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (user) => {
        const confirmation = window.prompt(
            `⚠️ ADVERTENCIA DE BORRADO PERMANENTE ⚠️\n\nEstás a punto de eliminar a ${user.email}.\nEsta acción NO se puede deshacer.\n\nPara confirmar, escribe la palabra: ELIMINAR`
        );

        if (confirmation === 'ELIMINAR') {
            try {
                const { error } = await supabase
                    .from('profiles')
                    .delete()
                    .eq('id', user.id);

                if (error) throw error;

                setMessage({ type: 'success', text: `Usuario eliminado permanentemente.` });
                fetchUsers();
            } catch (error) {
                console.error('Error deleting:', error);
                alert("Error al eliminar: " + error.message);
            }
        }
    };

    const handleResetPassword = async (email) => {
        if (window.confirm(`¿Enviar correo de restablecimiento de contraseña a ${email}?`)) {
            alert(`Correo enviado a ${email}. (Simulado)`);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Gestión de Usuarios</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Administra el acceso y los roles del personal.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {activeTab !== 'list' && (
                        <button
                            onClick={() => { setActiveTab('list'); setEditingId(null); setFormData({ firstName: '', lastName: '', phone: '', email: '', password: '', role: 'director_ministerio', department: '' }); }}
                            className="btn"
                            style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)' }}
                        >
                            Cancelar
                        </button>
                    )}
                    {activeTab === 'list' && (
                        <button
                            onClick={() => setActiveTab('create')}
                            className="btn btn-primary"
                        >
                            <UserPlus size={18} style={{ marginRight: '0.5rem' }} /> Nuevo Usuario
                        </button>
                    )}
                </div>
            </div>

            {(activeTab === 'create' || activeTab === 'edit') && (
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
                        {activeTab === 'edit' ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
                    </h2>

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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Ej: Juan"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Apellido</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Ej: Pérez"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-main)' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Teléfono</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="Ej: +52 55 1234 5678"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-main)' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Mail size={18} /> Correo Electrónico
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                disabled={activeTab === 'edit'} // Email is ID, usually not editable easily
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-light)',
                                    backgroundColor: activeTab === 'edit' ? 'var(--bg-surface)' : 'var(--bg-body)',
                                    color: activeTab === 'edit' ? 'var(--text-secondary)' : 'var(--text-main)',
                                    cursor: activeTab === 'edit' ? 'not-allowed' : 'text'
                                }}
                                placeholder="ejemplo@iglesia.com"
                            />
                        </div>

                        {activeTab === 'create' && (
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <Lock size={18} /> Contraseña Temporal
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Mínimo 6 caracteres"
                                        minLength={6}
                                        style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-main)' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Shield size={18} /> Rol Asignado
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-body)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}
                            >
                                <option value="coordinador_general">Coordinador General</option>
                                <option value="coordinador_area">Coordinador de Área (Rama)</option>
                                <option value="director_ministerio">Director de Ministerio (Específico)</option>
                                <option value="staff">Staff Pastoral (Oficina)</option>
                                <option value="admin">Administrador General</option>
                            </select>
                        </div>

                        {/* Department Selector Dynamic */}
                        {formData.role !== 'admin' && (
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <Briefcase size={18} /> Departamento / Área
                                </label>
                                <select
                                    name="department"
                                    value={formData.department || ''}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-body)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}
                                >
                                    <option value="">-- Seleccione Departamento --</option>

                                    {formData.role === 'director_ministerio' && (
                                        <optgroup label="Rama Ministerial">
                                            <option value="Control">Control (Mayordomía, Mantenimiento, Fondos)</option>
                                            <option value="Desarrollo">Desarrollo (Música, Liturgia, Ujieres)</option>
                                            <option value="Discipulado">Discipulado (Niños, Jóvenes, Grupos)</option>
                                            <option value="Interacción">Interacción (Social, Artes, Deportes)</option>
                                            <option value="Alcance">Alcance (Evangelismo, Misiones)</option>
                                        </optgroup>
                                    )}

                                    {formData.role === 'coordinador_operativo' && (
                                        <optgroup label="Rama Operativa">
                                            <option value="Producción">Producción (Video, Sonido)</option>
                                            <option value="Comunicación">Comunicación (Redes, Diseño)</option>
                                            <option value="Logística">Logística (Montaje, Espacios)</option>
                                            <option value="Tecnología">Tecnología (Sistemas, Equipos)</option>
                                        </optgroup>
                                    )}

                                    {formData.role === 'staff' && (
                                        <optgroup label="Staff Pastoral">
                                            <option value="Tesorería">Tesorería</option>
                                            <option value="Secretaría">Secretaría</option>
                                            <option value="Administración">Administración</option>
                                        </optgroup>
                                    )}
                                </select>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                            {activeTab === 'edit' ? 'Guardar Cambios' : 'Crear Usuario'}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'list' && (
                <div className="card">
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Usuario</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Rol</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Estado</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                    {(user.first_name || user.firstName || user.email).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600' }}>
                                                        {(user.first_name || user.firstName) ? `${user.first_name || user.firstName} ${user.last_name || user.lastName}` : 'Usuario sin nombre'}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.85rem',
                                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                                    textTransform: 'capitalize',
                                                    width: 'fit-content'
                                                }}>
                                                    {(user.role || 'Sin rol').replace('_', ' ')}
                                                </span>
                                                {user.department && (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                                                        {user.department.split('(')[0]}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {/* Default to Active if status is missing (since we didn't create a status column yet) */}
                                            {(user.status === 'active' || !user.status) ? (
                                                <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
                                                    <CheckCircle size={14} /> Activo
                                                </span>
                                            ) : (
                                                <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
                                                    <AlertTriangle size={14} /> Inactivo
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => startEdit(user)}
                                                    className="btn-icon"
                                                    title="Editar Usuario"
                                                    style={{ color: 'var(--color-primary)' }}
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(user.email)}
                                                    className="btn-icon"
                                                    title="Restablecer Contraseña"
                                                    style={{ color: 'var(--color-accent)' }}
                                                >
                                                    <RefreshCw size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.email)}
                                                    className="btn-icon"
                                                    title="Eliminar Usuario Permanentemente"
                                                    style={{ color: '#ef4444' }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
