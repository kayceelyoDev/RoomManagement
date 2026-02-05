// Service-related TypeScript types

export interface Service {
    id: number;
    services_name: string;
    services_price: number;
}

export interface SelectedServiceItem {
    id: number;
    quantity: number;
    price: number;
}

export interface ServiceFormData {
    services_name: string;
    services_price: string | number;
}
