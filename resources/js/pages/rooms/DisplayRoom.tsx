import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import roomcategory from '@/routes/roomcategory';
import roomsRoute from '@/routes/rooms';
import { Room } from '@/types/Rooms';
import { Head, Link, router } from '@inertiajs/react';
import { BedDouble, Edit, Layers, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import UpdateRoomForm from './modals/UpdateRoomForm';

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
        switch (status.toLowerCase()) {
            case 'available':
                // Primary is Sage/Lime. Using solid color ensures it pops against the photo.
                // text-primary-foreground automatically picks the correct contrast color (Cream or Dark Green).
                return 'bg-primary text-primary-foreground border-primary shadow-sm';

            case 'booked':
                // Secondary is Lime/Sage. Good for intermediate state.
                return 'bg-secondary text-secondary-foreground border-secondary shadow-sm';

            case 'occupied':
            case 'unavailable':
                // Destructive is Red. High visibility for unavailable items.
                return 'bg-destructive text-destructive-foreground border-destructive shadow-sm';

            default:
                // Fallback for unknown statuses
                return 'bg-muted text-muted-foreground border-border shadow-sm';
        }
    };

    return (
        <AppLayout
            breadcrumbs={[{ title: 'Rooms', href: roomsRoute.index.url() }]}
        >
            <Head title="Manage Rooms" />

            <div className="min-h-screen bg-background py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                                Room Management
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Manage your room listings, prices, and
                                availability.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            {/* Add Category Button */}
                            <Link href={roomcategory.index.url()}>
                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2 hover:bg-muted dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted"
                                >
                                    <Layers className="size-4" />
                                    Add Category
                                </Button>
                            </Link>

                            {/* Add Room Button */}
                            <Link href={roomsRoute.create.url()}>
                                <Button className="flex items-center gap-2 bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg">
                                    <Plus className="size-4" />
                                    Add Room
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Rooms Grid */}
                    {rooms.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {rooms.map((room) => (
                                <div
                                    key={room.id}
                                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/50 hover:shadow-md dark:hover:border-primary/30"
                                >
                                    {/* Image Section */}
                                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                                        <img
                                            src={room.img_full_path} // Check that this variable name is exact
                                            alt={room.room_name}
                                            className="h-full w-full object-cover"
                                            // Add this to see if there's a hidden error
                                            onError={(e) =>
                                                console.error(
                                                    'Image failed to load:',
                                                    room.img_full_path,
                                                )
                                            }
                                        />

                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3">
                                            <span
                                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md ${getStatusColor(room.status)}`}
                                            >
                                                {room.status
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    room.status.slice(1)}
                                            </span>
                                        </div>

                                        {/* Price Tag */}
                                        <div className="absolute bottom-3 left-3">
                                            <span className="inline-flex items-center rounded-lg bg-white/90 px-3 py-1 text-sm font-bold text-gray-900 shadow-sm backdrop-blur-sm dark:bg-black/80 dark:text-white">
                                                ₱
                                                {room.room_price.toLocaleString()}
                                                <span className="ml-1 text-xs font-normal text-gray-500">
                                                    /night
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="flex flex-1 flex-col p-5">
                                        <div className="mb-2 flex items-start justify-between">
                                            <div>
                                                <p className="mb-1 text-xs font-medium tracking-wider text-primary uppercase">
                                                    {room.category_name}
                                                </p>
                                                <h3 className="line-clamp-1 text-lg font-bold text-gray-900 dark:text-white">
                                                    {room.room_name}
                                                </h3>
                                            </div>
                                        </div>

                                        <p className="mb-4 line-clamp-2 h-10 text-sm text-gray-600 dark:text-gray-400">
                                            {room.room_description}
                                        </p>

                                        {/* Specs */}
                                        <div className="mb-6 flex items-center gap-4 border-t border-b border-gray-100 py-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                            <div className="flex items-center gap-1.5">
                                                <BedDouble className="size-4" />
                                                <span>{room.type_of_bed}</span>
                                            </div>
                                            <div className="h-4 w-px bg-border"></div>
                                            <div className="flex items-center gap-1.5">
                                                <Users className="size-4" />
                                                <span>
                                                    Max +{room.max_extra_person}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-auto flex gap-2">
                                            <Button
                                                onClick={() =>
                                                    openEditModal(room)
                                                }
                                                variant="outline"
                                                className="flex-1 gap-2 border-border text-foreground hover:bg-muted"
                                            >
                                                <Edit className="size-4" />
                                                Edit
                                            </Button>

                                            <Button
                                                onClick={() => deleteRoom(room)}
                                                variant="destructive"
                                                className="flex-none border border-red-100 bg-red-50 px-3 text-red-600 hover:bg-red-100 hover:text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
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
                        <div className="rounded-2xl border border-dashed border-border bg-card py-20 text-center">
                            <div className="mx-auto mb-4 h-12 w-12 text-gray-400">
                                <Layers className="h-full w-full" />
                            </div>
                            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                                No rooms available
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Get started by creating a new room listing.
                            </p>
                            <div className="mt-6">
                                <Link href={roomsRoute.create.url()}>
                                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                                        <Plus className="mr-2 size-4" />
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
