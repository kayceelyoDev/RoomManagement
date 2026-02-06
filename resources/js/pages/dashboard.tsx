import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { 
    DoorOpen, CalendarDays, ArrowRightLeft, 
    Hammer, RefreshCw, CheckCircle2, XCircle
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer
} from 'recharts';
import { format, parseISO, isSameDay } from 'date-fns';
import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';

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
}

export default function Dashboard({ stats, roomStatus, guestMovements, bookingVolume }: Props) {
    const totalRooms = roomStatus.available + roomStatus.booked + roomStatus.occupied + roomStatus.unavailable;

    // --- AUTO UPDATE LOGIC ---
    const [isAutoRefresh, setIsAutoRefresh] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshData = useCallback(() => {
        setIsRefreshing(true);
        router.reload({
            // EFFICIENCY: Only fetch these specific props from the server
            // This skips layout/user/nav data re-fetching
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
            // Poll every 15 seconds (Fast enough for Ops, slow enough for server)
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
                    {/* --- INVENTORY BAR CHART --- */}
                    <div className="lg:col-span-4 bg-card rounded-2xl border border-border p-6 shadow-sm relative overflow-hidden">
                        {isRefreshing && <LoadingOverlay />}
                        <h3 className="font-serif font-bold text-lg mb-6">Staffing Load (7-Day Forecast)</h3>
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