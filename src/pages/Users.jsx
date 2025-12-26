import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Users as UsersIcon, Shield, Edit2, X, Save, AlertTriangle } from 'lucide-react';

export default function Users() {
    const { user } = useAuth();
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null); // User being edited
    const [selectedRole, setSelectedRole] = useState('');
    const [errorMsg, setErrorMsg] = useState(null);

    // Roles válidos definidos por el sistema
    const VALID_ROLES = [
        { value: 'administrador_general', label: 'Administrador General' },
        { value: 'secretaria', label: 'Secretaria' },
        { value: 'coordinador_area', label: 'Coordinador de Área' },
        { value: 'coordinador_operativo', label: 'Coordinador Operativo' },
        { value: 'director', label: 'Director' }
    ];

    const currentUserRole = user?.user_metadata?.role;
    const isAdmin = currentUserRole === 'administrador_general';

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        } else {
            setLoading(false);
        }
    }, [isAdmin]);

    const fetchUsers = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            // Call RPC function to get users securely
            const { data, error } = await supabase.rpc('get_users_list');

            if (error) throw error;
            setUsersList(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            setErrorMsg('Error al cargar usuarios: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (targetUser) => {
        setEditingUser(targetUser);
        setSelectedRole(targetUser.role || 'director'); // Default to director if null
    };

    const handleSaveRole = async () => {
        if (!editingUser) return;

        try {
            console.log(`[AUDIT] Admin ${user.email} changing role of ${editingUser.email} to ${selectedRole} at ${new Date().toISOString()}`);

            const { error } = await supabase.rpc('update_user_role', {
                target_user_id: editingUser.id,
                new_role: selectedRole
            });

            if (error) throw error;

            alert(`Rol de ${editingUser.email} actualizado a ${selectedRole}`);
            setEditingUser(null);
            fetchUsers(); // Refresh list

        } catch (error) {
            console.error('Error updating role:', error);
            alert('Error al actualizar rol: ' + error.message);
        }
    };

    // 1. Security Check: Only administrador_general
    if (!isAdmin) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>
                <Shield size={48} style={{ marginBottom: '1rem' }} />
                <h2>Acceso Denegado</h2>
                <p>Este módulo es exclusivo para el Administrador General.</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <UsersIcon /> Gestión de Usuarios y Roles
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Administración centralizada de permisos.
                </p>
            </div>

            {errorMsg && (
                <div className="card" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', marginBottom: '1rem', border: '1px solid #fca5a5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={20} />
                        {errorMsg}
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando usuarios...</div>
            ) : (
                <div className="card">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Usuario</th>
                                <th style={{ padding: '1rem' }}>Email</th>
                                <th style={{ padding: '1rem' }}>Rol Actual</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersList.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>
                                        {u.first_name} {u.last_name}
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                        {u.email}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            backgroundColor: 'var(--bg-body)',
                                            fontSize: '0.85rem',
                                            border: '1px solid var(--border-light)'
                                        }}>
                                            {u.role || 'Sin Rol'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            className="btn"
                                            onClick={() => handleEditClick(u)}
                                            disabled={u.id === user.id} // Cannot edit self
                                            style={{
                                                opacity: u.id === user.id ? 0.5 : 1,
                                                cursor: u.id === user.id ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            <Edit2 size={16} style={{ marginRight: '0.5rem' }} /> Editar Rol
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* EDIT ROLE MODAL */}
            {editingUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', animation: 'fadeIn 0.2s' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Asignar Rol</h2>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Usuario:</p>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{editingUser.email}</div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Selecciona el nuevo rol:</label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '4px',
                                    border: '1px solid var(--border-light)',
                                    backgroundColor: 'var(--bg-body)', color: 'var(--text-main)',
                                    fontSize: '1rem'
                                }}
                            >
                                {VALID_ROLES.map(role => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                className="btn"
                                onClick={() => setEditingUser(null)}
                                style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)' }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveRole}
                            >
                                <Save size={18} style={{ marginRight: '0.5rem' }} /> Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
