import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Search, Filter, Clock, MapPin, LogIn, Users } from 'lucide-react';
import { format, parseISO, isToday } from 'date-fns';

// Import both modals
import { CheckinReservation } from './modals/CheckinReservation';
import { TransactionModal } from './modals/TransactionModal';
import checkin from '@/routes/checkin';

interface Reservation {
    id: string;
    guest_name: string;
    room_name: string;
    category: string;
    total_guest: number;
    check_in_date: string;
    check_out_date: string;
    status: string;
    amount: number;
    services?: any[];
}

interface Props { reservations: Reservation[]; }

export default function CheckinPage({ reservations }: Props) {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

    // UI States for Multi-step process
    const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
    const [showCheckin, setShowCheckin] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [processing, setProcessing] = useState(false);

    const todayArrivalsCount = reservations.filter(r => isToday(parseISO(r.check_in_date))).length;

    const filteredReservations = reservations
        .filter(res =>
            res.guest_name.toLowerCase().includes(search.toLowerCase()) ||
            res.room_name.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => sortBy === 'date'
            ? new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime()
            : a.guest_name.localeCompare(b.guest_name)
        );

    // Step 1: Triggered when "Check In" button is clicked in the list
    const openCheckinFlow = (res: Reservation) => {
        setSelectedRes(res);
        setShowCheckin(true);
    };

    // Step 2: Transition from Folio to Payment
    const handleConfirmFolio = () => {
        setShowCheckin(false);
        // Small delay to allow the first modal to close smoothly before opening the second
        setTimeout(() => setShowPayment(true), 200);
    };

    // Step 3: Final Backend Submission
    const handleFinalProcess = (paymentAmount: number, paymentMethod: string) => {
        if (!selectedRes) return;

        setProcessing(true);

        router.post(checkin.store.url(), {
            reservation_id: selectedRes.id,
            payment_amount: paymentAmount,
            payment_method: paymentMethod // FIX: Added this to resolve the 422 error
        }, {
            onSuccess: () => {
                setShowPayment(false);
                setSelectedRes(null);
            },
            onError: (errors) => {
                console.error(errors);
            },
            onFinish: () => setProcessing(false)
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Check-in', href: '/checkin' }]}>
            <Head title="Check-in Management" />
            <div className="min-h-screen bg-background text-foreground pb-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Header Stats */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-serif font-bold">Check-in Desk</h1>
                            <p className="text-sm text-muted-foreground">Manage arriving guests and room assignments.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-card px-5 py-3 rounded-xl border border-border shadow-sm flex items-center gap-4">
                                <div className="p-2.5 bg-accent/20 rounded-lg text-accent-foreground"><LogIn size={20} /></div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Today's Arrivals</p>
                                    <p className="text-2xl font-serif font-bold">{todayArrivalsCount}</p>
                                </div>
                            </div>
                            <div className="bg-card px-5 py-3 rounded-xl border border-border shadow-sm flex items-center gap-4">
                                <div className="p-2.5 bg-primary/20 rounded-lg text-primary"><Users size={20} /></div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Pending</p>
                                    <p className="text-2xl font-serif font-bold">{reservations.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search & Sort */}
                    <div className="bg-card p-4 rounded-2xl border border-border mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search guests..."
                                className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
                                className="bg-muted/50 border border-input text-sm rounded-lg px-3 py-2 outline-none"
                            >
                                <option value="date">Sort by Time</option>
                                <option value="name">Sort by Name</option>
                            </select>
                            <button className="p-2 border border-input rounded-lg hover:bg-muted text-muted-foreground"><Filter size={18} /></button>
                        </div>
                    </div>

                    {/* Reservation List */}
                    <div className="grid gap-4">
                        {filteredReservations.map((res) => (
                            <div key={res.id} className="group bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${res.status.toLowerCase() === 'confirmed' ? 'bg-primary' : 'bg-accent'}`} />
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pl-3">
                                    <div className="flex items-center gap-4 min-w-[250px]">
                                        <div className="h-12 w-12 rounded-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                            {res.guest_name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{res.guest_name}</h3>
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{res.category} • {res.total_guest} Guests</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-8 flex-1 text-sm">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-primary" />
                                            <div><p className="font-bold">{res.room_name}</p><p className="text-[10px] text-muted-foreground uppercase">Unit</p></div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-primary" />
                                            <div>
                                                <p className="font-bold">{format(parseISO(res.check_in_date), 'p')}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">
                                                    {isToday(parseISO(res.check_in_date)) ? 'Arriving Today' : format(parseISO(res.check_in_date), 'MMM d')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${res.status.toLowerCase() === 'confirmed' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent/20 text-accent-foreground border-accent/20'}`}>
                                            {res.status}
                                        </span>
                                        <button
                                            onClick={() => openCheckinFlow(res)}
                                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-lg text-sm font-bold shadow-md flex items-center gap-2 active:scale-95"
                                        >
                                            <LogIn size={16} /> Check In
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODALS SECTION */}

            {/* Step 1: Check-in Folio */}
            <CheckinReservation
                isOpen={showCheckin}
                reservation={selectedRes}
                onConfirm={handleConfirmFolio}
                onClose={() => setShowCheckin(false)}
                processing={processing}
            />

            {/* Step 2: Payment Processing */}
            <TransactionModal
                isOpen={showPayment}
                reservation={selectedRes}
                onProcess={handleFinalProcess}
                onClose={() => setShowPayment(false)}
                processing={processing}
            />
        </AppLayout>
    );
}