import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { 
    DoorOpen, CalendarDays, ArrowRightLeft, 
    Hammer, RefreshCw, CheckCircle2, XCircle,
    ChevronLeft, ChevronRight, Calendar as CalendarIcon
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer
} from 'recharts';
import { 
    format, parseISO, isSameDay, startOfMonth, endOfMonth, 
    startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
    isToday, addMonths, subMonths, startOfDay
} from 'date-fns';
import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { getCalendarReservations, getReservationsForSpecificDate } from '@/actions/App/Http/Controllers/DashboardController';

interface Props {
    stats: {
        occupancy_rate: number;
        arrivals_today: number;
        departures_today: number;
        maintenance_count: number;
    };
    roomStatus: {
        available: number;
        booked: number;
        occupied: number;
        unavailable: number;
    };
    guestMovements: any[];
    bookingVolume: any[];
    dateRanges?: {
        reservation_traffic: {
            from: string;
            to: string;
            period: string;
        };
        revenue_data: {
            from: string;
            to: string;
            period: string;
        };
    };
}

export default function Dashboard({ stats, roomStatus, guestMovements, bookingVolume, dateRanges }: Props) {
    const totalRooms = roomStatus.available + roomStatus.booked + roomStatus.occupied + roomStatus.unavailable;

    // --- AUTO UPDATE LOGIC ---
    const [isAutoRefresh, setIsAutoRefresh] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    // --- CALENDAR STATE & LOGIC ---
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [calendarReservations, setCalendarReservations] = useState<any[]>([]);
    const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
    
    // NEW: State for specific day details
    const [dayReservations, setDayReservations] = useState<any[]>([]);
    const [isLoadingDay, setIsLoadingDay] = useState(false);

    // Fetch whole month to render indicators on the calendar grid
    const fetchMonthReservations = useCallback(async (date: Date) => {
        setIsLoadingCalendar(true);
        try {
            const start = format(startOfWeek(startOfMonth(date)), 'yyyy-MM-dd');
            const end = format(endOfWeek(endOfMonth(date)), 'yyyy-MM-dd');
            
            // WAYFINDER: Generate the endpoint with your query parameters
            const endpoint = getCalendarReservations({ query: { start, end } });
            
            // Pass the generated { url, method } object directly to axios
            const response = await axios(endpoint);
            
            setCalendarReservations(response.data);
        } catch (error) {
            console.error("Failed to fetch calendar reservations:", error);
        } finally {
            setIsLoadingCalendar(false);
        }
    }, []);

    const fetchDayReservations = useCallback(async (date: Date) => {
        setIsLoadingDay(true);
        try {
            const formattedDate = format(date, 'yyyy-MM-dd');
            
            // WAYFINDER: Generate the endpoint for the specific date
            const endpoint = getReservationsForSpecificDate({ query: { date: formattedDate } });
            
            // Pass the generated { url, method } object directly to axios
            const response = await axios(endpoint);
            
            setDayReservations(response.data);
        } catch (error) {
            console.error("Failed to fetch specific day reservations:", error);
        } finally {
            setIsLoadingDay(false);
        }
    }, []);

    // Listen for month changes
    useEffect(() => {
        fetchMonthReservations(currentMonth);
    }, [currentMonth, fetchMonthReservations]);

    // Listen for selected date changes and fetch data
    useEffect(() => {
        fetchDayReservations(selectedDate);
    }, [selectedDate, fetchDayReservations]);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Used strictly for calendar grid indicators
    const getReservationsForDay = (day: Date) => {
        return calendarReservations.filter(res => {
            const checkIn = startOfDay(parseISO(res.check_in_date));
            const checkOut = startOfDay(parseISO(res.check_out_date));
            const current = startOfDay(day);
            return current >= checkIn && current < checkOut;
        });
    };
    
    // Process server-fetched day details for the right-hand panel
    const selectedDayCheckIns = dayReservations.filter(res => isSameDay(parseISO(res.check_in_date), selectedDate));
    const selectedDayCheckOuts = dayReservations.filter(res => isSameDay(parseISO(res.check_out_date), selectedDate));
    const selectedDayStaying = dayReservations.filter(res => 
        !isSameDay(parseISO(res.check_in_date), selectedDate) && 
        !isSameDay(parseISO(res.check_out_date), selectedDate)
    );

    const refreshData = useCallback(() => {
        setIsRefreshing(true);
        router.reload({
            only: ['stats', 'roomStatus', 'guestMovements', 'bookingVolume'],
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                setIsRefreshing(false);
                setLastUpdated(new Date());
            }
        });
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAutoRefresh) {
            interval = setInterval(refreshData, 15000);
        }
        return () => clearInterval(interval);
    }, [isAutoRefresh, refreshData]);

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
            <Head title="Operational Dashboard" />
            
            <div className="flex flex-col gap-6 p-4 md:p-8 bg-background min-h-screen font-sans text-foreground">
                
                {/* HEADER & CONTROLS */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Operations Center</h1>
                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                            Real-time property status
                            <span className="text-xs opacity-50">•</span> 
                            Last updated: {format(lastUpdated, 'h:mm:ss a')}
                        </p>
                    </div>

                    {/* Auto Refresh Toggle */}
                    <div className="flex items-center gap-4 bg-card border border-border p-2 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="auto-refresh" className="text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer">
                                Live Mode
                            </Label>
                            <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                                <input 
                                    type="checkbox" 
                                    name="auto-refresh" 
                                    id="auto-refresh" 
                                    className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-full checked:border-primary"
                                    checked={isAutoRefresh}
                                    onChange={(e) => setIsAutoRefresh(e.target.checked)}
                                    style={{ 
                                        backgroundColor: isAutoRefresh ? 'var(--primary)' : 'var(--muted)',
                                        borderColor: isAutoRefresh ? 'var(--primary)' : 'var(--muted)'
                                    }}
                                />
                                <label 
                                    htmlFor="auto-refresh" 
                                    className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors ${isAutoRefresh ? 'bg-primary/50' : 'bg-muted'}`}
                                ></label>
                            </div>
                        </div>

                        <div className="h-6 w-px bg-border"></div>

                        <button 
                            onClick={refreshData}
                            disabled={isRefreshing}
                            className={`p-2 rounded-lg transition-all ${isRefreshing ? 'bg-muted text-muted-foreground animate-spin' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                            title="Refresh Now"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>
                
                {/* --- TOP ANALYTICS --- */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard 
                        title="Occupancy Rate" 
                        value={`${stats.occupancy_rate}%`} 
                        icon={<DoorOpen className="text-primary" />} 
                        description={`${roomStatus.occupied} rooms currently in use`}
                    />
                    <StatCard 
                        title="Today's Arrivals" 
                        value={stats.arrivals_today} 
                        icon={<CalendarDays className="text-secondary-foreground" />} 
                        description="Expected check-ins"
                    />
                    <StatCard 
                        title="Today's Departures" 
                        value={stats.departures_today} 
                        icon={<ArrowRightLeft className="text-destructive" />} 
                        description="Rooms to be cleared"
                    />
                    <StatCard 
                        title="Maintenance" 
                        value={stats.maintenance_count} 
                        icon={<Hammer className="text-orange-600" />} 
                        description="Currently unavailable"
                    />
                </div>

                <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                    {/* --- RESERVATION TRAFFIC CHART --- */}
                    <div className="lg:col-span-4 bg-card rounded-2xl border border-border p-6 shadow-sm relative overflow-hidden">
                        {isRefreshing && <LoadingOverlay />}
                        <div className="mb-6">
                            <h3 className="font-serif font-bold text-lg mb-2">Reservation Traffic</h3>
                            {dateRanges?.reservation_traffic && (
                                <p className="text-xs text-muted-foreground">
                                    {dateRanges.reservation_traffic.from} to {dateRanges.reservation_traffic.to}
                                </p>
                            )}
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={bookingVolume}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 10, fill: 'var(--muted-foreground)'}} 
                                        tickFormatter={(val) => format(parseISO(val), 'EEE')} 
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--muted-foreground)'}} />
                                    <Tooltip 
                                        cursor={{fill: 'var(--muted)', opacity: 0.2}} 
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                                    />
                                    <Bar 
                                        dataKey="count" 
                                        fill="var(--primary)" 
                                        radius={[4, 4, 0, 0]} 
                                        barSize={40} 
                                        isAnimationActive={!isAutoRefresh}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* --- ROOM STATUS BREAKDOWN --- */}
                    <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-6 shadow-sm relative overflow-hidden">
                        {isRefreshing && <LoadingOverlay />}
                        <h3 className="font-serif font-bold text-lg mb-6">Current Room Inventory</h3>
                        <div className="space-y-5">
                            <StatusRow label="Available" count={roomStatus.available} color="bg-primary" total={totalRooms} />
                            <StatusRow label="Booked (Reserved)" count={roomStatus.booked} color="bg-accent" total={totalRooms} />
                            <StatusRow label="Occupied" count={roomStatus.occupied} color="bg-[#628141]" total={totalRooms} />
                            <StatusRow label="Unavailable" count={roomStatus.unavailable} color="bg-destructive" total={totalRooms} />
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Property Units</p>
                            <p className="text-lg font-serif font-bold">{totalRooms}</p>
                        </div>
                    </div>
                </div>

                {/* --- CALENDAR OVERVIEW --- */}
                <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
                    {/* Calendar View */}
                    <div className="xl:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm overflow-hidden flex flex-col relative">
                        {isLoadingCalendar && <LoadingOverlay />}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                                <CalendarIcon className="size-5 text-primary" />
                                Reservation Calendar
                            </h3>
                            <div className="flex items-center gap-4">
                                <button onClick={prevMonth} className="p-1 hover:bg-muted rounded-full transition-colors"><ChevronLeft size={20}/></button>
                                <span className="font-bold w-32 text-center text-sm">{format(currentMonth, 'MMMM yyyy')}</span>
                                <button onClick={nextMonth} className="p-1 hover:bg-muted rounded-full transition-colors"><ChevronRight size={20}/></button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center text-xs font-bold text-muted-foreground uppercase tracking-wider py-2">
                                    {day}
                                </div>
                            ))}
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1 flex-1">
                            {calendarDays.map((day, idx) => {
                                const dayRes = getReservationsForDay(day);
                                const isSelected = isSameDay(day, selectedDate);
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                
                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => setSelectedDate(day)}
                                        className={`min-h-[80px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col gap-1
                                            ${!isCurrentMonth ? 'opacity-40 bg-muted/30' : 'bg-card'}
                                            ${isSelected ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-transparent hover:border-border'}
                                            ${isToday(day) && !isSelected ? 'bg-primary/5 border-primary/20' : ''}
                                        `}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={`text-sm font-bold ${isToday(day) ? 'text-primary' : 'text-foreground'}`}>
                                                {format(day, 'd')}
                                            </span>
                                            {dayRes.length > 0 && (
                                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold">
                                                    {dayRes.length} Res
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Day Details */}
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px] relative">
                        {isLoadingDay && <LoadingOverlay />}
                        <h3 className="font-serif font-bold text-lg mb-2">
                            {format(selectedDate, 'MMMM d, yyyy')}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-6">Daily Activity Overview</p>
                        
                        <div className="flex-1 overflow-y-auto pr-2 space-y-6 no-scrollbar">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-green-600 mb-3 flex items-center gap-2">
                                    <ChevronRight size={14}/> Arrivals ({selectedDayCheckIns.length})
                                </h4>
                                <div className="space-y-3">
                                    {selectedDayCheckIns.length > 0 ? selectedDayCheckIns.map(res => (
                                        <div key={res.id} className="p-3 bg-muted/30 rounded-xl border border-border text-sm">
                                            <div className="font-bold text-foreground">{res.guest_name || 'Guest'}</div>
                                            <div className="flex justify-between items-center mt-1 text-muted-foreground text-xs">
                                                <span>{res.room?.room_name || 'Unassigned'}</span>
                                                <span className="text-[10px] font-bold uppercase">{format(parseISO(res.check_in_date), 'h:mm a')}</span>
                                            </div>
                                        </div>
                                    )) : <p className="text-xs text-muted-foreground italic">No arrivals scheduled.</p>}
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-3 flex items-center gap-2">
                                    <ChevronLeft size={14}/> Departures ({selectedDayCheckOuts.length})
                                </h4>
                                <div className="space-y-3">
                                    {selectedDayCheckOuts.length > 0 ? selectedDayCheckOuts.map(res => (
                                        <div key={res.id} className="p-3 bg-muted/30 rounded-xl border border-border text-sm">
                                            <div className="font-bold text-foreground">{res.guest_name || 'Guest'}</div>
                                            <div className="flex justify-between items-center mt-1 text-muted-foreground text-xs">
                                                <span>{res.room?.room_name || 'Unassigned'}</span>
                                                <span className="text-[10px] font-bold uppercase">{format(parseISO(res.check_out_date), 'h:mm a')}</span>
                                            </div>
                                        </div>
                                    )) : <p className="text-xs text-muted-foreground italic">No departures scheduled.</p>}
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                                    <CalendarIcon size={14}/> Staying Over ({selectedDayStaying.length})
                                </h4>
                                <div className="space-y-3">
                                    {selectedDayStaying.length > 0 
                                        ? selectedDayStaying.map(res => (
                                        <div key={res.id} className="p-3 bg-muted/30 rounded-xl border border-border text-sm">
                                            <div className="font-bold text-foreground">{res.guest_name || 'Guest'}</div>
                                            <div className="flex justify-between items-center mt-1 text-muted-foreground text-xs">
                                                <span>{res.room?.room_name || 'Unassigned'}</span>
                                                <span>Checkout: {format(parseISO(res.check_out_date), 'MMM d')}</span>
                                            </div>
                                        </div>
                                    )) : <p className="text-xs text-muted-foreground italic">No continuing stays.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- GUEST MOVEMENT TASK LIST --- */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm relative">
                    {isRefreshing && <LoadingOverlay />}
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <div>
                            <h3 className="font-serif font-bold text-lg">Today's Guest Schedule</h3>
                            <p className="text-xs text-muted-foreground">Key actions for front-desk and housekeeping</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[600px]">
                            <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Guest</th>
                                    <th className="px-6 py-4">Room</th>
                                    <th className="px-6 py-4">Action Type</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {guestMovements.map((res) => {
                                    const isArrival = isSameDay(parseISO(res.check_in_date), new Date());
                                    return (
                                        <tr key={res.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 font-bold">{res.guest_name}</td>
                                            <td className="px-6 py-4 text-muted-foreground font-medium">{res.room?.room_name}</td>
                                            <td className="px-6 py-4">
                                                <div className={`flex items-center gap-2 font-bold uppercase text-[10px] tracking-tight ${isArrival ? 'text-primary' : 'text-destructive'}`}>
                                                    {isArrival ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                                                    {isArrival ? 'Guest Arrival' : 'Guest Departure'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-border bg-muted/50">
                                                    {res.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {guestMovements.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-xs">
                                            No arrivals or departures scheduled for today.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

// --- HELPER COMPONENTS ---

function StatCard({ title, value, icon, description }: any) {
    return (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-muted rounded-xl text-foreground">{icon}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</div>
            </div>
            <div className="text-3xl font-serif font-bold text-foreground mb-1">{value}</div>
            <div className="text-xs text-muted-foreground">{description}</div>
        </div>
    );
}

function StatusRow({ label, count, color, total }: any) {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground">{count}</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}

const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
        <RefreshCw className="animate-spin text-primary size-6" />
    </div>
);