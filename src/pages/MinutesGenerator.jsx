import { useState } from 'react';
import { FileText, Users, Plus, Trash2, Download, Printer, Save } from 'lucide-react';

export default function MinutesGenerator() {
    const [step, setStep] = useState('edit'); // 'edit' or 'preview'
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '19:00',
        endTime: '21:00',
        meetingType: 'Junta de Coordinación',
        attendees: '',
        agendaItems: [''],
        agreements: ['']
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleArrayChange = (index, value, field) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData({ ...formData, [field]: newArray });
    };

    const addItem = (field) => {
        setFormData({ ...formData, [field]: [...formData[field], ''] });
    };

    const removeItem = (index, field) => {
        const newArray = [...formData[field]];
        newArray.splice(index, 1);
        setFormData({ ...formData, [field]: newArray });
    };

    const generateMinute = () => {
        setStep('preview');
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Generador de Actas</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Herramienta para estructurar y formalizar las minutas de las reuniones.
                </p>
            </div>

            {step === 'edit' ? (
                <div className="card">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tipo de Reunión</label>
                            <select
                                name="meetingType"
                                value={formData.meetingType}
                                onChange={handleInputChange}
                            >
                                <option>Junta de Coordinación</option>
                                <option>Junta Administrativa</option>
                                <option>Reunión Ministerial</option>
                                <option>Asamblea General</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Fecha</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Hora Inicio</label>
                            <input
                                type="time"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Hora Fin</label>
                            <input
                                type="time"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Asistentes (Nombres separados por coma)</label>
                        <textarea
                            name="attendees"
                            value={formData.attendees}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Ej: Pastor Jorge, Hna. María, Hno. Pedro..."
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Orden del Día (Puntos Tratados)</label>
                        {formData.agendaItems.map((item, index) => (
                            <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <span style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{index + 1}.</span>
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleArrayChange(index, e.target.value, 'agendaItems')}
                                    placeholder={`Punto ${index + 1}`}
                                />
                                <button
                                    onClick={() => removeItem(index, 'agendaItems')}
                                    className="btn-icon"
                                    style={{ color: '#ef4444' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => addItem('agendaItems')}
                            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
                        >
                            <Plus size={18} /> Agregar Punto
                        </button>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--color-accent)' }}>Acuerdos y Decisiones</label>
                        {formData.agreements.map((item, index) => (
                            <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <span style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>•</span>
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleArrayChange(index, e.target.value, 'agreements')}
                                    placeholder={`Acuerdo ${index + 1}`}
                                    style={{ borderColor: 'var(--color-accent)' }}
                                />
                                <button
                                    onClick={() => removeItem(index, 'agreements')}
                                    className="btn-icon"
                                    style={{ color: '#ef4444' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => addItem('agreements')}
                            style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
                        >
                            <Plus size={18} /> Agregar Acuerdo
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" onClick={generateMinute}>
                            <FileText size={20} style={{ marginRight: '0.5rem' }} /> Generar Vista Previa
                        </button>
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in">
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <button
                            onClick={() => setStep('edit')}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            ← Volver a Editar
                        </button>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
                            <button className="btn" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}>
                                <Printer size={18} style={{ marginRight: '0.5rem' }} /> Imprimir
                            </button>
                            <button className="btn btn-primary">
                                <Save size={18} style={{ marginRight: '0.5rem' }} /> Guardar en Archivo
                            </button>
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
                            <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.2rem', fontWeight: 'normal', color: '#333' }}>Acta de {formData.meetingType}</h3>
                            <div style={{ marginTop: '1rem', borderBottom: '2px solid black', width: '100px', margin: '1rem auto' }}></div>
                        </div>

                        <div style={{ marginBottom: '2rem', lineHeight: '1.8' }}>
                            <p>
                                En la ciudad de [Ciudad], siendo las <strong>{formData.startTime}</strong> horas del día <strong>{new Date(formData.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>,
                                se reunieron en las instalaciones de la Iglesia los siguientes miembros:
                            </p>
                            <p style={{ fontStyle: 'italic', margin: '1rem 0 2rem 0', padding: '0 2rem' }}>
                                {formData.attendees || '[Lista de Asistentes]'}
                            </p>
                            <p>
                                Con el fin de celebrar la <strong>{formData.meetingType}</strong> bajo el siguiente orden del día:
                            </p>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h4 style={{ textTransform: 'uppercase', fontSize: '1rem', marginBottom: '1rem', color: 'black' }}>Orden del Día:</h4>
                            <ol style={{ paddingLeft: '2rem', lineHeight: '1.6' }}>
                                {formData.agendaItems.map((item, i) => (
                                    <li key={i}>{item || '[Punto por definir]'}</li>
                                ))}
                            </ol>
                        </div>

                        <div style={{ marginBottom: '3rem' }}>
                            <h4 style={{ textTransform: 'uppercase', fontSize: '1rem', marginBottom: '1rem', color: 'black' }}>Acuerdos y Resoluciones:</h4>
                            <p>Una vez discutidos los puntos anteriores, se llegaron a los siguientes acuerdos:</p>
                            <ul style={{ paddingLeft: '2rem', lineHeight: '1.6', listStyleType: 'circle' }}>
                                {formData.agreements.map((item, i) => (
                                    <li key={i}>{item || '[Acuerdo por definir]'}</li>
                                ))}
                            </ul>
                        </div>

                        <div style={{ marginTop: '4rem' }}>
                            <p>
                                No habiendo otro asunto que tratar, se da por terminada la reunión a las <strong>{formData.endTime}</strong> horas del mismo día,
                                firmando al calce los presentes para dar constancia.
                            </p>

                            <div style={{ marginTop: '5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', textAlign: 'center' }}>
                                <div>
                                    <div style={{ borderTop: '1px solid black', margin: '0 2rem' }}></div>
                                    <p style={{ marginTop: '0.5rem' }}>Coordinador General</p>
                                </div>
                                <div>
                                    <div style={{ borderTop: '1px solid black', margin: '0 2rem' }}></div>
                                    <p style={{ marginTop: '0.5rem' }}>Secretario(a)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
