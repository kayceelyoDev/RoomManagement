// Category-related TypeScript types

export interface Category {
    id: number;
    room_category: string;
    price: number | string;
    room_capacity: number | string;
}

export interface CategoryFormData {
    room_category: string;
    price: string | number;
    room_capacity: string | number;
}
