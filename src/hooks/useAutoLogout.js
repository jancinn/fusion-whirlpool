import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function useAutoLogout(timeoutMs = 300000) { // Default 5 minutes
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        let timeoutId;

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                console.log('Auto-logout due to inactivity');
                signOut();
                navigate('/login');
            }, timeoutMs);
        };

        // Events to detect activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        // Setup listeners
        events.forEach(event => {
            document.addEventListener(event, resetTimer);
        });

        // Initial timer
        resetTimer();

        // Cleanup
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => {
                document.removeEventListener(event, resetTimer);
            });
        };
    }, [user, signOut, navigate, timeoutMs]);
}
