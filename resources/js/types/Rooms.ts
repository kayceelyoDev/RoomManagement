export interface Room {
    room_price: any;
    id: number;
    room_categories_id: number;
    room_name: string;
    room_description: string;
  
    category_name: string;
    max_extra_person: number;
    room_amenities: string;
    type_of_bed: string;
    status: string;
    img_url: string | null;
    img_full_path: string;
    roomCategory?: RoomCategory | null;
}
export interface RoomCategory {
  id: number;
  price: number;
  // add other fields if you need
}