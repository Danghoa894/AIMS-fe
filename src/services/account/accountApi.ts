import { api } from "../../api/axiosClient";
import { AccountRequestDTO, RoleDTO, CartDTO, AccountDTO } from "../../types/account.types";

/* 
    API phục vụ quản lý tài khoản
    - Tạo, xem, sửa, xóa tài khoản
    - Lấy thông tin tài khoản hiện tại
*/
export const accountApi = {
    // GET /account → Lấy toàn bộ tài khoản (ADMIN)
    getAllAccounts: () => 
        api.get<AccountDTO[]>("/account"),

    // POST /account → Tạo tài khoản mới (ADMIN)
    createAccount: (data: AccountRequestDTO) => 
        api.post<AccountDTO>("/account", data),

    // GET /account/myInfo → Lấy thông tin tài khoản đang đăng nhập
    getMyInfo: () => 
        api.get<AccountDTO>("/account/myInfo"),

    // GET /account/{accountId} → Lấy theo ID
    getById: (accountId: string) =>
        api.get<AccountDTO>(`/account/${accountId}`),

    // PUT /account/{accountId} → Cập nhật tài khoản
    updateAccount: (accountId: string,data: Partial<AccountRequestDTO>) => 
        api.put<AccountDTO>(`/account/${accountId}`, data),

    // DELETE /account/{accountId} → Xóa tài khoản
    deleteAccount: (accountId: string) =>
        api.delete(`/account/${accountId}`),
};
