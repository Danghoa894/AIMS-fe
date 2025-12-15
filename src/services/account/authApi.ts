import { api } from "../../api/axiosClient";
import { AuthenticationResponse } from "../../types/checkout.types";
/* 
    API phục vụ xác thực
    - Đăng nhập (Login)
    - Kiểm tra token (Introspect)
    - Đăng xuất (Logout)
*/
export const authApi = {
    /* 
        /auth/token
    */
    // POST /auth/token → Đăng nhập
    login: (data: { username: string; password: string }) =>
        api.post<AuthenticationResponse>("/auth/token", data),
    
    
    /* 
        /auth/introspect
    */
    // POST /auth/introspect → Kiểm tra token hợp lệ
    introspect: (token: string) =>
        api.post("/auth/introspect", { token }),

    // POST /auth/refresh → Làm mới token
    refreshToken: (token: string) =>
        api.post("/auth/refresh", { token }),
    
    /* 
        /auth/logout
    */
    // POST /auth/logout → Đăng xuất
    logout: (token: string) =>
        api.post("/auth/logout", { token }),
};
