import { useState, useMemo, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Search, X, ArrowRight, LogOut, ClipboardList, 
    CheckCircle, Users, Sun, Moon, BedDouble, AlertCircle
} from 'lucide-react';
import { logout } from '@/routes'; 
import AddReservation from '@/pages/reservations/modal/AddReservation'; 
import guest from '@/routes/guest';

// --- Types ---
interface Service {
    id: number;
    services_name: string;
    services_price: number;
}

interface RoomCategory {
    id: number;
    room_category: string;
    price: number;
    room_capacity: number;
}

interface Room {
    id: number;
    room_name: string;
    room_categories_id: number;
    img_url: string;
    max_extra_person: number;
    status: string;
    room_description: string;
    type_of_bed: string;
    // FIX: Match Laravel relationship name (snake_case in JSON)
    room_category?: RoomCategory; 
}

interface GuestPageProps {
    rooms: Room[];
    services: Service[];
    auth: {
        user: { name: string; email: string; role: string; };
    };
    [key: string]: unknown; 
}

export default function GuestPage({ rooms = [], services = [] }: GuestPageProps) {
    const { auth } = usePage<GuestPageProps>().props;
    
    // States
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    
    // Theme State
    const [isDarkMode, setIsDarkMode] = useState(false);

    // --- Effects ---
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // --- Helpers ---
    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getRoomImage = (url: string | null) => {
        if (!url) return '/img/room1.jpg';
        return url.startsWith('http') ? url : `/storage/${url}`;
    };

    const handleProceedToReservation = () => {
        setIsReservationModalOpen(true);
    };

    // FIX: Updated accessor to room_category
    const categories = useMemo(() => {
        const cats = rooms.map(r => r.room_category?.room_category).filter(Boolean) as string[];
        return ['All', ...Array.from(new Set(cats))];
    }, [rooms]);

    // FIX: Updated accessor to room_category
    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.room_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || room.room_category?.room_category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-secondary selection:text-secondary-foreground transition-colors duration-300">
            <Head title="Book Your Stay" />

            {/* --- HEADER --- */}
            <header className="fixed top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link href='/' className="flex items-center gap-2 sm:gap-3 group">
                        
                        <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">Estaca Bay</span>
                    </Link>

                    <div className="flex items-center gap-3 sm:gap-6">
                        <Link 
                            href={guest.myreservation.url()} 
                            className="text-sm font-medium text-muted-foreground hover:text-primary transition flex items-center gap-2 group"
                        >
                             <span className="hidden sm:inline group-hover:underline decoration-secondary decoration-2 underline-offset-4">My Bookings</span>
                             <div className="p-2 bg-secondary/20 rounded-full text-secondary-foreground group-hover:bg-secondary transition">
                                <ClipboardList size={16} />
                             </div>
                        </Link>
                        
                        <div className="h-6 w-px bg-border hidden sm:block"></div>

                        <button 
                            onClick={toggleTheme} 
                            className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-secondary/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring"
                            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <div className="h-6 w-px bg-border hidden sm:block"></div>

                        <Link href={logout()} method="post" as="button" className="text-muted-foreground hover:text-destructive transition pl-1" title="Log Out">
                            <LogOut size={20} />
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-20">
                
                {/* --- FILTERS & HERO --- */}
                <div className="mb-8 sm:mb-12 space-y-6 sm:space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
                                Find your <span className="text-primary italic">sanctuary</span>.
                            </h1>
                            <p className="text-muted-foreground text-base sm:text-lg">Select a room to begin your journey.</p>
                        </div>
                        
                        <div className="relative group w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition" size={20} />
                            <input 
                                type="text" 
                                placeholder="Search accommodations..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-full outline-none focus:ring-2 focus:ring-ring focus:border-transparent shadow-sm transition-all text-sm placeholder:text-muted-foreground/50"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 sm:px-5 py-2 rounded-full text-sm font-bold tracking-wide transition-all duration-300 border whitespace-nowrap ${
                                    selectedCategory === cat 
                                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105' 
                                        : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- ROOM GRID --- */}
                {filteredRooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {filteredRooms.map((room) => (
                            <div 
                                key={room.id} 
                                onClick={() => setSelectedRoom(room)}
                                className="group cursor-pointer bg-card rounded-3xl border border-border overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 relative"
                            >
                                <div className="aspect-[4/3] overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity" />
                                    <img
                                        src={getRoomImage(room.img_url)}
                                        alt={room.room_name}
                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/room1.jpg'; }}
                                        className="absolute inset-0 w-full h-full object-cover object-center transform group-hover:scale-110 transition duration-700 ease-in-out"
                                    />
                                    <div className="absolute top-4 left-4 z-20">
                                        <span className="px-3 py-1 bg-background/90 backdrop-blur-md text-foreground text-[10px] font-bold uppercase tracking-wider rounded-full border border-border">
                                            {/* FIX: Updated accessor */}
                                            {room.room_category?.room_category}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5 sm:p-6 space-y-3 sm:space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                {room.room_name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                                {/* FIX: Updated accessor */}
                                                <Users size={14} /> {room.room_category?.room_capacity} Guests
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end flex-shrink-0 ml-2">
                                             <span className="text-lg font-bold text-primary whitespace-nowrap">
                                                {/* FIX: Updated accessor */}
                                                {room.room_category && formatCurrency(room.room_category.price)}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground uppercase">/ night</span>
                                        </div>
                                    </div>

                                    <div className="pt-3 sm:pt-4 border-t border-border flex items-center justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:transform sm:translate-y-2 sm:group-hover:translate-y-0 transition-all duration-300">
                                        <span className="text-xs font-bold text-primary uppercase tracking-widest">View Details</span>
                                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4 text-muted-foreground">
                            <Search size={24} />
                        </div>
                        <p className="text-muted-foreground text-lg">No rooms found matching your criteria.</p>
                        <button onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }} className="mt-4 text-primary font-bold hover:underline">Clear Filters</button>
                    </div>
                )}
            </main>

            {/* --- DETAILS MODAL --- */}
            {selectedRoom && !isReservationModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl shadow-black/10 relative flex flex-col md:flex-row border border-border animate-in slide-in-from-bottom-10 duration-300">
                        
                        <button 
                            onClick={() => setSelectedRoom(null)} 
                            className="absolute top-4 right-4 z-30 p-2 bg-background/50 hover:bg-background rounded-full text-foreground transition backdrop-blur-md border border-border"
                        >
                            <X size={20} />
                        </button>

                        {/* Room Image Section */}
                        <div className="w-full md:w-2/5 h-48 sm:h-64 md:h-auto min-h-[220px] md:min-h-[360px] relative bg-muted flex-shrink-0 overflow-hidden">
                            <img
                                src={getRoomImage(selectedRoom.img_url)}
                                alt={selectedRoom.room_name}
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/room1.jpg'; }}
                                className="absolute inset-0 w-full h-full object-cover object-center"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r" />
                            <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 text-white z-10">
                                <span className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 bg-secondary text-secondary-foreground text-[10px] sm:text-xs font-bold uppercase rounded-lg mb-2 sm:mb-3">
                                    {selectedRoom.room_category?.room_category}
                                </span>
                                <h2 className="text-2xl sm:text-4xl font-bold leading-tight drop-shadow-md">{selectedRoom.room_name}</h2>
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="w-full md:w-3/5 p-6 md:p-8 overflow-y-auto bg-card flex flex-col flex-1">
                            {/* Status & Quick Info Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                <div className="px-3 py-2 bg-muted rounded-xl border border-border">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Base Capacity</span>
                                    <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                                        <Users size={14} className="text-primary" /> 
                                        {selectedRoom.room_category?.room_capacity} pax
                                    </div>
                                </div>
                                <div className="px-3 py-2 bg-muted rounded-xl border border-border">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Max Extra</span>
                                    <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                                        <Users size={14} className="text-blue-500" /> 
                                        +{selectedRoom.max_extra_person || 0}
                                    </div>
                                </div>
                                <div className="px-3 py-2 bg-muted rounded-xl border border-border">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Bed Type</span>
                                    <p className="text-foreground font-bold text-sm truncate">{selectedRoom.type_of_bed || 'Standard'}</p>
                                </div>
                                <div className="px-3 py-2 bg-muted rounded-xl border border-border">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Status</span>
                                    <div className="flex items-center gap-1">
                                        <CheckCircle size={14} className={selectedRoom.status === 'available' ? 'text-emerald-500' : 'text-orange-500'} /> 
                                        <span className="text-foreground font-bold text-sm capitalize">{selectedRoom.status}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info Grid - Extra Bed & Category */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="px-3 py-2 bg-secondary/5 border border-secondary/20 rounded-xl">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Max Extra Beds</span>
                                    <p className="text-foreground font-bold text-sm">{selectedRoom.room_category?.max_extra_bed || 0}</p>
                                </div>
                                <div className="px-3 py-2 bg-secondary/5 border border-secondary/20 rounded-xl">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Category</span>
                                    <p className="text-foreground font-bold text-sm">{selectedRoom.room_category?.room_category || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Price Section */}
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                                <span className="text-xs text-muted-foreground uppercase font-bold block mb-2">Nightly Rate</span>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-bold text-primary">
                                        {selectedRoom.room_category && formatCurrency(selectedRoom.room_category.price)}
                                    </div>
                                    <span className="text-sm text-muted-foreground">/ night</span>
                                </div>
                            </div>

                            {/* Room Description */}
                            <div className="space-y-3 mb-6">
                                <h3 className="text-xs font-bold text-foreground uppercase tracking-widest border-l-2 border-secondary pl-3">
                                    Description
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {selectedRoom.room_description || "No description available for this room."}
                                </p>
                            </div>

                            {/* Amenities Section */}
                            {selectedRoom.room_amenities && (
                                <div className="space-y-3 mb-6">
                                    <h3 className="text-xs font-bold text-foreground uppercase tracking-widest border-l-2 border-secondary pl-3">
                                        Amenities
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {selectedRoom.room_amenities.split(',').map((amenity, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                {amenity.trim()}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Capacity & Accommodations Summary */}
                            <div className="bg-muted/40 dark:bg-muted/30 border border-border rounded-xl p-4 mb-6 space-y-2">
                                <p className="text-xs font-bold text-foreground flex items-center gap-2 mb-2">
                                    <AlertCircle size={12} />
                                    Room Details
                                </p>
                                <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                                    <div className="space-y-1">
                                        <div className="font-medium">Accommodations:</div>
                                        <ul className="ml-3 space-y-0.5">
                                            <li>• Base capacity: {selectedRoom.room_category?.room_capacity || 0} guests</li>
                                            <li>• Extra persons: +{selectedRoom.max_extra_person || 0}</li>
                                            <li>• Total max: {(selectedRoom.room_category?.room_capacity || 0) + (selectedRoom.max_extra_person || 0)}</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="font-medium">Bed Setup:</div>
                                        <ul className="ml-3 space-y-0.5">
                                            <li>• Type: {selectedRoom.type_of_bed || 'Standard'}</li>
                                            <li>• Extra beds: {selectedRoom.room_category?.max_extra_bed || 0}</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Book Button */}
                            <button 
                                onClick={handleProceedToReservation}
                                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-widest hover:bg-primary/90 transition shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group text-sm"
                            >
                                Book This Room 
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- BOOKING FORM --- */}
            {isReservationModalOpen && selectedRoom && (
                <AddReservation 
                    isOpen={isReservationModalOpen}
                    onClose={() => setIsReservationModalOpen(false)}
                    rooms={rooms}
                    services={services}
                    preSelectedRoomId={selectedRoom.id}
                    role="guest" 
                />
            )}
        </div>
    );
}