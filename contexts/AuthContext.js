import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const setAuth = authUser => {
        setUser(authUser);
    };

    const setUserData = userData => {
        
        setUser(prev => ({ ...prev, ...userData })); // מעדכן רק את הנתונים החדשים
    };

    return (
        <AuthContext.Provider value={{ user, setAuth, setUserData }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
