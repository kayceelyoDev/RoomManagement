import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import roomcategory from '@/routes/roomcategory';
import roomsRoute from '@/routes/rooms';
import { Room } from '@/types/Rooms';
import { Head, Link, router } from '@inertiajs/react';
import { BedDouble, Edit, Layers, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import UpdateRoomForm from './modals/UpdateRoomForm';

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
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

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

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'available':
                return 'bg-primary text-primary-foreground border-primary shadow-sm';
            case 'booked':
                return 'bg-secondary text-secondary-foreground border-secondary shadow-sm';
            case 'occupied':
            case 'unavailable':
                return 'bg-destructive text-destructive-foreground border-destructive shadow-sm';
            default:
                return 'bg-muted text-muted-foreground border-border shadow-sm';
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Rooms', href: roomsRoute.index.url() }]}>
            <Head title="Manage Rooms" />

            <div className="min-h-screen bg-background py-6 md:py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    
                    {/* Header Section: Stacked on mobile, row on desktop */}
                    <div className="mb-8 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                        <div className="w-full sm:w-auto">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                                Room Management
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Manage your room listings, prices, and availability.
                            </p>
                        </div>

                        {/* Buttons: Full width on mobile */}
                        <div className="flex w-full flex-col gap-3 xs:flex-row sm:w-auto">
                            <Link href={roomcategory.index.url()} className="w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    className="flex w-full items-center justify-center gap-2 border-border bg-card text-foreground transition-all hover:bg-muted"
                                >
                                    <Layers className="size-4" />
                                    Add Category
                                </Button>
                            </Link>

                            <Link href={roomsRoute.create.url()} className="w-full sm:w-auto">
                                <Button className="flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg">
                                    <Plus className="size-4" />
                                    Add Room
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Rooms Grid: 1 col mobile, 2 col tablet, 3 col desktop */}
                    {rooms.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {rooms.map((room) => (
                                <div
                                    key={room.id}
                                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/50 hover:shadow-md dark:hover:border-primary/30"
                                >
                                    {/* Image Section */}
                                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                                        <img
                                            src={room.img_full_path}
                                            alt={room.room_name}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />

                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3">
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${getStatusColor(room.status)}`}>
                                                {room.status}
                                            </span>
                                        </div>

                                        {/* Price Tag */}
                                        <div className="absolute bottom-3 left-3">
                                            <span className="inline-flex items-center rounded-lg bg-card/90 px-3 py-1 text-sm font-bold text-foreground shadow-sm backdrop-blur-sm">
                                                ₱{room.room_price.toLocaleString()}
                                                <span className="ml-1 text-[10px] font-normal text-muted-foreground uppercase">/night</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="flex flex-1 flex-col p-5">
                                        <div className="mb-2">
                                            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                                                {room.category_name}
                                            </p>
                                            <h3 className="line-clamp-1 text-lg font-bold text-foreground">
                                                {room.room_name}
                                            </h3>
                                        </div>

                                        <p className="mb-4 line-clamp-2 h-10 text-sm text-muted-foreground leading-relaxed">
                                            {room.room_description}
                                        </p>

                                        {/* Specs Table: Fixed layout for better mobile alignment */}
                                        <div className="mb-6 grid grid-cols-2 gap-2 border-y border-border/50 py-3 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <BedDouble className="size-4 text-primary/70" />
                                                <span className="truncate">{room.type_of_bed}</span>
                                            </div>
                                            <div className="flex items-center justify-end gap-2 border-l border-border/50 pl-2 sm:justify-start">
                                                <Users className="size-4 text-primary/70" />
                                                <span>Max +{room.max_extra_person}</span>
                                            </div>
                                        </div>

                                        {/* Actions: Always side-by-side even on small screens */}
                                        <div className="mt-auto flex gap-2">
                                            <Button
                                                onClick={() => openEditModal(room)}
                                                variant="outline"
                                                className="flex-1 gap-2 border-border text-foreground hover:bg-muted h-10"
                                            >
                                                <Edit className="size-4" />
                                                Edit
                                            </Button>

                                            <Button
                                                onClick={() => deleteRoom(room)}
                                                variant="destructive"
                                                size="icon"
                                                className="h-10 w-10 shrink-0 shadow-sm transition-transform active:scale-95"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Empty State: Centered and responsive */
                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card py-16 px-4 text-center">
                            <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
                                <Layers className="size-8" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">No rooms available</h3>
                            <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                                Your room listing is empty. Get started by creating your first room listing.
                            </p>
                            <div className="mt-8 w-full sm:w-auto">
                                <Link href={roomsRoute.create.url()}>
                                    <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12">
                                        <Plus className="mr-2 size-4" />
                                        Add New Room
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}

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