import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import roomcategory from '@/routes/roomcategory';
import roomsRoute from '@/routes/rooms';
import { Room } from '@/types/Rooms';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { 
    BedDouble, Edit, Layers, Plus, Trash2, Users, 
    Info, X, CheckCircle2, ShieldCheck, Search, ArrowUpDown 
} from 'lucide-react';
import { useState, Fragment, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
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
    const [isViewOpen, setIsViewOpen] = useState(false);
    
    // --- SEARCH & SORT STATE ---
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');

    const { auth } = usePage<any>().props;
    const canManageRooms = ['admin', 'supperadmin'].includes(auth.user?.role?.toLowerCase());

    // --- FILTER & SORT LOGIC ---
    const filteredAndSortedRooms = useMemo(() => {
        return rooms
            .filter((room) => 
                room.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
                if (sortBy === 'price-asc') return a.room_price - b.room_price;
                if (sortBy === 'price-desc') return b.room_price - a.room_price;
                return a.room_name.localeCompare(b.room_name);
            });
    }, [rooms, searchQuery, sortBy]);

    const openViewModal = (room: Room) => {
        setSelectedRoom(room);
        setIsViewOpen(true);
    };

    const openEditModal = (room: Room) => {
        setSelectedRoom(room);
        setIsEditOpen(true);
    };

    const closeModals = () => {
        setSelectedRoom(null);
        setIsEditOpen(false);
        setIsViewOpen(false);
    };

    const deleteRoom = (room: Room) => {
        if (confirm('Are you sure you want to delete this room?')) {
            router.delete(roomsRoute.destroy.url(room));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'available': return 'bg-primary text-primary-foreground border-primary shadow-sm';
            case 'booked': return 'bg-secondary text-secondary-foreground border-secondary shadow-sm';
            case 'occupied':
            case 'unavailable': return 'bg-destructive text-destructive-foreground border-destructive shadow-sm';
            default: return 'bg-muted text-muted-foreground border-border shadow-sm';
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Rooms', href: '#' }]}>
            <Head title="Manage Rooms" />

            <div className="min-h-screen bg-background py-6 md:py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    
                    {/* Header Section */}
                    <div className="mb-8 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                        <div className="w-full sm:w-auto">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground font-serif">Room Management</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Manage your room listings, prices, and availability.</p>
                        </div>

                        {canManageRooms && (
                            <div className="flex w-full flex-col gap-3 xs:flex-row sm:w-auto">
                                <Link href={roomcategory.index.url()} className="w-full sm:w-auto">
                                    <Button variant="outline" className="w-full items-center justify-center gap-2 border-border bg-card text-foreground transition-all hover:bg-muted">
                                        <Layers className="size-4" /> Add Category
                                    </Button>
                                </Link>
                                <Link href={roomsRoute.create.url()} className="w-full sm:w-auto">
                                    <Button className="flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg">
                                        <Plus className="size-4" /> Add Room
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* SEARCH & SORT BAR */}
                    <div className="mb-8 flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-2xl border border-border shadow-sm">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search room name or category..." 
                                className="pl-10 h-11 bg-muted/50 border-none focus:ring-2 focus:ring-primary/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <ArrowUpDown className="size-4 text-muted-foreground hidden md:block" />
                            <select 
                                className="h-11 w-full md:w-48 bg-muted/50 rounded-lg border-none text-sm font-medium focus:ring-2 focus:ring-primary/20 px-3"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                            >
                                <option value="name">Sort by Name</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Rooms Grid */}
                    {filteredAndSortedRooms.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredAndSortedRooms.map((room) => (
                                <div key={room.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 duration-300">
                                    {/* Image Section */}
                                    <div className="relative aspect-video w-full overflow-hidden bg-muted cursor-pointer" onClick={() => openViewModal(room)}>
                                        <img src={room.img_full_path} alt={room.room_name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="bg-white/90 p-3 rounded-full text-black shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                                                <Info className="size-6" />
                                            </div>
                                        </div>
                                        <div className="absolute top-3 right-3">
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${getStatusColor(room.status)}`}>
                                                {room.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col p-5">
                                        <div className="mb-2">
                                            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">{room.category_name}</p>
                                            <h3 className="line-clamp-1 text-lg font-bold text-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => openViewModal(room)}>{room.room_name}</h3>
                                        </div>

                                        <p className="mb-4 line-clamp-2 h-10 text-sm text-muted-foreground leading-relaxed">
                                            {room.room_description}
                                        </p>

                                        <div className="mb-6 grid grid-cols-2 gap-2 border-y border-border/50 py-3 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2"><BedDouble className="size-4 text-primary/70" /> <span>{room.type_of_bed}</span></div>
                                            <div className="flex items-center justify-end gap-2 border-l border-border/50 pl-2"><Users className="size-4 text-primary/70" /> <span>Max +{room.max_extra_person}</span></div>
                                        </div>

                                        <div className="mt-auto flex gap-2">
                                            {canManageRooms ? (
                                                <>
                                                    <Button onClick={() => openEditModal(room)} variant="outline" className="flex-1 gap-2 border-border text-foreground hover:bg-muted h-10"><Edit className="size-4" /> Edit</Button>
                                                    <Button onClick={() => deleteRoom(room)} variant="destructive" size="icon" className="h-10 w-10 shrink-0 shadow-sm transition-transform active:scale-95"><Trash2 className="size-4" /></Button>
                                                </>
                                            ) : (
                                                <Button onClick={() => openViewModal(room)} className="w-full gap-2 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px] h-10">View Details</Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-card py-20 px-4 text-center animate-in fade-in zoom-in duration-500">
                            <div className="bg-muted p-6 rounded-full mb-4">
                                <Search className="size-10 text-muted-foreground opacity-50" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">No rooms found</h3>
                            <p className="mt-2 text-sm text-muted-foreground max-w-xs">We couldn't find any rooms matching "{searchQuery}". Try a different search term.</p>
                            <Button variant="link" onClick={() => setSearchQuery('')} className="mt-4 text-primary font-bold">Clear Filters</Button>
                        </div>
                    )}

                    {/* View Details Modal with Pop-up Animation */}
                    <ViewRoomModal isOpen={isViewOpen} onClose={closeModals} room={selectedRoom} />

                    {/* Existing Update Modal */}
                    <UpdateRoomForm room={selectedRoom} categories={categories} isOpen={isEditOpen} onClose={closeModals} />
                </div>
            </div>
        </AppLayout>
    );
}

// --- POP-UP ANIMATED MODAL ---
function ViewRoomModal({ isOpen, onClose, room }: { isOpen: boolean, onClose: () => void, room: Room | null }) {
    if (!room) return null;

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={onClose}>
                {/* Backdrop */}
                <Transition.Child 
                    as={Fragment} 
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" 
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        {/* THE "POP" ANIMATION: Compact & Responsive */}
                        <Transition.Child 
                            as={Fragment} 
                            enter="ease-out duration-300" 
                            enterFrom="opacity-0 scale-95 translate-y-4" 
                            enterTo="opacity-100 scale-100 translate-y-0" 
                            leave="ease-in duration-200" 
                            leaveFrom="opacity-100 scale-100 translate-y-0" 
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-card text-left align-middle shadow-xl transition-all border border-border">
                                
                                {/* Image Header - Reduced Height */}
                                <div className="relative h-48 sm:h-56 w-full overflow-hidden">
                                    <img src={room.img_full_path} className="w-full h-full object-cover" alt={room.room_name} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                    
                                    <button 
                                        onClick={onClose} 
                                        className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all backdrop-blur-md"
                                    >
                                        <X className="size-4" />
                                    </button>

                                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                        <div>
                                            <span className="bg-primary/90 text-primary-foreground px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-1 inline-block">
                                                {room.category_name}
                                            </span>
                                            <Dialog.Title className="text-xl font-bold text-white leading-tight">{room.room_name}</Dialog.Title>
                                        </div>
                                        <div className="text-right text-white">
                                            <p className="text-lg font-bold">₱{room.room_price.toLocaleString()}</p>
                                            <p className="text-[10px] opacity-80">/night</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Body - Compact Padding */}
                                <div className="p-6 max-h-[60vh] overflow-y-auto">
                                    <div className="flex gap-4 mb-6">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg flex-1 justify-center">
                                            <BedDouble className="size-4 text-primary" /> 
                                            <span className="font-medium text-foreground">{room.type_of_bed}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg flex-1 justify-center">
                                            <Users className="size-4 text-primary" /> 
                                            <span className="font-medium text-foreground">Max +{room.max_extra_person}</span>
                                        </div>
                                        <div className={`flex items-center gap-2 text-sm p-2 rounded-lg flex-1 justify-center border ${
                                            room.status === 'available' ? 'bg-green-500/10 text-green-600 border-green-200' : 'bg-red-500/10 text-red-600 border-red-200'
                                        }`}>
                                            <span className="font-bold text-[10px] uppercase">{room.status}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Description</h4>
                                            <p className="text-sm text-foreground leading-relaxed">{room.room_description}</p>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                                                <ShieldCheck className="size-3" /> Amenities
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {room.room_amenities.split(',').map((amenity, i) => (
                                                    <span key={i} className="text-xs bg-muted px-2.5 py-1 rounded-md border border-border font-medium flex items-center gap-1.5">
                                                        <CheckCircle2 className="size-3 text-primary" /> {amenity.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Action */}
                                <div className="p-4 border-t border-border bg-muted/20">
                                    <Button onClick={onClose} className="w-full bg-primary text-primary-foreground font-bold h-10 rounded-lg shadow-sm">
                                        Close Details
                                    </Button>
                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}