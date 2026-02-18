import { useState, useEffect } from 'react';
import { FileText, Users, Plus, Trash2, Download, Printer, Save, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function MinutesGenerator() {
    const { user } = useAuth();
    const [actas, setActas] = useState([]);
    const [selectedActa, setSelectedActa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'

    const userRole = user?.user_metadata?.role || '';
    const isCoordGeneral = userRole === 'coordinador_operativo' || userRole === 'administrador_general';

    useEffect(() => {
        fetchActas();
    }, []);

    const fetchActas = async () => {
        try {
            const { data, error } = await supabase
                .from('actas')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setActas(data || []);
        } catch (error) {
            console.error("Error fetching actas:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOfficialize = async (actaId) => {
        if (!isCoordGeneral) return alert("Solo el Coordinador General puede oficializar actas.");
        if (!window.confirm("¿Confirmas que deseas OFICIALIZAR esta acta? Una vez oficial, no podrá ser editada.")) return;

        try {
            const { error } = await supabase
                .from('actas')
                .update({
                    estado: 'oficial',
                    es_oficial: true
                })
                .eq('id', actaId);

            if (error) throw error;

            alert("¡Acta oficializada correctamente!");
            fetchActas(); // Refresh list
            setViewMode('list');
        } catch (error) {
            console.error("Error oficializando:", error);
            alert("Error al oficializar.");
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando Historial...</div>;

    if (viewMode === 'list') {
        return (
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Historial de Actas</h1>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {actas.length === 0 ? (
                        <p>No hay actas registradas.</p>
                    ) : (
                        actas.map(acta => (
                            <div key={acta.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>{acta.tipo_reunion}</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                        {new Date(acta.fecha_reunion).toLocaleDateString()} — Estado: <strong>{acta.estado.toUpperCase()}</strong>
                                    </p>
                                </div>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => { setSelectedActa(acta); setViewMode('detail'); }}
                                >
                                    Ver Documento
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // DETAIL VIEW (Preview/Print)
    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <button onClick={() => setViewMode('list')} style={{ marginBottom: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                ← Volver al Historial
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1>Vista de Acta</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" onClick={() => window.print()}>
                        <Printer size={18} style={{ marginRight: '0.5rem' }} /> Imprimir
                    </button>

                    {isCoordGeneral && selectedActa.estado !== 'oficial' && (
                        <button
                            className="btn"
                            style={{ backgroundColor: '#059669', color: 'white' }}
                            onClick={() => handleOfficialize(selectedActa.id)}
                        >
                            <ShieldCheck size={18} style={{ marginRight: '0.5rem' }} />
                            Oficializar Acta
                        </button>
                    )}
                </div>
            </div>

            {/* Paper Preview */}
            <div style={{
                backgroundColor: 'white',
                color: 'black',
                padding: '4rem',
                borderRadius: '4px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                minHeight: '800px',
                fontFamily: 'Times New Roman, serif'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2 style={{ margin: 0, textTransform: 'uppercase', fontSize: '1.5rem', color: 'black' }}>Iglesia Nuevo Nacimiento</h2>
                    <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.2rem', fontWeight: 'normal', color: '#333' }}>Acta de {selectedActa.tipo_reunion}</h3>
                    {selectedActa.es_oficial && <div style={{ border: '2px solid black', padding: '0.5rem', display: 'inline-block', marginTop: '1rem', fontWeight: 'bold' }}>DOCUMENTO OFICIAL</div>}
                </div>

                <div style={{ marginBottom: '2rem', lineHeight: '1.8' }}>
                    <p>
                        En la ciudad de [Ciudad], el día <strong>{new Date(selectedActa.fecha_reunion).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>,
                        se reunieron los miembros del consejo.
                    </p>

                    <h4 style={{ textTransform: 'uppercase', fontSize: '1rem', marginTop: '2rem', color: 'black' }}>Acuerdos y Resoluciones (Snapshot):</h4>
                    <ul style={{ paddingLeft: '2rem', lineHeight: '1.6', listStyleType: 'circle' }}>
                        {selectedActa.snapshot_solicitudes && selectedActa.snapshot_solicitudes.map((item, i) => (
                            <li key={i}>
                                <strong>{item.activity} ({item.area})</strong>: {item.description}
                            </li>
                        ))}
                    </ul>
                </div>

                <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                    <p>_____________________________</p>
                    <p>Firma Coordinador General</p>
                </div>
            </div>
        </div>
    );
}
