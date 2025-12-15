import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // npm install jwt-decode

interface JWTPayload {
    sub: string; // username
    scope: string; // "ADMIN" hoặc "CUSTOMER" hoặc "PRODUCT_MANAGER"
    exp: number;
}

export const useAuth = () => {
    const [user, setUser] = useState<JWTPayload | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        
        if (token) {
            try {
                const decoded = jwtDecode<JWTPayload>(token);
                
                // Kiểm tra token hết hạn
                if (decoded.exp * 1000 < Date.now()) {
                    localStorage.removeItem("token");
                    setUser(null);
                } else {
                    setUser(decoded);
                }
            } catch (error) {
                console.error("Invalid token", error);
                localStorage.removeItem("token");
                setUser(null);
            }
        }
        
        setIsLoading(false);
    }, []);

    const hasRole = (role: string) => {
        return user?.scope === role;
    };

    const isAdmin = () => hasRole("ADMIN");
    
    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        window.location.href = "/login";
    };

    return { user, isLoading, hasRole, isAdmin, logout };
};