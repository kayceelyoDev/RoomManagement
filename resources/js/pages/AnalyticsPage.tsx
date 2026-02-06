import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { 
    TrendingUp, Wallet, CalendarCheck, BedDouble, 
    PieChart as PieIcon, ArrowUpRight, ArrowDownRight, 
    BarChart3, Hotel, Clock, RefreshCw
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';

interface Props {
    revenueData: {
        trend: { date: string; revenue: number; bookings: number }[];
        total: number;
        growth: number;
    };
    categoryPerformance: {
        name: string;
        count: number;
        total: number;
    }[];
    topRooms: {
        room_name: string;
        bookings: number;
        earned: number;
        avg_stay: number;
    }[];
    reservationStatus: {
        status: string;
        count: number;
    }[];
    avgStay: number;
}

const CHART_COLORS = [
    '#628141', // Primary (Sage)
    '#D8E983', // Secondary (Lime)
    '#2C3930', // Foreground (Dark Green)
    '#A0C080', // Light Sage
    '#E57373', // Destructive
];

export default function AnalyticsPage({ revenueData, categoryPerformance, topRooms, reservationStatus, avgStay }: Props) {
    
    // --- AUTO UPDATE LOGIC ---
    const [isAutoRefresh, setIsAutoRefresh] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshData = useCallback(() => {
        setIsRefreshing(true);
        router.reload({
            // EFFICIENCY: Only fetch these specific props from the server
            // This prevents reloading the entire page layout/user data
            only: ['revenueData', 'categoryPerformance', 'topRooms', 'reservationStatus', 'avgStay'],
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
            // Poll every 30 seconds (efficient balance)
            interval = setInterval(refreshData, 30000);
        }
        return () => clearInterval(interval);
    }, [isAutoRefresh, refreshData]);

    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(val);

    return (
        <AppLayout breadcrumbs={[{ title: 'Analytics', href: '/analytics' }]}>
            <Head title="Business Analytics" />

            <div className="min-h-screen bg-background p-4 md:p-8 space-y-8 font-sans text-foreground">
                
                {/* HEADER & CONTROLS */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Business Intelligence</h1>
                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                            Overview 
                            <span className="text-xs opacity-50">•</span> 
                            Last updated: {format(lastUpdated, 'h:mm:ss a')}
                        </p>
                    </div>

                    {/* Auto Refresh Toggle */}
                    <div className="flex items-center gap-4 bg-card border border-border p-2 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="auto-refresh" className="text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer">
                                Live Updates
                            </Label>
                             {/* Simple HTML Switch */}
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

                {/* 1. KPI GRID */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <KPICard 
                        title="Total Revenue" 
                        value={formatCurrency(revenueData.total)} 
                        icon={<Wallet className="text-primary" />}
                        trend={revenueData.growth}
                        subtext="vs previous 30 days"
                    />
                    <KPICard 
                        title="Total Bookings" 
                        value={revenueData.trend.reduce((acc, curr) => acc + curr.bookings, 0)} 
                        icon={<CalendarCheck className="text-secondary-foreground" />}
                        trend={5.2} 
                        subtext="Steady volume"
                    />
                    <KPICard 
                        title="Top Category" 
                        value={categoryPerformance[0]?.name || 'N/A'} 
                        icon={<BedDouble className="text-primary" />}
                        subtext="Highest earner"
                    />
                    <KPICard 
                        title="Avg. Stay Duration" 
                        value={`${avgStay} Days`} 
                        icon={<Clock className="text-orange-600" />}
                        subtext="Guest retention"
                    />
                </div>

                {/* 2. MAIN CHARTS ROW */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                    
                    {/* REVENUE AREA CHART */}
                    <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col relative overflow-hidden">
                        {isRefreshing && <LoadingOverlay />}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                                    <BarChart3 className="size-5 text-primary"/> Revenue Trends
                                </h3>
                                <p className="text-xs text-muted-foreground">Daily income visualization</p>
                            </div>
                        </div>
                        
                        <div className="h-[350px] w-full mt-auto">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData.trend}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(val) => format(parseISO(val), 'MMM dd')} 
                                        tick={{fontSize: 11, fill: 'var(--muted-foreground)'}} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        minTickGap={30}
                                    />
                                    <YAxis 
                                        tickFormatter={(val) => `₱${val/1000}k`} 
                                        tick={{fontSize: 11, fill: 'var(--muted-foreground)'}} 
                                        axisLine={false} 
                                        tickLine={false} 
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'var(--card)', 
                                            borderColor: 'var(--border)', 
                                            borderRadius: '12px',
                                            color: 'var(--card-foreground)',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                        formatter={(val: number) => [formatCurrency(val), 'Revenue']}
                                        labelFormatter={(label) => format(parseISO(label), 'MMMM dd, yyyy')}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke="var(--primary)" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorRevenue)" 
                                        isAnimationActive={!isAutoRefresh} 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* STATUS PIE CHART */}
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col relative overflow-hidden">
                        {isRefreshing && <LoadingOverlay />}
                        <h3 className="font-serif font-bold text-lg mb-1 flex items-center gap-2">
                            <PieIcon className="size-5 text-secondary-foreground"/> Booking Status
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">Distribution overview</p>
                        
                        <div className="flex-1 min-h-[300px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={reservationStatus}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="count"
                                        nameKey="status" // <--- FIXED: Tells the chart what string to use for the Legend
                                        stroke="var(--card)"
                                        strokeWidth={4}
                                        isAnimationActive={!isAutoRefresh}
                                    >
                                        {reservationStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36} 
                                        iconType="circle"
                                        formatter={(value) => (
                                            <span className="text-xs text-muted-foreground font-bold ml-1 capitalize">
                                                {value.replace('_', ' ')}
                                            </span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            
                            {/* Center Total Count Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-foreground">
                                        {reservationStatus.reduce((acc, curr) => acc + curr.count, 0)}
                                    </p>
                                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Total</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. DETAILS GRID */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                    
                    {/* Category Performance */}
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm relative overflow-hidden">
                        {isRefreshing && <LoadingOverlay />}
                        <h3 className="font-serif font-bold text-lg mb-6">Performance by Category</h3>
                        <div className="space-y-4">
                            {categoryPerformance.map((cat, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/50 rounded-xl transition-colors border border-transparent hover:border-border">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm
                                            ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground border border-border'}`}>
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-foreground">{cat.name}</p>
                                            <p className="text-xs text-muted-foreground">{cat.count} Total Bookings</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm text-foreground">{formatCurrency(cat.total)}</p>
                                        <p className="text-[10px] text-primary font-bold uppercase tracking-wide">Revenue</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Specific Rooms */}
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm relative overflow-hidden">
                        {isRefreshing && <LoadingOverlay />}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-serif font-bold text-lg">Top Revenue Rooms</h3>
                            <Hotel className="text-muted-foreground size-5" />
                        </div>
                        
                        <div className="space-y-5">
                            {topRooms.map((room, index) => (
                                <div key={index} className="group flex items-center gap-4">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{room.room_name}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{room.bookings} Bookings</p>
                                                    <span className="text-[10px] text-muted-foreground">•</span>
                                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{Math.round(room.avg_stay)}d Avg. Stay</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                 <p className="text-xs font-bold text-foreground">{formatCurrency(room.earned)}</p>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden mt-2">
                                            <div 
                                                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out" 
                                                style={{ width: `${topRooms[0].earned > 0 ? (room.earned / topRooms[0].earned) * 100 : 0}%` }} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {topRooms.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground text-sm italic">
                                    No room data available yet.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}

// --- HELPER COMPONENTS ---

function KPICard({ title, value, icon, trend, subtext }: any) {
    return (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{title}</span>
                <div className="p-2.5 bg-muted/50 rounded-xl text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {icon}
                </div>
            </div>
            <div className="text-2xl font-serif font-bold text-foreground mb-2 tracking-tight">{value}</div>
            <div className="flex items-center gap-2">
                {trend !== undefined && (
                    <span className={`text-xs font-bold flex items-center px-1.5 py-0.5 rounded-md ${
                        trend >= 0 
                        ? 'text-primary bg-primary/10' 
                        : 'text-destructive bg-destructive/10'
                    }`}>
                        {trend >= 0 ? <ArrowUpRight size={12} className="mr-1"/> : <ArrowDownRight size={12} className="mr-1"/>}
                        {Math.abs(trend)}%
                    </span>
                )}
                <span className="text-[10px] text-muted-foreground font-medium">{subtext}</span>
            </div>
        </div>
    );
}

const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
        <RefreshCw className="animate-spin text-primary size-6" />
    </div>
);