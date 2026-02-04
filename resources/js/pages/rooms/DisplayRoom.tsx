import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import roomCategoryRoute from '@/routes/roomcategory'; // Ensure you have this route defined
import roomsRoute from '@/routes/rooms';
import { Room } from '@/types/Rooms';
import { Head, Link, router } from '@inertiajs/react';
import { BedDouble, Edit, Layers, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import UpdateRoomForm from './modals/UpdateRoomForm';
import roomcategory from '@/routes/roomcategory';

// 1. Define Interfaces
interface Category {
    id: number;
    room_category: string;
    price: number;
}

interface Props {
    rooms: Room[];
    categories: Category[];
}

export default function DisplayRoom({ rooms, categories }: Props) {
    // 2. State for managing the Modal
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // 3. Handlers
    const openEditModal = (room: Room) => {
        setSelectedRoom(room);
        setIsEditOpen(true);
    };

    const closeEditModal = () => {
        setSelectedRoom(null);
        setIsEditOpen(false);
    };

    const deleteRoom = (room: Room) => {
        if (confirm('Are you sure you want to delete this room?')) {
            router.delete(roomsRoute.destroy.url(room));
        }
    };

    // Helper for status badge colors
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
            case 'booked': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
            case 'occupied': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            default: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Rooms', href: roomsRoute.index.url() }]}>
            <Head title="Manage Rooms" />

            <div className="py-12 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                Room Management
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Manage your room listings, prices, and availability.
                            </p>
                        </div>
                        
                        <div className="flex gap-3">
                            {/* Add Category Button */}
                            <Link href={roomcategory.index.url()}> 
                                <Button variant="outline" className="flex items-center gap-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <Layers className="size-4" />
                                    Add Category
                                </Button>
                            </Link>

                            {/* Add Room Button */}
                            <Link href={roomsRoute.create.url()}>
                                <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all hover:shadow-lg">
                                    <Plus className="size-4" />
                                    Add Room
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Rooms Grid */}
                    {rooms.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {rooms.map((room) => (
                                <div 
                                    key={room.id} 
                                    className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900"
                                >
                                    {/* Image Section */}
                                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                                        <img 
                                            src={room.img_full_path} 
                                            alt={room.room_name} 
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        
                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md ${getStatusColor(room.status)}`}>
                                                {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                                            </span>
                                        </div>

                                        {/* Price Tag */}
                                        <div className="absolute bottom-3 left-3">
                                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-white/90 dark:bg-black/80 text-gray-900 dark:text-white shadow-sm backdrop-blur-sm">
                                                ₱{room.room_price.toLocaleString()}
                                                <span className="text-xs font-normal text-gray-500 ml-1">/night</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="flex flex-col flex-1 p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wider">
                                                    {room.category_name}
                                                </p>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                                                    {room.room_name}
                                                </h3>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 h-10">
                                            {room.room_description}
                                        </p>

                                        {/* Specs */}
                                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-6 py-3 border-t border-b border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-1.5">
                                                <BedDouble className="size-4" />
                                                <span>{room.type_of_bed}</span>
                                            </div>
                                            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                            <div className="flex items-center gap-1.5">
                                                <Users className="size-4" />
                                                <span>Max +{room.max_extra_person}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-auto flex gap-2">
                                            <Button 
                                                onClick={() => openEditModal(room)}
                                                variant="outline"
                                                className="flex-1 gap-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                            >
                                                <Edit className="size-4" />
                                                Edit
                                            </Button>
                                            
                                            <Button 
                                                onClick={() => deleteRoom(room)}
                                                variant="destructive"
                                                className="flex-none px-3 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/40"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Empty State
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                                <Layers className="h-full w-full" />
                            </div>
                            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No rooms available</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new room listing.</p>
                            <div className="mt-6">
                                <Link href={roomsRoute.create.url()}>
                                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                                        <Plus className="size-4 mr-2" />
                                        Add New Room
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Update Modal */}
                    <UpdateRoomForm 
                        room={selectedRoom}
                        categories={categories}
                        isOpen={isEditOpen}
                        onClose={closeEditModal}
                    />
                    
                </div>
            </div>
        </AppLayout>
    );
}