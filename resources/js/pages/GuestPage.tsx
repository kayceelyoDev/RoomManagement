import { useState, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Search,
    Calendar,
    Users,
    ArrowRight,
    MapPin,
    LogOut,
    Menu,
    X,
    BedDouble,
    CheckCircle,
    ClipboardList,
    Star,
    Utensils,
    Waves,
    Armchair,
    Banknote
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
    room_description: string;
    img_url: string;
    max_extra_person: number;
    room_amenities: string;
    type_of_bed: string;
    status: string;
    room_category?: RoomCategory;
}

// Updated Props Interface
interface GuestPageProps {
    rooms: Room[];
    services: Service[]; // <--- Added services here
    auth: {
        user: {
            name: string;
            email: string;
            role: string;
        };
    };
    [key: string]: unknown; 
}

export default function GuestPage({ rooms = [], services = [] }: GuestPageProps) {
    const { auth } = usePage<GuestPageProps>().props;
    
    // UI States
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Modal States
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null); // For details popup
    const [isReservationModalOpen, setIsReservationModalOpen] = useState(false); // For booking form

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // --- Helpers ---
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const getRoomImage = (url: string | null) => {
        if (!url) return '/img/room1.jpg';
        if (url.startsWith('http') || url.startsWith('https')) return url;
        return `/storage/${url}`;
    };

    // --- Handlers ---
    const handleProceedToReservation = () => {
        setIsReservationModalOpen(true);
    };

    // --- Derived Data ---
    const categories = useMemo(() => {
        const cats = rooms.map(r => r.room_category?.room_category).filter(Boolean) as string[];
        return ['All', ...Array.from(new Set(cats))];
    }, [rooms]);

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.room_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || room.room_category?.room_category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans text-[#2C3930]">
            <Head title="Book Your Stay" />

            {/* --- NAVIGATION --- */}
            <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 transition-all">
                <div className="px-6 py-3 flex items-center justify-between max-w-7xl mx-auto">
                    <Link href='/' className="flex items-center gap-2 hover:opacity-80 transition">
                        <img 
                            src="/img/logo.jpg" 
                            alt="Estaca Bay Logo" 
                            className="h-10 w-10 object-contain rounded-full border border-gray-200" 
                        />
                        <span className="text-xl font-serif font-bold text-[#2C3930] hidden sm:block">Estaca Bay</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link 
                            href={guest.myreservation.url()} 
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-[#2C3930]/20 rounded-full text-xs font-bold uppercase tracking-wider text-[#2C3930] hover:bg-[#FFFDE1] hover:border-[#D8E983] transition shadow-sm"
                        >
                            <ClipboardList size={16} />
                            My Reservations
                        </Link>

                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <span className="text-sm font-medium hidden md:block">
                                Hello, {auth.user.name.split(' ')[0]}
                            </span>
                            <Link 
                                href={logout()} 
                                method="post" 
                                as="button" 
                                className="p-2 text-gray-500 hover:text-red-600 transition rounded-full hover:bg-red-50"
                                title="Log Out"
                            >
                                <LogOut size={20} />
                            </Link>
                        </div>

                        <button 
                            className="md:hidden text-[#2C3930]"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 absolute w-full left-0 px-6 py-4 shadow-lg flex flex-col gap-4 text-sm font-bold uppercase text-[#2C3930]">
                        <Link href={guest.myreservation.url()} className="py-2 flex items-center gap-2">
                            <ClipboardList size={16} /> My Reservations
                        </Link>
                        <Link href={logout()} method="post" className="py-2 flex items-center gap-2 text-red-600">
                            <LogOut size={16} /> Log Out
                        </Link>
                    </div>
                )}
            </header>

            {/* --- MAIN CONTENT --- */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                
                {/* Search & Filter */}
                <div className="bg-white rounded-2xl shadow-lg p-4 mb-10 border border-gray-100 sticky top-20 z-30">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full lg:w-1/3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search rooms..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#628141] focus:border-transparent outline-none text-sm transition"
                            />
                        </div>

                        <div className="flex w-full lg:w-auto gap-2 overflow-x-auto pb-2 lg:pb-0">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 cursor-pointer hover:border-[#628141] transition min-w-[140px]">
                                <Calendar size={16} className="text-[#628141]" />
                                <span>Check-in</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 cursor-pointer hover:border-[#628141] transition min-w-[140px]">
                                <Calendar size={16} className="text-[#628141]" />
                                <span>Check-out</span>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                                        selectedCategory === cat 
                                        ? 'bg-[#2C3930] text-[#FFFDE1] shadow-md transform scale-105' 
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Rooms Grid */}
                <div className="mb-8">
                    <h2 className="text-2xl font-serif font-bold text-[#2C3930] mb-6 flex items-center gap-2">
                        Available Accommodations <span className="text-sm font-sans font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{filteredRooms.length}</span>
                    </h2>

                    {filteredRooms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRooms.map((room) => (
                                <div 
                                    key={room.id} 
                                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-[#D8E983]/50 transition-all duration-300 flex flex-col h-full"
                                >
                                    <div className="relative h-56 overflow-hidden">
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                                        <img 
                                            src={getRoomImage(room.img_url)} 
                                            alt={room.room_name} 
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700"
                                            loading="lazy"
                                        />
                                        <div className="absolute top-3 right-3 z-20">
                                            <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-[#2C3930] shadow-sm">
                                                {room.room_category?.room_category}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-[#2C3930] line-clamp-1">{room.room_name}</h3>
                                            <div className="flex items-center gap-1 text-yellow-500">
                                                <Star size={14} fill="currentColor" />
                                                <span className="text-xs font-bold text-gray-600">4.8</span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                                            {room.room_description}
                                        </p>

                                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg">
                                            <div className="flex items-center gap-1.5">
                                                <Users size={14} className="text-[#628141]" />
                                                <span>{room.room_category?.room_capacity} Guests</span>
                                            </div>
                                            <div className="w-px h-3 bg-gray-300" />
                                            <div className="flex items-center gap-1.5">
                                                <BedDouble size={14} className="text-[#628141]" />
                                                <span className="truncate max-w-[80px]">{room.type_of_bed}</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                                            <div>
                                                <span className="text-xs text-gray-400 block">Price per night</span>
                                                <span className="text-lg font-bold text-[#628141]">
                                                    {room.room_category && formatCurrency(room.room_category.price)}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedRoom(room)}
                                                className="px-6 py-2.5 bg-[#2C3930] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#628141] transition shadow-md hover:shadow-lg active:scale-95"
                                            >
                                                Book Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                <Search size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No rooms found</h3>
                            <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
                            <button 
                                onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                                className="mt-4 text-[#628141] font-bold text-sm hover:underline"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* --- 1. ROOM DETAILS MODAL --- */}
            {selectedRoom && !isReservationModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C3930]/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col md:flex-row animate-in slide-in-from-bottom-4 duration-300">
                        
                        <button 
                            onClick={() => setSelectedRoom(null)}
                            className="absolute top-4 right-4 z-20 p-2 bg-white/80 hover:bg-white rounded-full text-gray-800 transition shadow-md"
                        >
                            <X size={20} />
                        </button>

                        <div className="w-full md:w-5/12 h-64 md:h-auto bg-gray-100 relative">
                            <img 
                                src={getRoomImage(selectedRoom.img_url)} 
                                alt={selectedRoom.room_name} 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:bg-gradient-to-r" />
                            <div className="absolute bottom-6 left-6 text-white">
                                <span className="px-2 py-1 bg-[#D8E983] text-[#2C3930] text-[10px] font-bold uppercase rounded-md mb-2 inline-block">
                                    {selectedRoom.room_category?.room_category}
                                </span>
                                <h3 className="text-2xl font-serif font-bold">{selectedRoom.room_name}</h3>
                            </div>
                        </div>

                        <div className="w-full md:w-7/12 p-8 overflow-y-auto bg-white flex flex-col">
                            
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-[#2C3930] uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <CheckCircle size={16} className="text-[#628141]" /> Room Details
                                </h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {selectedRoom.room_description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold">Capacity</span>
                                    <div className="flex items-center gap-2 text-sm font-bold text-[#2C3930] mt-1">
                                        <Users size={16} /> {selectedRoom.room_category?.room_capacity} Persons
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold">Bed Configuration</span>
                                    <div className="flex items-center gap-2 text-sm font-bold text-[#2C3930] mt-1">
                                        <BedDouble size={16} /> {selectedRoom.type_of_bed}
                                    </div>
                                </div>
                            </div>

                            {selectedRoom.room_amenities && (
                                <div className="mb-8">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Amenities Included</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedRoom.room_amenities.split(',').map((amenity, idx) => (
                                            <span key={idx} className="text-xs px-3 py-1.5 bg-[#FFFDE1] text-[#2C3930] rounded-lg border border-[#D8E983] font-medium">
                                                {amenity.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto pt-6 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <span className="text-xs text-gray-400 font-bold uppercase">Total per night</span>
                                        <div className="text-3xl font-bold text-[#628141]">
                                            {selectedRoom.room_category && formatCurrency(selectedRoom.room_category.price)}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-gray-400 block">Excluding taxes & fees</span>
                                        <span className="text-xs text-[#2C3930] font-bold">Free Cancellation</span>
                                    </div>
                                </div>

                                <button 
                                    className="w-full py-4 bg-[#2C3930] text-[#FFFDE1] rounded-xl font-bold uppercase text-sm tracking-widest hover:bg-[#3E4F42] transition shadow-xl flex items-center justify-center gap-2"
                                    onClick={handleProceedToReservation}
                                >
                                    Confirm Reservation <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- 2. ADD RESERVATION MODAL --- */}
            {isReservationModalOpen && selectedRoom && (
                <AddReservation 
                    isOpen={isReservationModalOpen}
                    onClose={() => setIsReservationModalOpen(false)}
                    rooms={rooms} // Passed full room list for context
                    preSelectedRoomId={selectedRoom.id} // Passed ID to pre-select
                    services={services} // Passed services props
                />
            )}
        </div>
    );
}