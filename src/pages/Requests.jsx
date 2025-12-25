import { useState } from 'react';
import { Save, Calendar as CalendarIcon, Clock, Users, FileText, CheckSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Requests() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        area: '',
        activityType: '',
        date: '',
        time: '',
        attendees: '',
        description: '',
        resources: {
            produccion: false,
            comunicacion: false,
            logistica: false,
            tecnologia: false
        }
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            resources: { ...prev.resources, [name]: checked }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!user) {
                throw new Error('Usuario no autenticado.');
            }

            const { error } = await supabase
                .from('solicitudes')
                .insert([
                    {
                        user_id: user.id,
                        area: formData.area,
                        activity_type: formData.activityType,
                        event_date: formData.date,
                        event_time: formData.time,
                        attendees: parseInt(formData.attendees) || 0,
                        description: formData.description,
                        resources: formData.resources,
                        status: 'pendiente'
                    }
                ]);

            if (error) throw error;

            alert('¡Solicitud enviada con éxito!');
            navigate('/'); // Regresar al inicio
        } catch (error) {
            console.error('Error al enviar solicitud:', error);
            // Show specific error from Supabase
            alert(`Error al guardar: ${error.message || error.error_description || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Nueva Solicitud</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Complete el formulario para solicitar recursos o espacios para su actividad.</p>
            </div>

            <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Sección 1: Detalles Generales */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>

                    <div>
                        <label>Área Solicitante</label>
                        <select
                            name="area"
                            value={formData.area}
                            onChange={handleInputChange}
                            required
                            style={{ width: '100%' }}
                        >
                            <option value="">Seleccione un área...</option>
                            <optgroup label="Ministerial">
                                <option value="control">Control</option>
                                <option value="desarrollo">Desarrollo</option>
                                <option value="educacion">Educación Cristiana</option>
                                <option value="interaccion">Interacción</option>
                                <option value="alcance">Alcance</option>
                            </optgroup>
                        </select>
                    </div>

                    <div>
                        <label>Tipo de Actividad</label>
                        <input
                            type="text"
                            name="activityType"
                            placeholder="Ej. Culto de Jóvenes, Ensayo..."
                            value={formData.activityType}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                </div>

                {/* Sección 2: Fecha y Hora */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CalendarIcon size={16} /> Fecha
                        </label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={16} /> Hora Inicio
                        </label>
                        <input
                            type="time"
                            name="time"
                            value={formData.time}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={16} /> Asistencia Est.
                        </label>
                        <input
                            type="number"
                            name="attendees"
                            placeholder="0"
                            value={formData.attendees}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                {/* Sección 3: Recursos Necesarios */}
                <div style={{ backgroundColor: 'var(--bg-body)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    <label style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckSquare size={18} /> Recursos Necesarios (Servicios Operacionales)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" name="produccion" checked={formData.resources.produccion} onChange={handleCheckboxChange} />
                            <span style={{ color: 'var(--color-ops-produccion)', fontWeight: '500' }}>Producción</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" name="comunicacion" checked={formData.resources.comunicacion} onChange={handleCheckboxChange} />
                            <span style={{ color: 'var(--color-ops-comunicacion)', fontWeight: '500' }}>Comunicación</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" name="logistica" checked={formData.resources.logistica} onChange={handleCheckboxChange} />
                            <span style={{ color: 'var(--color-ops-logistica)', fontWeight: '500' }}>Logística</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" name="tecnologia" checked={formData.resources.tecnologia} onChange={handleCheckboxChange} />
                            <span style={{ color: 'var(--color-ops-tecnologia)', fontWeight: '500' }}>Tecnología</span>
                        </label>
                    </div>
                </div>

                {/* Sección 4: Descripción */}
                <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} /> Detalles Adicionales
                    </label>
                    <textarea
                        name="description"
                        rows="4"
                        placeholder="Describe brevemente qué necesitas específicamente (ej. 50 sillas, 2 micrófonos, proyector...)"
                        value={formData.description}
                        onChange={handleInputChange}
                        style={{ resize: 'vertical' }}
                    ></textarea>
                </div>

                {/* Botón de Acción */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ minWidth: '200px' }}
                        disabled={loading}
                    >
                        <Save size={20} />
                        {loading ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                </div>

            </form>
        </div>
    );
}
