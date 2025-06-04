import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    const setAuth = authUser => {
        console.log('Setting auth user:', authUser?.id || 'null');
        setUser(authUser);
    };

    const setUserData = userData => {
        console.log('Updating user data:', userData);
        setUser(prev => ({ 
            ...prev, 
            ...userData 
        }));
    };

    // פונקציה לניקוי מלא של Auth storage
    const clearAuthStorage = async () => {
        try {
            console.log('Clearing auth storage...');
            
            // רשימת מפתחות שקשורים ל-authentication
            const authKeys = [
                'supabase.auth.token',
                'sb-dlkxwivlcbnlukylcceq-auth-token', // מפתח ספציפי לפרויקט שלך
                '@supabase/auth-token',
                'auth-token',
                'user-session'
            ];

            // נקה את כל המפתחות הרלוונטיים
            const allKeys = await AsyncStorage.getAllKeys();
            const keysToRemove = allKeys.filter(key => 
                authKeys.some(authKey => key.includes(authKey)) ||
                key.includes('supabase') ||
                key.includes('auth')
            );

            if (keysToRemove.length > 0) {
                await AsyncStorage.multiRemove(keysToRemove);
                console.log('Removed auth keys:', keysToRemove);
            }

            // התנתק מ-Supabase
            await supabase.auth.signOut();
            
            // אפס את המשתמש
            setUser(null);
            
            console.log('Auth storage cleared successfully');
            return true;
        } catch (error) {
            console.error('Error clearing auth storage:', error);
            return false;
        }
    };

    // פונקציה לבדיקת תקינות session
    const validateSession = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Session validation error:', error);
                
                // אם זו שגיאת refresh token, נקה הכל
                if (error.message?.includes('Refresh Token') || 
                    error.message?.includes('Invalid') ||
                    error.message?.includes('expired')) {
                    await clearAuthStorage();
                    return false;
                }
                return false;
            }
            
            return !!session?.user;
        } catch (error) {
            console.error('Session validation failed:', error);
            return false;
        }
    };

    // פונקציה לרענון session
    const refreshSession = async () => {
        try {
            console.log('Attempting to refresh session...');
            const { data, error } = await supabase.auth.refreshSession();
            
            if (error) {
                console.error('Session refresh failed:', error);
                await clearAuthStorage();
                return false;
            }
            
            if (data?.session?.user) {
                setAuth(data.session.user);
                console.log('Session refreshed successfully');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Session refresh error:', error);
            await clearAuthStorage();
            return false;
        }
    };

    // פונקציה לטיפול בשגיאות auth
    const handleAuthError = async (error) => {
        console.error('Handling auth error:', error);
        
        const errorMessage = error?.message || '';
        
        // שגיאות שדורשות ניקוי מלא
        const criticalErrors = [
            'Refresh Token Not Found',
            'Invalid Refresh Token',
            'refresh_token_not_found',
            'invalid_grant',
            'invalid_token'
        ];
        
        const isCriticalError = criticalErrors.some(criticalError => 
            errorMessage.includes(criticalError)
        );
        
        if (isCriticalError) {
            console.log('Critical auth error detected, clearing storage');
            await clearAuthStorage();
            return true; // מציין שהשגיאה טופלה
        }
        
        return false; // השגיאה לא טופלה
    };

    // פונקציה לניפוי מצב Auth (למפתחים)
    const debugAuthState = async () => {
        try {
            console.log('=== AUTH DEBUG ===');
            
            // בדיקת AsyncStorage
            const allKeys = await AsyncStorage.getAllKeys();
            const authKeys = allKeys.filter(key => 
                key.includes('auth') || key.includes('supabase')
            );
            
            console.log('Auth keys in storage:', authKeys);
            
            for (const key of authKeys) {
                const value = await AsyncStorage.getItem(key);
                console.log(`${key}:`, value ? 'EXISTS' : 'NULL');
            }
            
            // בדיקת Supabase session
            const { data: { session }, error } = await supabase.auth.getSession();
            console.log('Current session exists:', !!session);
            console.log('Session error:', error?.message || 'None');
            console.log('User in context:', !!user);
            console.log('User ID:', user?.id || 'None');
            
            console.log('=== END DEBUG ===');
            
            return {
                storageKeys: authKeys,
                hasSession: !!session,
                hasUser: !!user,
                error: error?.message
            };
        } catch (error) {
            console.error('Debug failed:', error);
            return { error: error.message };
        }
    };

    // פונקציה לאתחול מלא
    const initializeAuth = async () => {
        if (isInitialized) return;
        
        try {
            setIsLoading(true);
            console.log('Initializing auth...');
            
            const isValid = await validateSession();
            if (!isValid) {
                console.log('No valid session found during init');
                setUser(null);
            }
            
            setIsInitialized(true);
        } catch (error) {
            console.error('Auth initialization error:', error);
            await handleAuthError(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            isLoading,
            isInitialized,
            setAuth, 
            setUserData, 
            clearAuthStorage,
            validateSession,
            refreshSession,
            handleAuthError,
            debugAuthState,
            initializeAuth
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};