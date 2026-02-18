import { Head, Link, router, useForm } from '@inertiajs/react';
import { 
    Calendar, LogOut, Bell, Clock, CheckCircle, XCircle, 
    BedDouble, CreditCard, Sparkles, ArrowLeft, Trash2, 
    AlertTriangle, Info, Mail, Sun, Moon, 
    Settings, User, Lock, Save, X, Eye, EyeOff, ShieldCheck, QrCode, ChevronRight
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns'; 
import { logout } from '@/routes'; 
import guest from '@/routes/guest';
import { useState, useEffect, FormEventHandler } from 'react';
import axios from 'axios'; // Standard in Laravel stacks

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
        two_factor_enabled: boolean; // Added for 2FA check
    };
}

export default function GuestReservationPage({ reservations, notifications, user }: Props) {
    // --- STATE ---
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    
    // Password Visibility
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // 2FA State
    const [enabling2FA, setEnabling2FA] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [confirming2FA, setConfirming2FA] = useState(false);
    
    // 2FA Confirmation Form
    const confirmationForm = useForm({
        code: '',
    });

    // --- THEME EFFECT ---
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

    // --- FORM 1: PROFILE INFORMATION ---
    const profileForm = useForm({
        name: user.name,
        email: user.email,
    });

    const submitProfile: FormEventHandler = (e) => {
        e.preventDefault();
        profileForm.patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    // --- FORM 2: UPDATE PASSWORD ---
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
            onError: () => {
                if (passwordForm.errors.password) passwordForm.reset('password', 'password_confirmation');
                if (passwordForm.errors.current_password) passwordForm.reset('current_password');
            },
        });
    };

    // --- 2FA LOGIC ---
    const enableTwoFactorAuthentication = () => {
        setEnabling2FA(true);
        // 1. Post to enable endpoint
        router.post(route('two-factor.enable'), {}, {
            preserveScroll: true,
            onSuccess: () => {
                // 2. Fetch QR Code and Recovery Codes concurrently using Axios
                Promise.all([
                    axios.get(route('two-factor.qr-code')),
                    axios.get(route('two-factor.recovery-codes'))
                ]).then(([qrResponse, recoveryResponse]) => {
                    setQrCode(qrResponse.data.svg);
                    setRecoveryCodes(recoveryResponse.data);
                    setConfirming2FA(true); // User needs to scan and confirm
                }).catch(error => {
                    console.error("Failed to fetch 2FA data", error);
                    setEnabling2FA(false);
                });
            },
            onError: () => setEnabling2FA(false)
        });
    };

    const confirmTwoFactorAuthentication: FormEventHandler = (e) => {
        e.preventDefault();
        // 3. Confirm with the code the user typed
        confirmationForm.post(route('two-factor.confirm'), {
            errorBag: "confirmTwoFactorAuthentication",
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setConfirming2FA(false);
                setEnabling2FA(false);
                setQrCode(null);
            },
        });
    };

    const disableTwoFactorAuthentication = () => {
        if(confirm("Are you sure you want to disable Two-Factor Authentication?")) {
            router.delete(route('two-factor.disable'), {
                preserveScroll: true,
            });
        }
    };

    const regenerateRecoveryCodes = () => {
        axios.post(route('two-factor.recovery-codes'))
            .then(() => axios.get(route('two-factor.recovery-codes')))
            .then(response => setRecoveryCodes(response.data));
    };

    // --- HELPERS ---
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(amount);
    const getRoomImage = (url: string | null) => (!url ? '/img/room1.jpg' : (url.startsWith('http') ? url : `/storage/${url}`));
    const getRelativeTime = (dateString: string) => { try { return formatDistanceToNow(parseISO(dateString), { addSuffix: true }); } catch { return 'recently'; } };
    const getStatusConfig = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed': return { style: 'bg-primary/10 text-primary border-primary/20', icon: <CheckCircle size={14} />, label: 'Confirmed' };
            case 'pending': return { style: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400 dark:border-yellow-400/20', icon: <Clock size={14} />, label: 'Pending Approval' };
            case 'cancelled': return { style: 'bg-destructive/10 text-destructive border-destructive/20', icon: <XCircle size={14} />, label: 'Cancelled' };
            case 'checked-in': case 'checked_in': return { style: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400', icon: <Sparkles size={14} />, label: 'Checked In' };
            case 'checked-out': case 'checked_out': return { style: 'bg-gray-500/10 text-gray-600 border-gray-500/20 dark:text-gray-400', icon: <LogOut size={14} />, label: 'Completed' };
            default: return { style: 'bg-muted text-muted-foreground border-border', icon: <Clock size={14} />, label: status };
        }
    };
    const handleCancel = (id: number) => { if (confirm('Are you sure you want to cancel this reservation? This action cannot be undone.')) router.post(`/reservation/cancel/${id}`, {}, { preserveScroll: true }); };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
            <Head title="My Reservations" />

            {/* --- NAVIGATION --- */}
            <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border transition-all">
                <div className="px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
                    <Link href={guest.guestpage.url()} className="flex items-center gap-2 group text-muted-foreground hover:text-primary transition-colors">
                        <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider hidden sm:block">Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-secondary/20 transition-all focus:outline-none">
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <div className="h-6 w-px bg-border hidden sm:block"></div>
                        <span className="text-lg font-serif font-bold tracking-tight text-foreground hidden sm:block">Estaca Bay</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* --- LEFT SIDEBAR --- */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden relative group">
                            <div className="absolute top-0 left-0 w-full h-32 bg-[#2C3930] dark:bg-[#1a221d]" />
                            <button onClick={() => setIsProfileModalOpen(true)} className="absolute top-4 right-4 z-20 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-all shadow-lg" title="Account Settings"><Settings size={18} /></button>
                            <div className="relative z-10 flex flex-col items-center text-center mt-16 px-6 pb-8">
                                <div className="w-24 h-24 bg-card rounded-full p-1.5 shadow-lg mb-4 ring-4 ring-card">
                                    <div className="w-full h-full bg-[#D8E983] text-[#2C3930] rounded-full flex items-center justify-center text-3xl font-serif font-bold uppercase">{user.name.charAt(0)}</div>
                                </div>
                                <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 mb-6"><Mail size={14} /> <span>{user.email}</span></div>
                                <div className="w-full pt-6 border-t border-border flex flex-col gap-3">
                                    <div className="flex justify-between items-center text-sm px-2"><span className="text-muted-foreground">Member Since</span><span className="font-medium text-foreground">{format(parseISO(user.created_at), 'MMM yyyy')}</span></div>
                                    <Link href={logout()} method="post" as="button" className="mt-2 w-full py-3 flex items-center justify-center gap-2 bg-destructive/5 text-destructive rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-destructive/15 transition-colors"><LogOut size={16} /> Log Out</Link>
                                </div>
                            </div>
                        </div>
                        {/* Notifications */}
                        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                            <div className="p-5 border-b border-border flex items-center gap-2 bg-muted/30"><Bell size={18} className="text-primary" /><h3 className="font-bold text-sm uppercase tracking-wide text-foreground">Notifications</h3></div>
                            <div className="divide-y divide-border">
                                {notifications.length > 0 ? (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className="p-5 flex gap-4 hover:bg-muted/30 transition-colors">
                                            <div className={`mt-1 p-2 rounded-full flex-shrink-0 h-fit ${notif.type === 'warning' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' : notif.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'}`}>
                                                {notif.type === 'warning' ? <AlertTriangle size={16} /> : notif.type === 'success' ? <CheckCircle size={16} /> : <Info size={16} />}
                                            </div>
                                            <div><h4 className="text-sm font-bold text-foreground mb-1">{notif.title}</h4><p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>{notif.created_at && <span className="text-[10px] text-muted-foreground/50 mt-2 block">{getRelativeTime(notif.created_at)}</span>}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-3"><div className="p-3 bg-muted rounded-full opacity-50"><Bell size={20} /></div><p>You're all caught up!</p></div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* --- RESERVATIONS LIST --- */}
                    <div className="lg:col-span-8">
                        <div className="flex items-end justify-between mb-8">
                            <div><h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">My Reservations</h1><p className="text-muted-foreground mt-1">Manage your upcoming and past stays.</p></div>
                            <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs text-center font-bold uppercase tracking-wider border border-primary/20">{reservations.length} Bookings</span>
                        </div>
                        <div className="space-y-6">
                            {reservations.length > 0 ? reservations.map((res) => {
                                const statusConfig = getStatusConfig(res.status);
                                return (
                                    <div key={res.id} className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
                                        <div className="flex flex-col md:flex-row">
                                            <div className="w-full md:w-5/12 h-56 md:h-auto relative overflow-hidden bg-muted">
                                                <img src={getRoomImage(res.room.img_url)} alt={res.room.room_name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                                                <div className="absolute top-4 left-4 backdrop-blur-md bg-card/90 rounded-full pl-1 pr-3 py-1 flex items-center gap-2 shadow-sm border border-border"><div className={`p-1 rounded-full ${statusConfig.style.split(' ')[0]} ${statusConfig.style.split(' ')[1]}`}>{statusConfig.icon}</div><span className="text-[10px] font-bold uppercase tracking-wider text-foreground">{statusConfig.label}</span></div>
                                            </div>
                                            <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div><span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 block">{res.room.room_category?.room_category || 'Standard Room'}</span><h3 className="text-xl font-bold text-foreground">{res.room.room_name}</h3></div>
                                                    <div className="text-right"><div className="text-xl font-bold text-primary">{formatCurrency(res.reservation_amount)}</div><span className="text-[10px] text-muted-foreground uppercase font-bold">Total Paid</span></div>
                                                </div>
                                                <div className="flex gap-4 p-4 bg-muted/30 rounded-2xl border border-border mb-6">
                                                    <div className="flex-1"><span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Check-in</span><div className="font-semibold text-foreground text-sm flex items-center gap-2"><Calendar size={14} className="text-primary" />{format(parseISO(res.check_in_date), 'MMM dd, yyyy')}</div></div><div className="w-px bg-border"></div>
                                                    <div className="flex-1"><span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Check-out</span><div className="font-semibold text-foreground text-sm flex items-center gap-2"><LogOut size={14} className="text-muted-foreground" />{format(parseISO(res.check_out_date), 'MMM dd, yyyy')}</div></div>
                                                </div>
                                                {res.services.length > 0 && <div className="flex flex-wrap gap-2 mb-6">{res.services.map(svc => (<span key={svc.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/10 text-secondary-foreground text-xs rounded-lg font-medium border border-secondary/20"><Sparkles size={10} /> <span><span className="font-bold">{svc.pivot.quantity}x</span> {svc.services_name}</span></span>))}</div>}
                                                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><CreditCard size={14} /> <span>Booked {getRelativeTime(res.created_at)}</span></div>
                                                    {['pending', 'confirmed'].includes(res.status.toLowerCase()) && <button onClick={() => handleCancel(res.id)} className="flex items-center gap-1.5 px-4 py-2 bg-destructive/10 text-destructive rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-destructive hover:text-white transition-all duration-300 border border-destructive/20 hover:border-destructive"><Trash2 size={14} /> Cancel</button>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border-2 border-dashed border-border text-center"><div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6 text-muted-foreground"><BedDouble size={40} /></div><h3 className="text-xl font-bold text-foreground">No Reservations Yet</h3><p className="text-muted-foreground max-w-sm mt-2 mb-8">You haven't booked any stays with us yet.</p><Link href={guest.guestpage.url()} className="px-8 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-primary/90 transition shadow-lg shadow-primary/20 flex items-center gap-2">Find a Room <ChevronRight size={16} /></Link></div>}
                        </div>
                    </div>
                </div>
            </main>

            {/* --- PROFILE MODAL --- */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                            <h2 className="text-xl font-serif font-bold text-foreground">Account Settings</h2>
                            <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"><X size={20} /></button>
                        </div>
                        
                        <div className="overflow-y-auto p-6 space-y-8">
                            
                            {/* 1. Profile Information */}
                            <section className="space-y-4">
                                <div><h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2"><User size={16} /> Profile Information</h3><p className="text-xs text-muted-foreground mt-1">Update your account's profile information and email address.</p></div>
                                <form onSubmit={submitProfile} className="space-y-4">
                                    <div className="space-y-1">
                                        <label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground">Name</label>
                                        <input id="name" type="text" className="w-full p-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm" value={profileForm.data.name} onChange={(e) => profileForm.setData('name', e.target.value)} required />
                                        {profileForm.errors.name && <p className="text-xs text-destructive mt-1">{profileForm.errors.name}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">Email</label>
                                        <input id="email" type="email" className="w-full p-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm" value={profileForm.data.email} onChange={(e) => profileForm.setData('email', e.target.value)} required />
                                        {profileForm.errors.email && <p className="text-xs text-destructive mt-1">{profileForm.errors.email}</p>}
                                    </div>
                                    <div className="flex items-center justify-end gap-4 pt-2">
                                        {profileForm.recentlySuccessful && <span className="text-xs text-green-600 font-bold animate-pulse">Saved.</span>}
                                        <button type="submit" disabled={profileForm.processing} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"><Save size={14} /> Save Profile</button>
                                    </div>
                                </form>
                            </section>

                            <div className="h-px bg-border w-full"></div>

                            {/* 2. Update Password */}
                            <section className="space-y-4">
                                <div><h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2"><Lock size={16} /> Update Password</h3><p className="text-xs text-muted-foreground mt-1">Ensure your account is using a long, random password to stay secure.</p></div>
                                <form onSubmit={submitPassword} className="space-y-4">
                                    <div className="space-y-1 relative">
                                        <label htmlFor="current_password" className="text-xs font-bold uppercase text-muted-foreground">Current Password</label>
                                        <div className="relative">
                                            <input id="current_password" type={showCurrentPassword ? "text" : "password"} className="w-full p-3 pr-10 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm" value={passwordForm.data.current_password} onChange={(e) => passwordForm.setData('current_password', e.target.value)} />
                                            <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">{showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                        </div>
                                        {passwordForm.errors.current_password && <p className="text-xs text-destructive mt-1">{passwordForm.errors.current_password}</p>}
                                    </div>
                                    <div className="space-y-1 relative">
                                        <label htmlFor="password" className="text-xs font-bold uppercase text-muted-foreground">New Password</label>
                                        <div className="relative">
                                            <input id="password" type={showNewPassword ? "text" : "password"} className="w-full p-3 pr-10 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm" value={passwordForm.data.password} onChange={(e) => passwordForm.setData('password', e.target.value)} />
                                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">{showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                        </div>
                                        {passwordForm.errors.password && <p className="text-xs text-destructive mt-1">{passwordForm.errors.password}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label htmlFor="password_confirmation" className="text-xs font-bold uppercase text-muted-foreground">Confirm Password</label>
                                        <input id="password_confirmation" type="password" className="w-full p-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm" value={passwordForm.data.password_confirmation} onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)} />
                                    </div>
                                    <div className="flex items-center justify-end gap-4 pt-2">
                                        {passwordForm.recentlySuccessful && <span className="text-xs text-green-600 font-bold animate-pulse">Saved.</span>}
                                        <button type="submit" disabled={passwordForm.processing} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"><Save size={14} /> Update Password</button>
                                    </div>
                                </form>
                            </section>

                            <div className="h-px bg-border w-full"></div>

                            {/* 3. Two-Factor Authentication */}
                            <section className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                        <ShieldCheck size={16} /> Two-Factor Authentication
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">Add additional security to your account using two-factor authentication.</p>
                                </div>

                                <div className="p-5 bg-muted/30 rounded-2xl border border-border">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${user.two_factor_enabled ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                                            Status: {user.two_factor_enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>

                                    {!user.two_factor_enabled ? (
                                        // --- ENABLE FLOW ---
                                        <div>
                                            {!confirming2FA ? (
                                                <button 
                                                    onClick={enableTwoFactorAuthentication} 
                                                    disabled={enabling2FA}
                                                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all"
                                                >
                                                    Enable 2FA
                                                </button>
                                            ) : (
                                                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="text-sm text-foreground font-medium">
                                                        Finish enabling two-factor authentication.
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        When two-factor authentication is enabled, you will be prompted for a secure, random token during authentication. You may retrieve this token from your phone's Google Authenticator application.
                                                    </p>
                                                    
                                                    {/* QR Code */}
                                                    <div className="p-4 bg-white rounded-xl inline-block" dangerouslySetInnerHTML={{ __html: qrCode || '' }} />

                                                    <form onSubmit={confirmTwoFactorAuthentication} className="space-y-3">
                                                        <label htmlFor="code" className="text-xs font-bold uppercase text-muted-foreground block">Code</label>
                                                        <input
                                                            id="code"
                                                            type="text"
                                                            inputMode="numeric"
                                                            className="w-full max-w-[200px] p-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm font-mono tracking-widest text-center"
                                                            value={confirmationForm.data.code}
                                                            onChange={(e) => confirmationForm.setData('code', e.target.value)}
                                                            placeholder="XXX-XXX"
                                                        />
                                                        {confirmationForm.errors.code && <p className="text-xs text-destructive">{confirmationForm.errors.code}</p>}
                                                        
                                                        <div className="flex gap-2">
                                                            <button 
                                                                type="submit" 
                                                                disabled={confirmationForm.processing}
                                                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all"
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => { setConfirming2FA(false); setEnabling2FA(false); }}
                                                                className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-muted/80 transition-all"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // --- MANAGED FLOW (Already Enabled) ---
                                        <div className="space-y-4">
                                            <p className="text-xs text-muted-foreground">
                                                Two-factor authentication is enabled. Scan the following QR code using your phone's authenticator application.
                                            </p>
                                            
                                            {/* Logic to Show QR/Recovery Codes on demand could be added here if needed, 
                                                but usually we just show the disable button once confirmed. */}
                                            
                                            {recoveryCodes.length > 0 && (
                                                <div className="p-4 bg-background rounded-xl border border-border">
                                                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Recovery Codes</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {recoveryCodes.map(code => (
                                                            <div key={code} className="text-xs font-mono bg-muted/50 p-1 rounded text-center">{code}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-2">
                                                {recoveryCodes.length === 0 && (
                                                    <button 
                                                        onClick={regenerateRecoveryCodes}
                                                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-secondary/80 transition-all"
                                                    >
                                                        Show Recovery Codes
                                                    </button>
                                                )}
                                                
                                                <button 
                                                    onClick={disableTwoFactorAuthentication}
                                                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-destructive/90 transition-all"
                                                >
                                                    Disable 2FA
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}