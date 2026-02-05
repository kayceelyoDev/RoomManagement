// Reservation-related TypeScript types
import { Room } from './room';
import { SelectedServiceItem } from './service';

export interface ReservationFormData {
    room_id: string;
    guest_name: string;
    contact_number: string;
    total_guest: number;
    check_in_date: string;
    check_out_date: string;
    status: string;
    reservation_amount: number;
    selected_services: SelectedServiceItem[];
}

export interface Reservation {
    id: number;
    guest_name: string;
    contact_number: string;
    room_id: number;
    check_in_date: string;
    check_out_date: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    total_guest: number;
    reservation_amount: number;
    created_at: string;
    updated_at: string;
    room?: Room;
}

export interface PriceDetails {
    nights: number;
    roomTotal: number;
    servicesTotal: number;
    grandTotal: number;
}
