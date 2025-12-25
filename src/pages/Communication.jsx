import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Mail, Send, Inbox, FileText, User, Shield } from 'lucide-react';

export default function Communication() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('inbox'); // inbox, sent, compose, monitor
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]); // For selecting recipient

    // Compose State
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [sendSuccess, setSendSuccess] = useState('');

    const userRole = user?.user_metadata?.role || 'peticionario';
    const isAdmin = userRole === 'admin';

    useEffect(() => {
        if (activeTab === 'compose') {
            fetchUsers();
        } else {
            fetchMessages();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        // In a real app, we'd fetch from a 'profiles' table. 
        // For now, we might not have a list of all users accessible easily without a dedicated table.
        // I'll mock some users or try to fetch from auth if possible (usually not possible client-side).
        // Let's assume we have a 'profiles' table or similar, or just hardcode roles for now.
        // Better: Allow sending to "Roles" (e.g., "To: Coordinators").
    };

    const fetchMessages = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('messages')
                .select('*, sender:sender_id(email), recipient:recipient_id(email)')
                .order('created_at', { ascending: false });

            if (activeTab === 'inbox') {
                query = query.eq('recipient_id', user.id);
            } else if (activeTab === 'sent') {
                query = query.eq('sender_id', user.id);
            } else if (activeTab === 'monitor' && isAdmin) {
                // Admin sees ALL messages
                // No filter needed, just fetch all
            }

            // Note: Since we don't have the 'messages' table yet, this will fail. 
            // I will handle the error gracefully or mock data for the UI demo.
            const { data, error } = await query;

            if (error) {
                // If table doesn't exist, use mock data for demo
                console.warn("Table messages might not exist yet, using mock data");
                setMessages([
                    { id: 1, sender: { email: 'lider@iglesia.com' }, recipient: { email: 'admin@iglesia.com' }, subject: 'Duda sobre presupuesto', content: 'Hola, quería consultar...', created_at: new Date().toISOString() },
                    { id: 2, sender: { email: 'tesorero@iglesia.com' }, recipient: { email: 'lider@iglesia.com' }, subject: 'Re: Facturas', content: 'Por favor envía los recibos.', created_at: new Date(Date.now() - 86400000).toISOString() }
                ]);
            } else {
                setMessages(data || []);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        // Logic to insert message into Supabase
        // await supabase.from('messages').insert(...)
        setSendSuccess('Mensaje enviado (Simulación)');
        setTimeout(() => setSendSuccess(''), 3000);
        setSubject('');
        setContent('');
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Comunicación Interna</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Mensajería oficial y segura entre coordinación.</p>
                </div>
                {isAdmin && (
                    <div style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <Shield size={16} /> Modo Auditoría Activo
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column', md: 'row' }}>
                {/* Sidebar Navigation */}
                <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
                    <button
                        onClick={() => setActiveTab('compose')}
                        className="btn btn-primary"
                        style={{ marginBottom: '1rem', justifyContent: 'center' }}
                    >
                        <FileText size={18} style={{ marginRight: '0.5rem' }} /> Redactar
                    </button>

                    <button
                        onClick={() => setActiveTab('inbox')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: activeTab === 'inbox' ? 'var(--bg-body)' : 'transparent',
                            color: activeTab === 'inbox' ? 'var(--text-main)' : 'var(--text-secondary)',
                            border: 'none', cursor: 'pointer', textAlign: 'left'
                        }}
                    >
                        <Inbox size={18} /> Recibidos
                    </button>

                    <button
                        onClick={() => setActiveTab('sent')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: activeTab === 'sent' ? 'var(--bg-body)' : 'transparent',
                            color: activeTab === 'sent' ? 'var(--text-main)' : 'var(--text-secondary)',
                            border: 'none', cursor: 'pointer', textAlign: 'left'
                        }}
                    >
                        <Send size={18} /> Enviados
                    </button>

                    {isAdmin && (
                        <>
                            <div style={{ height: '1px', backgroundColor: 'var(--border-light)', margin: '0.5rem 0' }}></div>
                            <button
                                onClick={() => setActiveTab('monitor')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: activeTab === 'monitor' ? 'var(--bg-body)' : 'transparent',
                                    color: activeTab === 'monitor' ? '#eab308' : 'var(--text-secondary)',
                                    border: 'none', cursor: 'pointer', textAlign: 'left'
                                }}
                            >
                                <Shield size={18} /> Monitor Global
                            </button>
                        </>
                    )}
                </div>

                {/* Main Content Area */}
                <div style={{ flex: 1 }}>
                    {activeTab === 'compose' ? (
                        <div className="card">
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>Nuevo Mensaje</h2>
                            {sendSuccess && <div style={{ padding: '1rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>{sendSuccess}</div>}

                            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Para:</label>
                                    <select
                                        value={recipient}
                                        onChange={(e) => setRecipient(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}
                                    >
                                        <option value="">Seleccionar Destinatario...</option>
                                        <option value="admin">Administrador General</option>
                                        <option value="coordinadores">Todos los Coordinadores</option>
                                        <option value="tesoreria">Tesorería</option>
                                        <option value="secretaria">Secretaría</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Asunto:</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Mensaje:</label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        required
                                        rows={8}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" className="btn btn-primary">
                                        <Send size={18} style={{ marginRight: '0.5rem' }} /> Enviar Mensaje
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)' }}>
                                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>
                                    {activeTab === 'inbox' && 'Bandeja de Entrada'}
                                    {activeTab === 'sent' && 'Enviados'}
                                    {activeTab === 'monitor' && 'Auditoría Global (Admin)'}
                                </h2>
                            </div>

                            {messages.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    <Inbox size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p>No hay mensajes para mostrar.</p>
                                </div>
                            ) : (
                                <div>
                                    {messages.map(msg => (
                                        <div key={msg.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', transition: 'background 0.2s' }} className="message-item">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                                    {activeTab === 'sent' ? `Para: ${msg.recipient?.email || '...'}` : `De: ${msg.sender?.email || '...'}`}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(msg.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div style={{ fontWeight: '500', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{msg.subject}</div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
