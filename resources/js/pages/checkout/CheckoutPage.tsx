import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Search, Filter, Clock, MapPin, LogOut, Users, Hotel } from 'lucide-react';
import { format, parseISO, isToday } from 'date-fns';
import { CheckoutModal } from './modal/CheckoutModal';
import { Button } from '@/components/ui/button';
import checkout from '@/routes/checkout';

interface Reservation {
    id: string;
    guest_name: string;
    room_name: string;
    category: string;
    total_guest: number;
    check_in_date: string;
    check_out_date: string;
    status: string;
}

interface Props { reservations: Reservation[]; }

export default function CheckoutPage({ reservations }: Props) {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
    
    // UI States
    const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Filter Logic
    const filteredReservations = reservations
        .filter(res => 
            res.guest_name.toLowerCase().includes(search.toLowerCase()) || 
            res.room_name.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => sortBy === 'date' 
            // Sort by earliest checkout time first
            ? new Date(a.check_out_date).getTime() - new Date(b.check_out_date).getTime() 
            : a.guest_name.localeCompare(b.guest_name)
        );

    const todayDepartureCount = reservations.filter(r => isToday(parseISO(r.check_out_date))).length;

    const handleCheckoutSubmit = (remarks: string) => {
        // Guard clause to prevent null error
        if (!selectedRes) return;

        setProcessing(true);
        router.post(checkout.store.url(), { 
            reservation_id: selectedRes.id,
            remarks: remarks 
        }, {
            onSuccess: () => {
                setIsModalOpen(false);
                setSelectedRes(null);
            },
            onFinish: () => setProcessing(false)
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Check-out', href: '/checkout' }]}>
            <Head title="Check-out Management" />
            <div className="min-h-screen bg-background text-foreground pb-10 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    
                    {/* Header Stats - Matches Checkin colors */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-foreground">Departure Desk</h1>
                            <p className="text-sm text-muted-foreground">Manage guest departures and room clearances.</p>
                        </div>
                        <div className="flex gap-4">
                            {/* Card 1: Matches the "Today's Arrivals" style (Accent) */}
                            <div className="bg-card px-5 py-3 rounded-xl border border-border shadow-sm flex items-center gap-4">
                                <div className="p-2.5 bg-accent/20 rounded-lg text-accent-foreground"><LogOut size={20} /></div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Scheduled Today</p>
                                    <p className="text-2xl font-serif font-bold">{todayDepartureCount}</p>
                                </div>
                            </div>
                            {/* Card 2: Matches the "Total Pending" style (Primary) */}
                            <div className="bg-card px-5 py-3 rounded-xl border border-border shadow-sm flex items-center gap-4">
                                <div className="p-2.5 bg-primary/20 rounded-lg text-primary"><Hotel size={20} /></div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total In-House</p>
                                    <p className="text-2xl font-serif font-bold">{reservations.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search & Sort Bar */}
                    <div className="bg-card p-4 rounded-2xl shadow-sm border border-border mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search guest or room..." 
                                className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none" 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)} 
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value as 'date' | 'name')} 
                                className="bg-muted/50 border border-input text-sm rounded-lg px-3 py-2 outline-none focus:ring-ring"
                            >
                                <option value="date">Sort by Time</option>
                                <option value="name">Sort by Name</option>
                            </select>
                            <button className="p-2 border border-input rounded-lg hover:bg-muted text-muted-foreground"><Filter size={18} /></button>
                        </div>
                    </div>

                    {/* Guest List */}
                    <div className="grid gap-4">
                        {filteredReservations.map((res) => (
                            <div key={res.id} className="group bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                {/* Side Strip (Primary color) */}
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                                
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pl-3">
                                    {/* Guest Info */}
                                    <div className="flex items-center gap-4 min-w-[250px]">
                                        <div className="h-12 w-12 rounded-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                            {res.guest_name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{res.guest_name}</h3>
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{res.category}</p>
                                        </div>
                                    </div>

                                    {/* Room & Time Info */}
                                    <div className="flex flex-col sm:flex-row gap-8 flex-1 text-sm">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-primary" /> 
                                            <div>
                                                <p className="font-bold">{res.room_name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Unit Assigned</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-primary" /> 
                                            <div>
                                                <p className="font-bold">{format(parseISO(res.check_out_date), 'p')}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">
                                                    {isToday(parseISO(res.check_out_date)) ? 'Departing Today' : format(parseISO(res.check_out_date), 'MMM d')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex items-center gap-4">
                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-primary/10 text-primary border-primary/20">
                                            {res.status}
                                        </span>
                                        <Button 
                                            onClick={() => { setSelectedRes(res); setIsModalOpen(true); }} 
                                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-lg text-sm font-bold shadow-md flex items-center gap-2 active:scale-95 transition-transform"
                                        >
                                            <LogOut size={16} /> Checkout
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {filteredReservations.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Users className="mx-auto h-12 w-12 opacity-20 mb-4" />
                                <p>No guests found matching your search.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Single Modal for Checkout */}
            <CheckoutModal 
                isOpen={isModalOpen}
                reservation={selectedRes}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleCheckoutSubmit}
                processing={processing}
            />
        </AppLayout>
    );
}