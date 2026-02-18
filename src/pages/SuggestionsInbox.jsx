import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, ArrowRight, Check, X } from 'lucide-react';

export default function SuggestionsInbox() {
    const { user } = useAuth();
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);

    const userRole = user?.user_metadata?.role || '';
    const isCoordinator = userRole.includes('coordinador') || userRole === 'administrador_general';

    useEffect(() => {
        if (isCoordinator) {
            fetchData();
        }
    }, [isCoordinator]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Suggestions
            const { data: suggestionsData, error: sError } = await supabase
                .from('solicitudes')
                .select('*')
                .eq('tipo', 'sugerencia')
                .eq('status', 'pendiente_de_revision')
                .order('created_at', { ascending: false });

            if (sError) throw sError;

            // 2. Fetch Users to check Departments (Hierarchy Enforcement)
            // We use the updated RPC that returns 'department'
            const { data: usersData, error: uError } = await supabase.rpc('get_users_list');

            if (uError) throw uError;

            // Create User Map
            const usersMap = {};
            usersData.forEach(u => {
                usersMap[u.id] = u;
            });

            // 3. Filter Logic
            const myRole = user?.user_metadata?.role;
            const myDept = user?.user_metadata?.department;

            const filteredSuggestions = (suggestionsData || []).filter(s => {
                // Admin sees all
                if (myRole === 'administrador_general') return true;

                // Ops Coordinator sees...? (For now: All, or we can filter if we add 'Operaciones' dept later)
                // Assuming Ops Coordinator might need to see operational requests, but usually suggestions come from Ministry Directors.
                // If Ops Coordinator needs to see everything, return true.
                if (myRole === 'coordinador_operativo') return true;

                // Ministry Coordinator: STRICT FILTER
                if (myRole === 'coordinador_ministerio') {
                    const author = usersMap[s.user_id];
                    // Only show if author exists AND shares the same department
                    return author && author.department === myDept;
                }

                return true;
            });

            // Attach author info for display
            const enrichedSuggestions = filteredSuggestions.map(s => ({
                ...s,
                author: usersMap[s.user_id] || { first_name: 'Usuario', last_name: 'Desconocido' }
            }));

            setSuggestions(enrichedSuggestions);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePromoteToProposal = async (suggestion) => {
        if (!window.confirm('¿Convertir esta sugerencia en una Propuesta Oficial bajo tu responsabilidad?')) return;

        try {
            // 1. Update suggestion status to 'promovido' (or keep it and link it)
            // 2. Create new Proposal

            // For simplicity in this phase, we might just UPDATE the existing record to be a proposal
            // But the requirement said "Create a record... source_suggestion_id".
            // Let's follow the requirement: Create new, update old.

            const { error: createError } = await supabase
                .from('solicitudes')
                .insert([{
                    user_id: user.id, // Coordinator becomes owner
                    area: suggestion.area,
                    activity_type: suggestion.activity_type,
                    description: suggestion.description,
                    status: 'pendiente',
                    event_date: suggestion.event_date,
                    event_time: suggestion.event_time,
                    resources: suggestion.resources,
                    tipo: 'propuesta',
                    responsable_oficial: user.id,
                    source_suggestion_id: suggestion.id
                }]);

            if (createError) throw createError;

            // Mark suggestion as processed
            await supabase
                .from('solicitudes')
                .update({ status: 'procesado' })
                .eq('id', suggestion.id);

            alert('Sugerencia promovida a Propuesta Oficial.');
            fetchSuggestions();

        } catch (error) {
            console.error('Error promoting:', error);
            alert('Error al promover: ' + error.message);
        }
    };

    if (!isCoordinator) return null;

    return (
        <div className="card" style={{ marginTop: '2rem', border: '1px solid var(--color-primary)' }}>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                <MessageSquare size={20} /> Bandeja de Sugerencias (Directores)
            </h2>

            {loading ? (
                <p>Cargando...</p>
            ) : suggestions.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No hay sugerencias pendientes.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    {suggestions.map(sug => (
                        <div key={sug.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <strong>{sug.activity_type}</strong>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                        Por: {sug.author?.first_name} {sug.author?.last_name}
                                        {sug.author?.department && <span style={{ marginLeft: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{sug.author.department}</span>}
                                    </div>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(sug.created_at).toLocaleDateString()}</span>
                            </div>
                            <p style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>{sug.description}</p>
                            <button
                                onClick={() => handlePromoteToProposal(sug)}
                                className="btn"
                                style={{ fontSize: '0.8rem', padding: '0.5rem', backgroundColor: 'var(--color-primary)', color: 'white' }}
                            >
                                <ArrowRight size={14} style={{ marginRight: '0.25rem' }} />
                                Revisar y Proponer al Pastor
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
