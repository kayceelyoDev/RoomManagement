import { Head, Link, router } from '@inertiajs/react';
import { 
    Calendar, 
    MapPin, 
    LogOut, 
    User, 
    Bell, 
    Clock, 
    CheckCircle, 
    XCircle, 
    BedDouble, 
    CreditCard, 
    Sparkles, 
    ArrowLeft,
    Trash2,
    AlertTriangle,
    Info,
    Mail
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns'; // <--- Added formatDistanceToNow
import { logout } from '@/routes'; 
import guest from '@/routes/guest';

// --- Types ---
interface RoomCategory {
    room_category: string;
    price: number;
}

interface Room {
    id: number;
    room_name: string;
    img_url: string;
    room_category?: RoomCategory;
}

interface Service {
    id: number;
    services_name: string;
    pivot: {
        quantity: number;
        total_amount: number;
    };
}

interface Reservation {
    id: number;
    check_in_date: string;
    check_out_date: string;
    status: string;
    reservation_amount: number;
    room: Room;
    services: Service[];
    created_at: string;
}

interface Notification {
    id: string;
    type: 'warning' | 'success' | 'info';
    title: string;
    message: string;
}

interface Props {
    reservations: Reservation[];
    notifications: Notification[];
    user: {
        name: string;
        email: string;
        created_at: string;
    };
}

export default function GuestReservationPage({ reservations, notifications, user }: Props) {

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

    // --- NEW: Helper for "2 hours ago" format ---
    const getRelativeTime = (dateString: string) => {
        try {
            return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
        } catch (error) {
            return 'recently';
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            case 'checked-in': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'checked-out': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed': return <CheckCircle size={14} />;
            case 'pending': return <Clock size={14} />;
            case 'cancelled': return <XCircle size={14} />;
            case 'checked-in': return <Sparkles size={14} />;
            default: return <Clock size={14} />;
        }
    };

    // --- Action Handlers ---
    const handleCancel = (id: number) => {
        if (confirm('Are you sure you want to cancel this reservation? This action cannot be undone.')) {
            router.post(`/reservation/cancel/${id}`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    // Optional: Add toast notification logic here
                }
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans text-[#2C3930]">
            <Head title="My Reservations" />

            {/* --- NAVIGATION --- */}
            <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 transition-all">
                <div className="px-6 py-3 flex items-center justify-between max-w-7xl mx-auto">
                    <Link href={guest.guestpage.url()} className="flex items-center gap-2 hover:opacity-80 transition group">
                        <ArrowLeft className="text-[#2C3930] group-hover:-translate-x-1 transition-transform" size={20} />
                        <span className="text-sm font-bold uppercase tracking-wider text-[#2C3930]">Back to Home</span>
                    </Link>
                    
                    <div className="flex items-center gap-2">
                        <img 
                            src="/img/logo.jpg" 
                            alt="Estaca Bay Logo" 
                            className="h-8 w-8 object-contain rounded-full border border-gray-200" 
                        />
                        <span className="text-lg font-serif font-bold text-[#2C3930]">Estaca Bay</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* --- LEFT SIDEBAR (Profile & Notifications) --- */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Profile Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-24 bg-[#2C3930]" />
                            <div className="relative z-10 flex flex-col items-center text-center mt-8">
                                <div className="w-20 h-20 bg-white rounded-full p-1 shadow-md mb-3">
                                    <div className="w-full h-full bg-[#FFFDE1] rounded-full flex items-center justify-center text-[#2C3930] text-2xl font-serif font-bold">
                                        {user.name.charAt(0)}
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-[#2C3930]">{user.name}</h2>
                                
                                {/* Updated User Info Section */}
                                <div className="flex flex-col items-center gap-1 mb-6">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                        <Mail size={12} />
                                        <span>{user.email}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                                        Joined {getRelativeTime(user.created_at)}
                                    </div>
                                </div>
                                
                                <Link 
                                    href={logout()} 
                                    method="post" 
                                    as="button" 
                                    className="w-full py-2.5 flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition"
                                >
                                    <LogOut size={16} /> Log Out
                                </Link>
                            </div>
                        </div>

                        {/* Notifications Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
                                <Bell size={16} className="text-[#628141]" />
                                <h3 className="font-bold text-[#2C3930] text-sm uppercase tracking-wide">Notifications</h3>
                            </div>
                            
                            <div className="divide-y divide-gray-100">
                                {notifications.length > 0 ? (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className="p-4 flex gap-3 hover:bg-[#F9FAFB] transition-colors">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {notif.type === 'warning' && <AlertTriangle size={18} className="text-amber-500" />}
                                                {notif.type === 'success' && <CheckCircle size={18} className="text-[#628141]" />}
                                                {notif.type === 'info' && <Info size={18} className="text-blue-500" />}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`text-sm font-bold ${
                                                    notif.type === 'warning' ? 'text-amber-700' :
                                                    notif.type === 'success' ? 'text-[#2C3930]' :
                                                    'text-gray-700'
                                                }`}>
                                                    {notif.title}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                    {notif.message}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm italic flex flex-col items-center gap-2">
                                        <Bell size={24} className="opacity-20" />
                                        <p>No new notifications</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT MAIN (Reservation History) --- */}
                    <div className="lg:col-span-8">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-serif font-bold text-[#2C3930]">My Reservations</h1>
                            <span className="bg-[#2C3930] text-[#FFFDE1] px-3 py-1 rounded-full text-xs font-bold">
                                {reservations.length} Total
                            </span>
                        </div>

                        <div className="space-y-6">
                            {reservations.length > 0 ? (
                                reservations.map((res) => (
                                    <div key={res.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                                        <div className="flex flex-col md:flex-row">
                                            
                                            {/* Image Section */}
                                            <div className="w-full md:w-1/3 h-48 md:h-auto relative overflow-hidden">
                                                <img 
                                                    src={getRoomImage(res.room.img_url)} 
                                                    alt={res.room.room_name} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                                                />
                                                <div className="absolute top-3 left-3">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(res.status)} backdrop-blur-sm bg-opacity-90`}>
                                                        {getStatusIcon(res.status)} {res.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Details Section */}
                                            <div className="w-full md:w-2/3 p-6 flex flex-col">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-[#628141] uppercase tracking-widest">
                                                            {res.room.room_category?.room_category}
                                                        </span>
                                                        <h3 className="text-xl font-bold text-[#2C3930] mt-1">{res.room.room_name}</h3>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-xs text-gray-400 uppercase font-bold">Total Amount</span>
                                                        <span className="text-lg font-bold text-[#2C3930]">{formatCurrency(res.reservation_amount)}</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 my-4 py-4 border-t border-b border-gray-50">
                                                    <div>
                                                        <span className="text-xs text-gray-400 block mb-1">Check-in</span>
                                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                            <Calendar size={16} className="text-[#628141]" />
                                                            {format(parseISO(res.check_in_date), 'MMM dd, yyyy')}
                                                        </div>
                                                        <span className="text-xs text-gray-400 ml-6">{format(parseISO(res.check_in_date), 'h:mm a')}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-gray-400 block mb-1">Check-out</span>
                                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                            <Calendar size={16} className="text-[#628141]" />
                                                            {format(parseISO(res.check_out_date), 'MMM dd, yyyy')}
                                                        </div>
                                                        <span className="text-xs text-gray-400 ml-6">{format(parseISO(res.check_out_date), 'h:mm a')}</span>
                                                    </div>
                                                </div>

                                                {/* Services */}
                                                {res.services.length > 0 && (
                                                    <div className="mb-4">
                                                        <p className="text-xs font-bold text-gray-400 mb-2">ADD-ONS</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {res.services.map(svc => (
                                                                <span key={svc.id} className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded border border-gray-200">
                                                                    <span className="font-bold text-[#2C3930]">{svc.pivot.quantity}x</span> {svc.services_name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Card Footer: UPDATED TIME FORMAT */}
                                                <div className="mt-auto flex items-center justify-between pt-2">
                                                    {/* Changed from specific date to relative time (2 hours ago) */}
                                                    <div className="text-xs text-gray-400 flex items-center gap-1" title={format(parseISO(res.created_at), 'PPP pp')}>
                                                        <CreditCard size={12} /> Booked {getRelativeTime(res.created_at)}
                                                    </div>

                                                    { !['cancelled', 'checked-in', 'checked-out', 'completed'].includes(res.status.toLowerCase()) && (
                                                        <button 
                                                            onClick={() => handleCancel(res.id)}
                                                            className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-50 hover:border-red-300 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                            Cancel Reservation
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                    <div className="w-16 h-16 bg-[#FFFDE1] rounded-full flex items-center justify-center mb-4 text-[#D8E983]">
                                        <BedDouble size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-[#2C3930]">No Reservations Yet</h3>
                                    <p className="text-sm text-gray-500 mb-6">You haven't booked any stays with us yet.</p>
                                    <Link 
                                        href={guest.guestpage.url()}
                                        className="px-6 py-2.5 bg-[#2C3930] text-[#FFFDE1] rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-[#628141] transition shadow-md"
                                    >
                                        Find a Room
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}