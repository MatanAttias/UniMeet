import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { getUserData } from '../services/userService'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [parentTipsCache, setParentTipsCache] = useState({
      tips: [],
      lastFetchTime: null,
      profileHash: ''
    });
    const [isTipsCacheLoaded, setIsTipsCacheLoaded] = useState(false);

    // שימוש ב-useCallback למניעת re-renders
    const setAuth = useCallback((authUser) => {
        setUser(authUser);
    }, []);

    const setAuthWithFullData = useCallback(async (authUser) => {
        if (authUser) {
            try {
                // שמור נתונים בסיסיים מיד
                setUser(authUser);
                
                // טען נתונים מלאים
                const res = await getUserData(authUser.id);
                
                if (res.success) {
                    setUser({
                        ...authUser,
                        ...res.data,
                        email: authUser.email
                    });
                    return true; 
                } else {
                    return false;
                }
            } catch (error) {
                return false;
            }
        } else {
            setUser(null);
            return true;
        }
    }, []);

    const setUserData = useCallback((userData) => {
        setUser(prev => ({ 
            ...prev, 
            ...userData 
        }));
    }, []);

    const refreshUserData = useCallback(async () => {
        if (!user?.id) return false;
        
        try {
            const res = await getUserData(user.id);
            if (res.success) {
                setUser(prev => ({ 
                    ...prev, 
                    ...res.data 
                }));
                return true;
            }
        } catch (error) {
            // Silent error
        }
        return false;
    }, [user?.id]);

    const clearAuthStorage = useCallback(async () => {
        try {
            const authKeys = [
                'supabase.auth.token',
                'sb-dlkxwivlcbnlukylcceq-auth-token',
                '@supabase/auth-token',
                'auth-token',
                'user-session'
            ];

            const allKeys = await AsyncStorage.getAllKeys();
            const keysToRemove = allKeys.filter(key => 
                authKeys.some(authKey => key.includes(authKey)) ||
                key.includes('supabase') ||
                key.includes('auth')
            );

            if (keysToRemove.length > 0) {
                await AsyncStorage.multiRemove(keysToRemove);
            }

            // התנתק מSupabase רק אם יש session
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    await supabase.auth.signOut();
                }
            } catch (signOutError) {
                // Silent error
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            // נקה state מיד
            setUser(null);
            
            // נקה storage
            await clearAuthStorage();
            
            return true;
        } catch (error) {
            return false;
        }
    }, [clearAuthStorage]);

    // פונקציות בדיקת הרשאות - memoized
    const isAdmin = useCallback(() => {
        return user?.role === 'admin' || user?.email === 'Admin@gmail.com';
    }, [user?.role, user?.email]);

    const isParent = useCallback(() => {
        return user?.role === 'parent';
    }, [user?.role]);

    const isUser = useCallback(() => {
        return user?.role === 'user' || (!user?.role && user?.id);
    }, [user?.role, user?.id]);

    const validateSession = useCallback(async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
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
            return false;
        }
    }, [clearAuthStorage]);

    const refreshSession = useCallback(async () => {
        try {
            const { data, error } = await supabase.auth.refreshSession();
            
            if (error) {
                await clearAuthStorage();
                return false;
            }
            
            if (data?.session?.user) {
                setAuth(data.session.user);
                return true;
            }
            
            return false;
        } catch (error) {
            await clearAuthStorage();
            return false;
        }
    }, [clearAuthStorage, setAuth]);

    const handleAuthError = useCallback(async (error) => {
        const errorMessage = error?.message || '';
        
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
            await clearAuthStorage();
            return true; 
        }
        
        return false; 
    }, [clearAuthStorage]);

    const updateParentTipsCache = useCallback(async ({ tips, lastFetchTime, profileHash }) => {
        setParentTipsCache({ tips, lastFetchTime, profileHash });
        
        try {
            const dataToSave = { tips, lastFetchTime, profileHash };
            await AsyncStorage.setItem(
                'ParentTipsCache',
                JSON.stringify(dataToSave)
            );
        } catch (e) {
            console.error('❌ Failed saving tips cache to AsyncStorage:', e);
        }
    }, []);

    const debugAuthState = useCallback(async () => {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const authKeys = allKeys.filter(key => 
                key.includes('auth') || key.includes('supabase')
            );
            
            const { data: { session }, error } = await supabase.auth.getSession();
            
            return {
                storageKeys: authKeys,
                hasSession: !!session,
                hasUser: !!user,
                error: error?.message
            };
        } catch (error) {
            return { error: error.message };
        }
    }, [user]);

    const initializeAuth = useCallback(async () => {
        if (isInitialized) return;
        
        try {
            setIsLoading(true);
            
            const isValid = await validateSession();
            if (!isValid) {
                setUser(null);
            }
            
            setIsInitialized(true);
        } catch (error) {
            await handleAuthError(error);
        } finally {
            setIsLoading(false);
        }
    }, [isInitialized, validateSession, handleAuthError]);

    // טען tips cache רק פעם אחת
    useEffect(() => {
        let mounted = true;
        
        const loadTipsCache = async () => {
            try {
                const json = await AsyncStorage.getItem('ParentTipsCache');
                
                if (mounted) {
                    if (json) {
                        const parsed = JSON.parse(json);
                        const { tips, lastFetchTime, profileHash } = parsed;
                        
                        if (Array.isArray(tips) && tips.length > 0 && lastFetchTime) {
                            setParentTipsCache({ tips, lastFetchTime, profileHash });
                        } else {
                            setParentTipsCache({ tips: [], lastFetchTime: null, profileHash: '' });
                        }
                    } else {
                        setParentTipsCache({ tips: [], lastFetchTime: null, profileHash: '' });
                    }
                    
                    setIsTipsCacheLoaded(true);
                }
            } catch (e) {
                if (mounted) {
                    setParentTipsCache({ tips: [], lastFetchTime: null, profileHash: '' });
                    setIsTipsCacheLoaded(true);
                }
            }
        };
        
        loadTipsCache();
        
        return () => {
            mounted = false;
        };
    }, []);

    // memoize את הvalue כדי למנוע re-renders מיותרים
    const contextValue = useMemo(() => ({  
        user, 
        isLoading,
        isInitialized,
        setAuth, 
        setAuthWithFullData, 
        setUserData, 
        refreshUserData,
        logout, 
        clearAuthStorage,
        validateSession,
        refreshSession,
        handleAuthError,
        debugAuthState,
        initializeAuth,
        parentTipsCache,
        updateParentTipsCache,
        isTipsCacheLoaded,
        isAdmin,
        isParent,
        isUser
    }), [
        user, 
        isLoading,
        isInitialized,
        setAuth, 
        setAuthWithFullData, 
        setUserData, 
        refreshUserData,
        logout, 
        clearAuthStorage,
        validateSession,
        refreshSession,
        handleAuthError,
        debugAuthState,
        initializeAuth,
        parentTipsCache,
        updateParentTipsCache,
        isTipsCacheLoaded,
        isAdmin,
        isParent,
        isUser
    ]);

    return (
        <AuthContext.Provider value={contextValue}>
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