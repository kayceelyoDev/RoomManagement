import { Head, Link, router } from '@inertiajs/react';
import { 
    Calendar, LogOut, Bell, Clock, CheckCircle, XCircle, 
    BedDouble, CreditCard, Sparkles, ArrowLeft, Trash2, 
    AlertTriangle, Info, Mail, Sun, Moon, ClipboardList,
    ChevronRight
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow, isFuture } from 'date-fns'; 
import { logout } from '@/routes'; 
import guest from '@/routes/guest';
import { useState, useEffect } from 'react';

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
    created_at?: string; 
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
    // --- THEME STATE ---
    const [isDarkMode, setIsDarkMode] = useState(false);

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

    // --- HELPERS ---
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getRoomImage = (url: string | null) => {
        if (!url) return '/img/room1.jpg';
        if (url.startsWith('http') || url.startsWith('https')) return url;
        return `/storage/${url}`;
    };

    const getRelativeTime = (dateString: string) => {
        try {
            return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
        } catch (error) {
            return 'recently';
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed': 
                return { 
                    style: 'bg-primary/10 text-primary border-primary/20', 
                    icon: <CheckCircle size={14} />,
                    label: 'Confirmed'
                };
            case 'pending': 
                return { 
                    style: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400 dark:border-yellow-400/20', 
                    icon: <Clock size={14} />,
                    label: 'Pending Approval'
                };
            case 'cancelled': 
                return { 
                    style: 'bg-destructive/10 text-destructive border-destructive/20', 
                    icon: <XCircle size={14} />,
                    label: 'Cancelled'
                };
            case 'checked-in': 
            case 'checked_in':
                return { 
                    style: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400', 
                    icon: <Sparkles size={14} />,
                    label: 'Checked In'
                };
            case 'checked-out':
            case 'checked_out':
                return {
                    style: 'bg-gray-500/10 text-gray-600 border-gray-500/20 dark:text-gray-400',
                    icon: <LogOut size={14} />,
                    label: 'Completed'
                };
            default: 
                return { 
                    style: 'bg-muted text-muted-foreground border-border', 
                    icon: <Clock size={14} />,
                    label: status
                };
        }
    };

    const handleCancel = (id: number) => {
        if (confirm('Are you sure you want to cancel this reservation? This action cannot be undone.')) {
            router.post(`/reservation/cancel/${id}`, {}, {
                preserveScroll: true,
            });
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
            <Head title="My Reservations" />

            {/* --- NAVIGATION --- */}
            <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border transition-all">
                <div className="px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
                    
                    {/* Back Button */}
                    <Link href={guest.guestpage.url()} className="flex items-center gap-2 group text-muted-foreground hover:text-primary transition-colors">
                        <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider hidden sm:block">Back to Home</span>
                    </Link>
                    
                    {/* Right Side Actions */}
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={toggleTheme} 
                            className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-secondary/20 transition-all focus:outline-none"
                            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        
                        <div className="h-6 w-px bg-border hidden sm:block"></div>
                        
                        <span className="text-lg font-serif font-bold tracking-tight text-foreground hidden sm:block">Estaca Bay</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    
                    {/* --- LEFT SIDEBAR (Profile & Notifications) --- */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Profile Card */}
                        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden relative group">
                            {/* Decorative Header Background */}
                            <div className="absolute top-0 left-0 w-full h-32 bg-[#2C3930] dark:bg-[#1a221d]" />
                            
                            <div className="relative z-10 flex flex-col items-center text-center mt-16 px-6 pb-8">
                                <div className="w-24 h-24 bg-card rounded-full p-1.5 shadow-lg mb-4 ring-4 ring-card">
                                    <div className="w-full h-full bg-[#D8E983] text-[#2C3930] rounded-full flex items-center justify-center text-3xl font-serif font-bold uppercase">
                                        {user.name.charAt(0)}
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 mb-6">
                                    <Mail size={14} />
                                    <span>{user.email}</span>
                                </div>
                                
                                <div className="w-full pt-6 border-t border-border flex flex-col gap-3">
                                    <div className="flex justify-between items-center text-sm px-2">
                                        <span className="text-muted-foreground">Member Since</span>
                                        <span className="font-medium text-foreground">{format(parseISO(user.created_at), 'MMM yyyy')}</span>
                                    </div>
                                    <Link 
                                        href={logout()} 
                                        method="post" 
                                        as="button" 
                                        className="mt-2 w-full py-3 flex items-center justify-center gap-2 bg-destructive/5 text-destructive rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-destructive/15 transition-colors"
                                    >
                                        <LogOut size={16} /> Log Out
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Notifications Card */}
                        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                            <div className="p-5 border-b border-border flex items-center gap-2 bg-muted/30">
                                <Bell size={18} className="text-primary" />
                                <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">Notifications</h3>
                            </div>
                            
                            <div className="divide-y divide-border">
                                {notifications.length > 0 ? (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className="p-5 flex gap-4 hover:bg-muted/30 transition-colors">
                                            {/* Icon Indicator */}
                                            <div className={`mt-1 p-2 rounded-full flex-shrink-0 h-fit ${
                                                notif.type === 'warning' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                                                notif.type === 'success' ? 'bg-primary/10 text-primary' :
                                                'bg-blue-500/10 text-blue-500'
                                            }`}>
                                                {notif.type === 'warning' && <AlertTriangle size={16} />}
                                                {notif.type === 'success' && <CheckCircle size={16} />}
                                                {notif.type === 'info' && <Info size={16} />}
                                            </div>
                                            
                                            {/* Content */}
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground mb-1">{notif.title}</h4>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                                                {notif.created_at && (
                                                    <span className="text-[10px] text-muted-foreground/50 mt-2 block">
                                                        {getRelativeTime(notif.created_at)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-3">
                                        <div className="p-3 bg-muted rounded-full opacity-50"><Bell size={20} /></div>
                                        <p>You're all caught up!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT MAIN (Reservation History) --- */}
                    <div className="lg:col-span-8">
                        <div className="flex items-end justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">My Reservations</h1>
                                <p className="text-muted-foreground mt-1">Manage your upcoming and past stays.</p>
                            </div>
                            <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs text-center font-bold uppercase tracking-wider border border-primary/20">
                                {reservations.length} Bookings
                            </span>
                        </div>

                        <div className="space-y-6">
                            {reservations.length > 0 ? (
                                reservations.map((res) => {
                                    const statusConfig = getStatusConfig(res.status);
                                    
                                    return (
                                        <div key={res.id} className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
                                            <div className="flex flex-col md:flex-row">
                                                
                                                {/* Image Section */}
                                                <div className="w-full md:w-5/12 h-56 md:h-auto relative overflow-hidden bg-muted">
                                                    <img 
                                                        src={getRoomImage(res.room.img_url)} 
                                                        alt={res.room.room_name} 
                                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                                                    />
                                                    
                                                    {/* Floating Status Badge */}
                                                    <div className="absolute top-4 left-4 backdrop-blur-md bg-card/90 rounded-full pl-1 pr-3 py-1 flex items-center gap-2 shadow-sm border border-border">
                                                        <div className={`p-1 rounded-full ${statusConfig.style.split(' ')[0]} ${statusConfig.style.split(' ')[1]}`}>
                                                            {statusConfig.icon}
                                                        </div>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                                                            {statusConfig.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Details Section */}
                                                <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 block">
                                                                {res.room.room_category?.room_category || 'Standard Room'}
                                                            </span>
                                                            <h3 className="text-xl font-bold text-foreground">{res.room.room_name}</h3>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xl font-bold text-primary">{formatCurrency(res.reservation_amount)}</div>
                                                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Paid</span>
                                                        </div>
                                                    </div>

                                                    {/* Dates Grid */}
                                                    <div className="flex gap-4 p-4 bg-muted/30 rounded-2xl border border-border mb-6">
                                                        <div className="flex-1">
                                                            <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Check-in</span>
                                                            <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                                                                <Calendar size={14} className="text-primary" />
                                                                {format(parseISO(res.check_in_date), 'MMM dd, yyyy')}
                                                            </div>
                                                            <span className="text-xs text-muted-foreground pl-6">{format(parseISO(res.check_in_date), 'h:mm a')}</span>
                                                        </div>
                                                        <div className="w-px bg-border"></div>
                                                        <div className="flex-1">
                                                            <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Check-out</span>
                                                            <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                                                                <LogOut size={14} className="text-muted-foreground" />
                                                                {format(parseISO(res.check_out_date), 'MMM dd, yyyy')}
                                                            </div>
                                                            <span className="text-xs text-muted-foreground pl-6">{format(parseISO(res.check_out_date), 'h:mm a')}</span>
                                                        </div>
                                                    </div>

                                                    {/* Services Pill List */}
                                                    {res.services.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mb-6">
                                                            {res.services.map(svc => (
                                                                <span key={svc.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/10 text-secondary-foreground text-xs rounded-lg font-medium border border-secondary/20">
                                                                        <Sparkles size={10} />
                                                                        <span><span className="font-bold">{svc.pivot.quantity}x</span> {svc.services_name}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Footer Actions */}
                                                    <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground" title={format(parseISO(res.created_at), 'PPP pp')}>
                                                            <CreditCard size={14} /> 
                                                            <span>Booked {getRelativeTime(res.created_at)}</span>
                                                        </div>

                                                        {['pending', 'confirmed'].includes(res.status.toLowerCase()) && (
                                                            <button 
                                                                onClick={() => handleCancel(res.id)}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-destructive/10 text-destructive rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-destructive hover:text-white transition-all duration-300 border border-destructive/20 hover:border-destructive"
                                                            >
                                                                <Trash2 size={14} /> Cancel
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border-2 border-dashed border-border text-center">
                                    <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6 text-muted-foreground">
                                        <BedDouble size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">No Reservations Yet</h3>
                                    <p className="text-muted-foreground max-w-sm mt-2 mb-8">
                                        You haven't booked any stays with us yet. Start your journey by finding the perfect room.
                                    </p>
                                    <Link 
                                        href={guest.guestpage.url()}
                                        className="px-8 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-primary/90 transition shadow-lg shadow-primary/20 flex items-center gap-2"
                                    >
                                        Find a Room <ChevronRight size={16} />
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