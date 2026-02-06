import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import reservationRoute from '@/routes/reservation';
import servicesRoute from '@/routes/services';
import { BreadcrumbItem } from '@/types';
import { Room } from '@/types/Rooms';
import { Head, Link, router } from '@inertiajs/react';
import { 
    CheckCircle, 
    Clock, 
    Edit, 
    Search, 
    Trash2, 
    User, 
    XCircle, 
    RefreshCw, 
    Power, 
    PowerOff,
    Calendar,
    Filter,
    FileText,
    TrendingUp,
    LogIn,
    LogOut,
    AlertCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import AddReservation, { Service } from './modal/AddReservation';
import UpdateReservation from './modal/UpdateReservation';

export interface Reservation {
    id: string; // Changed to string to support ULIDs
    room_id: number;
    guest_name: string;
    contact_number: string;
    total_guest: number;
    check_in_date: string;
    check_out_date: string;
    status: string;
    reservation_amount: number;
    room?: Room;
    services?: {
        id: number;
        services_name: string;
        pivot: { quantity: number; price: number; }
    }[];
}

interface Props {
    rooms: Room[];
    services: Service[];
    reservations: Reservation[];
    stats: {
        total_revenue: number;
        arrivals_today: number;
        departures_today: number;
        pending_count: number;
    };
    filters?: { search?: string };
}

export default function ReservationPage({ rooms, services, reservations, stats, filters }: Props) {
    const [isShowingAddModal, setIsShowingAddModal] = useState(false);
    const [isShowingUpdateModal, setIsShowingUpdateModal] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    
    // --- AUTO-UPDATE & POLLING ---
    const [isAutoUpdateEnabled, setIsAutoUpdateEnabled] = useState(true);
    const [isPolling, setIsPolling] = useState(false);

    const manualRefresh = () => {
        setIsPolling(true);
        router.reload({
            only: ['reservations', 'rooms', 'stats'],
            preserveScroll: true,
            onFinish: () => setIsPolling(false),
        });
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAutoUpdateEnabled && !isShowingAddModal && !isShowingUpdateModal) {
            interval = setInterval(() => {
                setIsPolling(true);
                router.reload({
                    only: ['reservations', 'rooms', 'stats'],
                    preserveScroll: true,
                    preserveState: true,
                    onFinish: () => setIsPolling(false),
                });
            }, 5000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isAutoUpdateEnabled, isShowingAddModal, isShowingUpdateModal]);

    // --- SEARCH LOGIC ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                router.get(
                    reservationRoute.index.url(),
                    { search: searchQuery },
                    { preserveState: true, replace: true }
                );
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // --- HANDLERS ---
    const handleEditClick = (res: Reservation) => {
        setSelectedReservation(res);
        setIsShowingUpdateModal(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this reservation?')) {
            router.delete(reservationRoute.destroy.url(id));
        }
    };

    const getStatusBadge = (status: string) => {
        const lowerStatus = status.toLowerCase();
        const styles = {
            confirmed: "bg-primary/10 text-primary border-primary/20",
            pending: "bg-accent/20 text-accent-foreground border-accent/20",
            cancelled: "bg-destructive/10 text-destructive border-destructive/20",
            'checked-in': "bg-blue-500/10 text-blue-600 border-blue-200",
        };
        const style = styles[lowerStatus as keyof typeof styles] || "bg-muted text-muted-foreground border-border";
        
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style}`}>
                {lowerStatus === 'confirmed' && <CheckCircle className="hidden xs:block size-3" />}
                {lowerStatus === 'pending' && <Clock className="hidden xs:block size-3" />}
                <span className="whitespace-nowrap">{status}</span>
            </span>
        );
    };

    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Manage Reservations', href: reservationRoute.index.url() }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Manage Reservations' />
            
            <div className="min-h-screen bg-background text-foreground pb-10 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                    
                    {/* --- HEADER --- */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                        <div className="text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Reservations</h1>
                            <p className="text-sm text-muted-foreground mt-1 tracking-tight">Overview of property bookings and real-time activity.</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:gap-3">
                            <Link href={servicesRoute.index.url()} className="w-full sm:w-auto">
                                <Button variant="outline" className="w-full border-border text-muted-foreground hover:text-foreground">
                                    Manage Services
                                </Button>
                            </Link>
                            <Button 
                                onClick={() => setIsShowingAddModal(true)} 
                                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-md flex items-center justify-center gap-2"
                            >
                                <Calendar size={16} />
                                New Booking
                            </Button>
                        </div>
                    </div>

                    {/* --- ANALYTICS SECTION --- */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary"><TrendingUp size={20} /></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Est. Revenue</span>
                            </div>
                            <p className="text-2xl font-serif font-bold">₱{(stats?.total_revenue || 0).toLocaleString()}</p>
                        </div>

                        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-accent/20 rounded-lg text-accent-foreground"><LogIn size={20} /></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Arrivals Today</span>
                            </div>
                            <p className="text-2xl font-serif font-bold">{stats?.arrivals_today || 0}</p>
                        </div>

                        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-destructive/10 rounded-lg text-destructive"><LogOut size={20} /></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Departures</span>
                            </div>
                            <p className="text-2xl font-serif font-bold">{stats?.departures_today || 0}</p>
                        </div>

                        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-600"><AlertCircle size={20} /></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pending</span>
                            </div>
                            <p className="text-2xl font-serif font-bold">{stats?.pending_count || 0}</p>
                        </div>
                    </div>

                    {/* --- CONTROLS & SEARCH --- */}
                    <div className="bg-card p-3 md:p-4 rounded-2xl shadow-sm border border-border mb-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                                <div className="relative w-full sm:w-64 md:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search guests..."
                                        className="pl-10 bg-muted/50 border-input focus:ring-ring w-full"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Button 
                                        variant={isAutoUpdateEnabled ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setIsAutoUpdateEnabled(!isAutoUpdateEnabled)}
                                        className={`flex-1 sm:flex-none gap-2 transition-all h-10 ${isAutoUpdateEnabled ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                                    >
                                        {isAutoUpdateEnabled ? <Power className="size-4" /> : <PowerOff className="size-4" />}
                                        <span className="font-bold uppercase text-[10px] tracking-widest">
                                            {isAutoUpdateEnabled ? 'Auto-Sync' : 'Manual'}
                                        </span>
                                    </Button>

                                    {!isAutoUpdateEnabled && (
                                        <Button variant="ghost" size="icon" onClick={manualRefresh} disabled={isPolling} className="text-muted-foreground h-10 w-10 border border-transparent hover:border-border">
                                            <RefreshCw className={`size-4 ${isPolling ? 'animate-spin' : ''}`} />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
                                {isPolling && (
                                    <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-primary animate-pulse tracking-widest">
                                        <RefreshCw className="size-3 animate-spin" /> Syncing
                                    </span>
                                )}
                                <Button variant="outline" size="icon" className="border-border text-muted-foreground h-10 w-10">
                                    <Filter size={18} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* --- TABLE CARD --- */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[800px]">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-4 md:px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Guest & Room</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Schedule</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Status</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px] text-right">Total</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {reservations.length > 0 ? (
                                        reservations.map((res) => (
                                            <tr key={res.id} className="hover:bg-accent/5 transition-colors group">
                                                <td className="px-4 md:px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="hidden xs:flex h-10 w-10 rounded-full bg-primary/10 items-center justify-center text-primary font-serif font-bold text-sm shrink-0 uppercase">
                                                            {res.guest_name.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-foreground truncate">{res.guest_name}</div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <span className="font-medium text-primary">{res.room?.room_name || 'N/A'}</span>
                                                                <span className="text-border">•</span>
                                                                <span>{res.total_guest} Guests</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4">
                                                    <div className="flex flex-col gap-1 text-[11px] whitespace-nowrap">
                                                        <div className="flex items-center gap-2 text-foreground">
                                                            <span className="font-bold w-7 text-muted-foreground uppercase text-[9px]">In</span>
                                                            {format(parseISO(res.check_in_date), 'MMM dd, h:mm a')}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-foreground">
                                                            <span className="font-bold w-7 text-destructive/70 uppercase text-[9px]">Out</span>
                                                            {format(parseISO(res.check_out_date), 'MMM dd, h:mm a')}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4">
                                                    {getStatusBadge(res.status)}
                                                </td>
                                                <td className="px-4 md:px-6 py-4 text-right">
                                                    <span className="font-serif font-bold text-foreground text-sm md:text-base">
                                                        ₱{(Number(res.reservation_amount) || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 md:px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(res)} className="text-primary hover:bg-primary/10 h-8 w-8">
                                                            <Edit size={14} />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(res.id)} className="text-destructive hover:bg-destructive/10 h-8 w-8">
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <FileText size={40} className="mb-4 opacity-20" />
                                                    <p className="text-sm font-medium tracking-wide">No reservations matching your criteria</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddReservation
                rooms={rooms} services={services}
                isOpen={isShowingAddModal} onClose={() => setIsShowingAddModal(false)}
            />

            {selectedReservation && (
                <UpdateReservation
                    reservation={selectedReservation}
                    rooms={rooms}
                    services={services}
                    isOpen={isShowingUpdateModal}
                    onClose={() => {
                        setIsShowingUpdateModal(false);
                        setSelectedReservation(null);
                    }}
                />
            )}
        </AppLayout>
    );
}