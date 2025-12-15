export interface AccountRequestDTO {
    username: string;
    password: string;
    email: string;
    phoneNumber: string;
    roles: string[];
}
export interface AccountDTO {
    id: string;
    username: string;
    password: string;
    email: string;
    phoneNumber: string;
    createdDate: string;
    roles: RoleDTO[];
    cart: CartDTO;
    addresses: any[];
}

export interface RoleRequestDTO {
    name: string;
    description: string;
}
export interface RoleDTO {
    id: string;
    name: string;
    description: string;
}

export interface CartDTO {
    id: string;
    items: any[];
}

