import { createContext, useContext, useState, useEffect } from "react";
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

    const setAuth = authUser => {
        setUser(authUser);
    };

    const setAuthWithFullData = async (authUser) => {
        
        if (authUser) {
            try {
                setUser(authUser);
                
                const res = await getUserData(authUser.id);
                
                if (res.success) {
                  
                    
                    setUser({
                        ...authUser,
                        ...res.data,
                        email: authUser.email
                    });
                } else {
                    console.warn('⚠️ Using basic user data only:', res.msg);
                }
            } catch (error) {
                console.error('❌ Error loading user data:', error);
            }
        } else {
            setUser(null);
        }
    };

    const setUserData = userData => {
        setUser(prev => ({ 
            ...prev, 
            ...userData 
        }));
    };

    const refreshUserData = async () => {
        if (!user?.id) return false;
        
        console.log('🔄 Refreshing user data...');
        try {
            const res = await getUserData(user.id);
            if (res.success) {
                console.log('✅ User data refreshed');
                setUser(prev => ({ 
                    ...prev, 
                    ...res.data 
                }));
                return true;
            }
        } catch (error) {
            console.error('❌ Error refreshing user data:', error);
        }
        return false;
    };

    useEffect(() => {
        const loadTipsCache = async () => {
            try {
            const json = await AsyncStorage.getItem('ParentTipsCache');
            
            if (json) {
                const parsed = JSON.parse(json);
                const { tips, lastFetchTime, profileHash } = parsed;
                
                
                if (Array.isArray(tips) && tips.length > 0 && lastFetchTime) {
                setParentTipsCache({ tips, lastFetchTime, profileHash });
                } else {
                console.warn('⚠️ Invalid cache data, using empty cache');
                setParentTipsCache({ tips: [], lastFetchTime: null, profileHash: '' });
                }
            } else {
                setParentTipsCache({ tips: [], lastFetchTime: null, profileHash: '' });
            }
            
            setIsTipsCacheLoaded(true);
            } catch (e) {
            setParentTipsCache({ tips: [], lastFetchTime: null, profileHash: '' });
            setIsTipsCacheLoaded(true);
            }
        };
        
        loadTipsCache();
    }, []);

    const updateParentTipsCache = async ({ tips, lastFetchTime, profileHash }) => {
       
        
        setParentTipsCache({ tips, lastFetchTime, profileHash });
        
        try {
            const dataToSave = { tips, lastFetchTime, profileHash };
            await AsyncStorage.setItem(
            'ParentTipsCache',
            JSON.stringify(dataToSave)
            );
            
            const verification = await AsyncStorage.getItem('ParentTipsCache');
            if (verification) {
            const parsed = JSON.parse(verification);
            console.log('🔍 Verification - saved tips count:', parsed.tips?.length || 0);
            }
        } catch (e) {
            console.error('❌ Failed saving tips cache to AsyncStorage:', e);
        }
    };

    const clearAuthStorage = async () => {
        try {
            console.log('Clearing auth storage...');
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
                console.log('Removed auth keys:', keysToRemove);
            }

            await supabase.auth.signOut();
            setUser(null);
            console.log('Auth storage cleared successfully');
            return true;
        } catch (error) {
            console.error('Error clearing auth storage:', error);
            return false;
        }
    };

    const validateSession = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Session validation error:', error);
                
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

    const handleAuthError = async (error) => {
        console.error('Handling auth error:', error);
        
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
            console.log('Critical auth error detected, clearing storage');
            await clearAuthStorage();
            return true; 
        }
        
        return false; 
    };

    const debugAuthState = async () => {
        try {
            console.log('=== AUTH DEBUG ===');
            
            const allKeys = await AsyncStorage.getAllKeys();
            const authKeys = allKeys.filter(key => 
                key.includes('auth') || key.includes('supabase')
            );
            
            console.log('Auth keys in storage:', authKeys);
            
            for (const key of authKeys) {
                const value = await AsyncStorage.getItem(key);
                console.log(`${key}:`, value ? 'EXISTS' : 'NULL');
            }
            
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
            setAuthWithFullData, 
            setUserData, 
            refreshUserData,
            clearAuthStorage,
            validateSession,
            refreshSession,
            handleAuthError,
            debugAuthState,
            initializeAuth,
            parentTipsCache,
            updateParentTipsCache,
            isTipsCacheLoaded
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