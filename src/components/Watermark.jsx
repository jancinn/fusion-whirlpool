import { useAuth } from '../context/AuthContext';

export default function Watermark() {
    const { user } = useAuth();

    if (!user) return null;

    const text = `CONFIDENCIAL - ${user.email} - INN`;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none', // Allows clicking through it
                zIndex: 9999,
                overflow: 'hidden',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: 0.04, // Very subtle
                transform: 'rotate(-45deg) scale(1.5)',
            }}
        >
            {Array.from({ length: 20 }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: 'var(--text-main)',
                        margin: '4rem',
                        whiteSpace: 'nowrap',
                        userSelect: 'none'
                    }}
                >
                    {text}
                </div>
            ))}
        </div>
    );
}
