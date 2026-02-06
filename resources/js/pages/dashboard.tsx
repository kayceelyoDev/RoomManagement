import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { 
    Users, DoorOpen, Clock, CalendarDays, 
    ArrowRightLeft, AlertTriangle, Info, CheckCircle2,
    XCircle, Hammer
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer
} from 'recharts';
import { format, parseISO, isSameDay } from 'date-fns';

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

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
            <Head title="Operational Dashboard" />
            
            <div className="flex flex-col gap-6 p-4 md:p-8 bg-background min-h-screen">
                
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
                        icon={<CalendarDays className="text-accent-foreground" />} 
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
                        icon={<Hammer className="text-yellow-600" />} 
                        description="Currently unavailable"
                    />
                </div>

                <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                    {/* --- INVENTORY BAR CHART --- */}
                    <div className="lg:col-span-4 bg-card rounded-2xl border border-border p-6 shadow-sm">
                        <h3 className="font-serif font-bold text-lg mb-6">Staffing Load (7-Day Forecast)</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={bookingVolume}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(val) => format(parseISO(val), 'EEE')} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                    <Tooltip cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* --- ROOM STATUS BREAKDOWN (Exact Migration Enums) --- */}
                    <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-6 shadow-sm">
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
                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
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
                                                    {res.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

// Reusable Components
function StatCard({ title, value, icon, description }: any) {
    return (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-muted rounded-xl">{icon}</div>
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
                <span>{count}</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}