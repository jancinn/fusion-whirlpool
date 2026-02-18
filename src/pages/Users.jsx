import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Users as UsersIcon, Edit2, X, Save, AlertCircle, Plus, UserPlus, CheckCircle, Trash2, UserX, UserCheck, Shield } from 'lucide-react';

const AVAILABLE_ROLES = [
    { id: 'administrador_general', label: 'Administrador General' },
    { id: 'coordinador_operativo', label: 'Coordinador Operativo' },
    { id: 'coordinador_ministerio', label: 'Coordinador de Ministerio' },
    { id: 'director_ministerio', label: 'Director de Ministerio' },
    { id: 'secretaria', label: 'Secretaria' },
    { id: 'tesorero', label: 'Tesorero' },
    { id: 'staff', label: 'Staff' }
];

const AVAILABLE_MINISTRIES = [
    'Control',
    'Desarrollo',
    'Discipulado',
    'Interacción',
    'Alcance'
];

export default function Users() {
    const { user } = useAuth();
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [secretModal, setSecretModal] = useState({ isOpen: false, action: null, data: null });
    const [secretKey, setSecretKey] = useState('');
    const [pendingAction, setPendingAction] = useState(null);
    const [targetUser, setTargetUser] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        role: 'staff',
        department: '',
        email: '',
        password: ''
    });

    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

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
        setError(null);
        try {
            const { data, error } = await supabase.rpc('get_users_list');
            if (error) throw error;
            setUsersList(data || []);
        } catch (error) {
            setError(error?.message ?? 'Ocurrió un error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (targetUser) => {
        // FIX: Sanitize to plain object to avoid cyclic structures
        setEditingUser({
            id: targetUser.id,
            email: targetUser.email || '',
            first_name: targetUser.first_name || '',
            last_name: targetUser.last_name || '',
            role: targetUser.role || 'staff'
        });
        setIsCreating(false);
        setFormData({
            firstName: targetUser.first_name || '',
            lastName: targetUser.last_name || '',
            role: targetUser.role || 'staff',
            department: targetUser.department || '',
            email: targetUser.email || '',
            password: '' // Clear password field
        });
        setError(null);
        setSuccessMsg(null);
    };

    const handleNewUserClick = () => {
        setIsCreating(true);
        setEditingUser(null);
        setFormData({
            firstName: '',
            lastName: '',
            role: 'staff',
            department: '',
            email: '',
            password: ''
        });
        setError(null);
        setSuccessMsg(null);
    };

    const isCriticalAction = (action, targetUser, newRole) => {
        const currentRole = targetUser?.role || targetUser?.user_metadata?.role;

        if (action === 'create' && newRole === 'administrador_general') return true;
        if (action === 'update') {
            // Si el nuevo rol es admin_general O si el rol actual es admin_general
            if (newRole === 'administrador_general' || currentRole === 'administrador_general') return true;
        }
        if (action === 'suspend' && currentRole === 'administrador_general') return true;
        if (action === 'delete' && currentRole === 'administrador_general') return true;
        return false;
    };

    const handleSave = async (providedSecret = null) => {
        setError(null);
        setSuccessMsg(null);

        try {
            if (isCreating) {
                // Validation
                if (!formData.email || !formData.password || !formData.firstName) {
                    throw new Error('Por favor completa los campos obligatorios (Email, Contraseña, Nombre)');
                }

                if (isCriticalAction('create', null, formData.role) && !providedSecret) {
                    setSecretModal({ isOpen: true, action: 'create', data: null });
                    return;
                }

                const { data, error } = await supabase.rpc('create_new_user', {
                    new_email: formData.email,
                    new_first_name: formData.firstName,
                    new_last_name: formData.lastName,
                    new_password: formData.password,
                    new_role: formData.role,
                    new_department: formData.department || null,
                    p_secret: providedSecret
                });

                if (error) throw error;
                if (data && !data.success) throw new Error(data.message);

                setSuccessMsg('Usuario creado correctamente');
                setIsCreating(false);
            } else {
                if (isCriticalAction('update', editingUser, formData.role) && !providedSecret) {
                    setSecretModal({ isOpen: true, action: 'update', data: editingUser });
                    return;
                }

                // FIX: Use RPC to update auth.users metadata (source of truth for get_users_list)
                // We ensure all inputs are primitives to avoid JSON serialization errors.
                const { data, error } = await supabase.rpc('update_user_profile', {
                    new_first_name: String(formData.firstName || ''),
                    new_last_name: String(formData.lastName || ''),
                    new_role: String(formData.role || ''),
                    target_user_id: editingUser.id,           // MOVED UP (Mandatory)
                    new_department: String(formData.department || ''), // Optional
                    p_secret: providedSecret || null          // Optional
                });

                if (error) throw error;
                if (data && !data.success) throw new Error(data.message);

                setSuccessMsg('Perfil actualizado correctamente');
                setEditingUser(null);
            }

            fetchUsers();

        } catch (error) {
            setError(error?.message ?? 'Ocurrió un error');
        } finally {
            setLoading(false);
        }
    };

    const handleSuspend = async (targetUser, providedSecret = null) => {
        if (isCriticalAction('suspend', targetUser) && !providedSecret) {
            setSecretModal({ isOpen: true, action: 'suspend', data: targetUser });
            return;
        }

        setError(null);
        setSuccessMsg(null);
        setActionLoading(true);

        try {
            const { data, error } = await supabase.rpc('suspend_user', {
                p_user_id: targetUser.id,
                p_is_suspended: !targetUser.is_suspended,
                p_secret: providedSecret
            });

            if (error) throw error;
            if (data && !data.success) throw new Error(data.message);

            setSuccessMsg(targetUser.is_suspended ? 'Usuario activado correctamente' : 'Usuario suspendido correctamente');
            fetchUsers();
        } catch (error) {
            setError(error?.message ?? 'Ocurrió un error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteClick = (user) => {
        const flatUser = {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
        };
        if (user.role === 'administrador_general') {
            setPendingAction('delete');
            setTargetUser(flatUser);
            setSecretModal({ isOpen: true, action: 'delete', data: flatUser });
        } else {
            setUserToDelete(flatUser);
        }
    };


    const handleDelete = async () => {
        if (!userToDelete) return;

        setError(null);
        setSuccessMsg(null);
        setActionLoading(true);

        try {
            const { data, error: rpcError } = await supabase.rpc('delete_user', {
                p_secret: secretKey ?? null,
                p_user_id: userToDelete.id,
            });

            if (rpcError) throw rpcError;

            if (data === 'CLAVE_INVALIDA') {
                setError('Clave de autorización inválida');
                return;
            }
            if (data === 'ULTIMO_ADMIN') {
                setError('No se puede eliminar al único Administrador General activo');
                return;
            }
            if (data !== 'OK') {
                throw new Error(data || 'Error desconocido al eliminar');
            }

            setSuccessMsg('Usuario eliminado correctamente');
            setUserToDelete(null);
            setSecretKey('');
            fetchUsers();
        } catch (error) {
            setError(error?.message ?? 'Ocurrió un error');
        } finally {
            setActionLoading(false);
        }
    };

    const getRoleLabel = (roleId) => {
        if (!roleId) return 'Sin Rol';
        const role = AVAILABLE_ROLES.find(r => r.id === roleId);
        return role ? role.label : roleId;
    };

    if (!isAdmin) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <AlertCircle size={48} style={{ color: 'var(--color-warning)', margin: '0 auto 1rem' }} />
                <h2>Acceso Denegado</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Solo los Administradores Generales pueden acceder a esta sección.
                </p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        <UsersIcon style={{ marginRight: '0.75rem', verticalAlign: 'bottom' }} />
                        Gestión de Usuarios
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Administra los perfiles y roles de los usuarios del sistema
                    </p>
                </div>
                <button
                    onClick={handleNewUserClick}
                    className="btn btn-primary"
                    style={{
                        padding: '0.75rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        fontWeight: '600'
                    }}
                >
                    <UserPlus size={20} />
                    Nuevo Usuario
                </button>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div style={{
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {successMsg && (
                <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <CheckCircle size={18} />
                    {successMsg}
                </div>
            )}

            {/* Users Table */}
            <div style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                {loading && !usersList.length ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Cargando usuarios...
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '1.25rem 1rem', textAlign: 'left', fontWeight: '600', width: '30%', color: 'var(--text-main)', position: 'sticky', top: 0, backgroundColor: 'var(--bg-surface)', zIndex: 10 }}>Nombre</th>
                                    <th style={{ padding: '1.25rem 1rem', textAlign: 'left', fontWeight: '600', width: '35%', color: 'var(--text-main)', position: 'sticky', top: 0, backgroundColor: 'var(--bg-surface)', zIndex: 10 }}>Correo</th>
                                    <th style={{ padding: '1.25rem 1rem', textAlign: 'left', fontWeight: '600', width: '20%', color: 'var(--text-main)', position: 'sticky', top: 0, backgroundColor: 'var(--bg-surface)', zIndex: 10 }}>Rol</th>
                                    <th style={{ padding: '1.25rem 1rem', textAlign: 'center', fontWeight: '600', width: '15%', color: 'var(--text-main)', position: 'sticky', top: 0, backgroundColor: 'var(--bg-surface)', zIndex: 10 }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersList.map((targetUser) => (
                                    <tr key={targetUser.id} style={{
                                        borderBottom: '1px solid var(--border-light)',
                                        transition: 'background-color 0.2s'
                                    }} className="table-row-hover">
                                        <td style={{ padding: '1.5rem 1rem', verticalAlign: 'middle', color: 'var(--text-main)' }}>
                                            <div style={{
                                                fontSize: '1rem',
                                                fontWeight: '600',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }} title={`${targetUser.first_name} ${targetUser.last_name}`}>
                                                {targetUser.first_name} {targetUser.last_name}
                                            </div>
                                        </td>
                                        <td style={{
                                            padding: '1.5rem 1rem',
                                            verticalAlign: 'middle',
                                            color: 'var(--text-secondary)',
                                            maxWidth: 0 // Required for ellipsis in table cell
                                        }}>
                                            <div style={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }} title={targetUser.email}>
                                                {targetUser.email}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.5rem 1rem', verticalAlign: 'middle' }}>
                                            <span style={{
                                                padding: '0.4rem 0.9rem',
                                                borderRadius: '12px',
                                                fontSize: '0.8125rem',
                                                fontWeight: '500',
                                                backgroundColor: targetUser.role === 'administrador_general' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                                                color: targetUser.role === 'administrador_general' ? 'white' : 'var(--text-secondary)',
                                                border: targetUser.role === 'administrador_general' ? 'none' : '1px solid var(--border-light)',
                                                display: 'inline-block',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {getRoleLabel(targetUser.role)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.5rem 1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleEditClick(targetUser)}
                                                    className="btn"
                                                    title="Editar Perfil"
                                                    style={{
                                                        padding: '0.6rem',
                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                        border: '1px solid var(--border-light)',
                                                        color: 'var(--text-main)',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    <Edit2 size={16} />
                                                </button>

                                                <button
                                                    onClick={() => handleSuspend(targetUser)}
                                                    className="btn"
                                                    disabled={actionLoading || targetUser.id === user?.id}
                                                    title={targetUser.is_suspended ? "Activar Usuario" : "Suspender Usuario"}
                                                    style={{
                                                        padding: '0.6rem',
                                                        backgroundColor: targetUser.is_suspended ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                        border: '1px solid ' + (targetUser.is_suspended ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'),
                                                        color: targetUser.is_suspended ? '#10b981' : '#f59e0b',
                                                        borderRadius: '8px',
                                                        opacity: targetUser.id === user?.id ? 0.5 : 1,
                                                        cursor: targetUser.id === user?.id ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    {targetUser.is_suspended ? <UserCheck size={16} /> : <UserX size={16} />}
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteClick(targetUser)}
                                                    className="btn"
                                                    disabled={actionLoading || targetUser.id === user?.id}
                                                    title="Eliminar Definitivamente"
                                                    style={{
                                                        padding: '0.6rem',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                                        color: '#ef4444',
                                                        borderRadius: '8px',
                                                        opacity: targetUser.id === user?.id ? 0.5 : 1,
                                                        cursor: targetUser.id === user?.id ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && usersList.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No hay usuarios registrados
                    </div>
                )}
            </div>

            {/* Modal (Edit or Create) */}
            {(editingUser || isCreating) && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="card animate-fade-in" style={{
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1.5rem',
                            paddingBottom: '1rem',
                            borderBottom: '1px solid var(--border-light)'
                        }}>
                            <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-main)' }}>
                                {isCreating ? 'Nuevo Usuario' : 'Editar Usuario'}
                            </h2>
                            <button
                                onClick={() => { setEditingUser(null); setIsCreating(false); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    padding: '0.5rem'
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Form */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                            {/* Email */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                    Correo Electrónico {isCreating && <span style={{ color: '#ef4444' }}>*</span>}
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={!isCreating}
                                    placeholder="ejemplo@correo.com"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-light)',
                                        backgroundColor: isCreating ? 'var(--bg-body)' : 'rgba(255,255,255,0.05)',
                                        color: isCreating ? 'var(--text-main)' : 'var(--text-secondary)',
                                        cursor: isCreating ? 'text' : 'not-allowed'
                                    }}
                                    required
                                />
                            </div>

                            {/* Password (Only for creation) */}
                            {isCreating && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                        Contraseña <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Mínimo 6 caracteres"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-light)',
                                            backgroundColor: 'var(--bg-body)',
                                            color: 'var(--text-main)'
                                        }}
                                        required
                                    />
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {/* First Name */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                        Nombre <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        placeholder="Nombre"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-light)',
                                            backgroundColor: 'var(--bg-body)',
                                            color: 'var(--text-main)'
                                        }}
                                        required
                                    />
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                        Apellido
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        placeholder="Apellido"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-light)',
                                            backgroundColor: 'var(--bg-body)',
                                            color: 'var(--text-main)'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                    Rol del Sistema
                                </label>
                                <select
                                    value={formData.role || 'staff'}
                                    onChange={(e) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            role: e.target.value   // <-- SIEMPRE STRING
                                        }));
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-light)',
                                        backgroundColor: 'var(--bg-body)',
                                        color: 'var(--text-main)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {AVAILABLE_ROLES.map(role => (
                                        <option key={role.id} value={role.id}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                    {formData.role === 'administrador_general'
                                        ? '⚠️ Acceso total a la configuración y gestión de usuarios.'
                                        : 'Acceso limitado según las funciones del rol seleccionado.'}
                                </p>
                            </div>

                            {/* Ministry / Department Selection */}
                            {(formData.role === 'director_ministerio' || formData.role === 'coordinador_ministerio') && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                        Ministerio / Área Asignada
                                    </label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-light)',
                                            backgroundColor: 'var(--bg-body)',
                                            color: 'var(--text-main)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="">-- Seleccionar Ministerio --</option>
                                        {AVAILABLE_MINISTRIES.map(min => (
                                            <option key={min} value={min}>
                                                {min}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button
                                    onClick={() => { setEditingUser(null); setIsCreating(false); }}
                                    className="btn"
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        backgroundColor: 'var(--bg-surface)',
                                        border: '1px solid var(--border-light)',
                                        color: 'var(--text-main)',
                                        fontWeight: '600'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleSave()}
                                    className="btn btn-primary"
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        backgroundColor: 'var(--color-primary)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        fontWeight: '600'
                                    }}
                                >
                                    {isCreating ? <Plus size={18} /> : <Save size={18} />}
                                    {isCreating ? 'Crear Usuario' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {userToDelete && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1100,
                    padding: '1rem',
                    backdropFilter: 'blur(8px)'
                }}>
                    <div className="card animate-fade-in" style={{
                        width: '100%',
                        maxWidth: '400px',
                        textAlign: 'center',
                        padding: '2rem'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            color: '#ef4444'
                        }}>
                            <Trash2 size={32} />
                        </div>

                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
                            ¿Eliminar usuario?
                        </h2>

                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
                            Estás a punto de eliminar a <strong>{userToDelete?.first_name} {userToDelete?.last_name}</strong>.<br />
                            Esta acción es permanente y no se puede deshacer.
                        </p>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setUserToDelete(null)}
                                className="btn"
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--bg-surface)',
                                    border: '1px solid var(--border-light)',
                                    color: 'var(--text-main)',
                                    fontWeight: '600'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={actionLoading}
                                className="btn"
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    fontWeight: '600'
                                }}
                            >
                                {actionLoading ? 'Eliminando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Secret Key Authorization Modal */}
            {secretModal.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 2000,
                    backdropFilter: 'blur(10px)'
                }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <Shield size={48} style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
                            <h2 style={{ margin: 0 }}>Autorización Requerida</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                Esta acción afecta a un Administrador General y requiere una clave secreta.
                            </p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
                                Clave Secreta
                            </label>
                            <input
                                type="password"
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                                placeholder="Ingresa la clave de autorización"
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '8px',
                                    border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)',
                                    color: 'var(--text-main)'
                                }}
                                autoFocus
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => {
                                    setSecretModal({ isOpen: false, action: null, data: null });
                                    setSecretKey('');
                                }}
                                className="btn"
                                style={{ flex: 1, padding: '0.75rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    const { action, data } = secretModal;
                                    setSecretModal({ isOpen: false, action: null, data: null });
                                    if (action === 'create' || action === 'update') handleSave(secretKey);
                                    if (action === 'suspend') handleSuspend(data, secretKey);
                                    if (action === 'delete') {
                                        setUserToDelete({
                                            id: data.id,
                                            first_name: data.first_name,
                                            last_name: data.last_name,
                                            role: data.role
                                        });
                                        setPendingAction(null);
                                        setTargetUser(null);
                                    }
                                    if (action !== 'delete') {
                                        setSecretKey('');
                                    }
                                }}
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '0.75rem', backgroundColor: 'var(--color-primary)', color: 'white' }}
                            >
                                Autorizar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
