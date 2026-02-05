// Room-related TypeScript types

export interface RoomCategory {
    id: number;
    room_category: string;
    price: number;
    room_capacity: number;
}

export interface Room {
    id: number;
    room_name: string;
    room_description: string;
    max_extra_person: number;
    room_amenities: string;
    type_of_bed: string;
    status: 'available' | 'booked' | 'occupied' | 'unavailable';
    img_url: string;
    img_full_path: string;
    room_price: number;
    room_category?: RoomCategory;
    room_categories_id?: number;
    reservations?: Reservation[];
}

export interface Reservation {
    id: number;
    check_in_date: string;
    check_out_date: string;
    status: string;
}

export interface RoomFormData {
    room_categories_id: string;
    room_name: string;
    room_description: string;
    max_extra_person: string | number;
    room_amenities: string;
    type_of_bed: string;
    status: string;
    img_url: File | null;
}
