import { api } from "../../api/axiosClient";
import { RoleRequestDTO, RoleDTO } from "../../types/account.types";
/* 
    API phục vụ quản lý vai trò (Role)
    - Tạo, xem, xóa vai trò
*/
export const roleApi = {
    // GET /role → Lấy tất cả role
    getAllRoles: () => 
        api.get<RoleDTO[]>("/role"),

    // POST /role → Tạo role mới
    createRole: (data: RoleRequestDTO) =>
        api.post<RoleDTO>("/role", data),

    // GET /role/{roleId} → Lấy vai trò theo ID
    getRoleById: (roleId: string) => 
        api.get<RoleDTO>(`/role/${roleId}`),
    
    // DELETE /role/{roleId} → Xóa role
    deleteRole: (roleId: string) => api.delete(`/role/${roleId}`),
};
