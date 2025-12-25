import { useState } from 'react';
import { Folder, FileText, Download, Upload, Search, MoreVertical, Shield, Briefcase, PenTool } from 'lucide-react';

export default function Documents() {
    const [activeFolder, setActiveFolder] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Mock Data for Documents
    const documents = [
        { id: 1, name: 'Manual de Procedimientos 2025.pdf', type: 'pdf', folder: 'legal', size: '2.4 MB', date: '2025-12-01' },
        { id: 2, name: 'Plantilla de Presupuesto.xlsx', type: 'excel', folder: 'operativo', size: '1.1 MB', date: '2025-11-28' },
        { id: 3, name: 'Guía de Discipulado - Nivel 1.pdf', type: 'pdf', folder: 'ministerial', size: '4.5 MB', date: '2025-11-15' },
        { id: 4, name: 'Inventario de Audio e Iluminación.xlsx', type: 'excel', folder: 'operativo', size: '850 KB', date: '2025-12-05' },
        { id: 5, name: 'Acta Constitutiva.pdf', type: 'pdf', folder: 'legal', size: '5.2 MB', date: '2024-01-20' },
        { id: 6, name: 'Logo Oficial - Alta Resolución.png', type: 'image', folder: 'ministerial', size: '3.1 MB', date: '2025-10-10' },
    ];

    const folders = [
        { id: 'all', label: 'Todos los Archivos', icon: <Folder size={20} /> },
        { id: 'ministerial', label: 'Ministerial (Átomo)', icon: <Briefcase size={20} color="var(--color-ministerial)" /> },
        { id: 'operativo', label: 'Operativo (Nave)', icon: <PenTool size={20} color="var(--color-operacional)" /> },
        { id: 'legal', label: 'Legal y Admin', icon: <Shield size={20} color="var(--color-primary)" /> },
    ];

    const filteredDocs = documents.filter(doc => {
        const matchesFolder = activeFolder === 'all' || doc.folder === activeFolder;
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFolder && matchesSearch;
    });

    const getFileIcon = (type) => {
        // Simple icon logic
        return <FileText size={24} color="var(--text-secondary)" />;
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Archivo Digital</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Repositorio central de documentos oficiales y recursos.</p>
                </div>
                <button className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem' }}>
                    <Upload size={20} /> Subir Documento
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>

                {/* Sidebar Navigation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {folders.map(folder => (
                        <button
                            key={folder.id}
                            onClick={() => setActiveFolder(folder.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                backgroundColor: activeFolder === folder.id ? 'var(--bg-surface)' : 'transparent',
                                color: activeFolder === folder.id ? 'var(--text-main)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s',
                                fontWeight: activeFolder === folder.id ? '600' : '400'
                            }}
                        >
                            {folder.icon}
                            {folder.label}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="card" style={{ minHeight: '500px' }}>

                    {/* Search Bar */}
                    <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Buscar documentos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '2.5rem', backgroundColor: 'var(--bg-body)' }}
                        />
                    </div>

                    {/* File List */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Header Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>
                            <div>NOMBRE</div>
                            <div>CARPETA</div>
                            <div>FECHA</div>
                            <div style={{ textAlign: 'right' }}>ACCIONES</div>
                        </div>

                        {/* Rows */}
                        {filteredDocs.map(doc => (
                            <div key={doc.id} style={{
                                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px',
                                padding: '1rem',
                                borderBottom: '1px solid var(--border-light)',
                                alignItems: 'center',
                                transition: 'background-color 0.2s'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-body)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {getFileIcon(doc.type)}
                                    <span style={{ fontWeight: '500' }}>{doc.name}</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                    {doc.folder}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    {doc.date}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <button className="btn-icon" style={{ display: 'inline-flex' }} title="Descargar">
                                        <Download size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredDocs.length === 0 && (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No se encontraron documentos.
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}
