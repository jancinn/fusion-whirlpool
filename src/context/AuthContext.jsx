import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            // 1. Check Supabase Session
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                setUser(session.user);
            } else {
                // 2. Check Local Mock Session (Dev Mode)
                const mockSession = localStorage.getItem('inn_mock_session');
                if (mockSession) {
                    setUser(JSON.parse(mockSession));
                }
            }
            setLoading(false);
        };

        restoreSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
            }
            // Note: We don't clear mock session here to avoid conflict, handled in signOut
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email, password) => {
        // 1. BACKDOOR FOR MASTER ADMIN
        if (email === 'admin@inn.com' && password === 'admin123') {
            const mockUser = {
                id: 'mock-admin-id',
                email: 'admin@inn.com',
                user_metadata: { role: 'admin', full_name: 'Administrador Principal' },
                aud: 'authenticated'
            };
            setUser(mockUser);
            localStorage.setItem('inn_mock_session', JSON.stringify(mockUser));
            return { data: { user: mockUser }, error: null };
        }

        // 2. BACKDOOR FOR LOCAL DEV USERS
        const localUsers = JSON.parse(localStorage.getItem('inn_users_list') || '[]');
        const foundUser = localUsers.find(u => u.email === email);

        if (foundUser) {
            const mockUser = {
                id: foundUser.id || Math.random().toString(),
                email: foundUser.email,
                user_metadata: {
                    role: foundUser.role,
                    department: foundUser.department,
                    full_name: `${foundUser.firstName || ''} ${foundUser.lastName || ''}`.trim() || 'Usuario'
                },
                aud: 'authenticated'
            };
            setUser(mockUser);
            localStorage.setItem('inn_mock_session', JSON.stringify(mockUser));
            return { data: { user: mockUser }, error: null };
        }

        // 3. Fallback to Real Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return { data, error };
    };

    const signOut = async () => {
        localStorage.removeItem('inn_mock_session'); // Clear mock session
        setUser(null);
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
