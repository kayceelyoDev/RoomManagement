import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Assuming you have shadcn input
import AppLayout from '@/layouts/app-layout';
import reservationRoute from '@/routes/reservation';
import servicesRoute from '@/routes/services';
import { BreadcrumbItem } from '@/types';
import { Room } from '@/types/Rooms';
import { Head, Link, router } from '@inertiajs/react'; // Import router for search
import { CalendarDays, CheckCircle, Clock, MoreHorizontal, Search, User, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AddReservation, { Service } from './modal/AddReservation';

// --- Types ---
interface Reservation {
    id: string;
    guest_name:string;
    contact_number: string;
    total_guest: number;
    check_in_date: string;
    check_out_date: string;
    status: string;
    reservation_amount: number;
    room?: Room;
    services?: Service[];
}

interface Props {
    rooms: Room[];
    services: Service[];
    reservations: Reservation[]; // <-- New Prop
    filters?: { search?: string }; // <-- Search state from backend
}

export default function ReservationPage({ rooms, services, reservations, filters }: Props) {
    const [isShowingAddModal, setIsShowingAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');

    // --- Search Logic with Debounce ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                router.get(
                    reservationRoute.index.url(),
                    { search: searchQuery },
                    { preserveState: true, replace: true }
                );
            }
        }, 300); // Wait 300ms after user stops typing

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Manage Reservations',
            href: reservationRoute.index.url(),
        },
    ];

    // Helper for Status Colors
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="size-3"/> Confirmed</span>;
            case 'pending':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="size-3"/> Pending</span>;
            case 'cancelled':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><XCircle className="size-3"/> Cancelled</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">{status}</span>;
        }
    };

    // Helper for Date Formatting
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Manage Reservations' />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* --- Toolbar: Search & Buttons --- */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-72">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <Input 
                                type="text" 
                                placeholder="Search by name, room, or status..." 
                                className="pl-10 dark:bg-gray-800 dark:border-gray-700"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Link href={servicesRoute.index.url()}> 
                                <Button variant="outline" className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700">
                                    Manage Services
                                </Button>
                            </Link>
                            <Button onClick={() => setIsShowingAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
                                Add Reservation
                            </Button>
                        </div>
                    </div>

                    {/* --- Reservations Table --- */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg border dark:border-gray-700">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guest & Room</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Schedule</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Services</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {reservations.length > 0 ? (
                                        reservations.map((res) => (
                                            <tr key={res.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                
                                                {/* Guest & Room Info */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                            <User className="size-3 text-indigo-500" />
                                                            {res.guest_name}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                            {res.room?.room_name || 'Unknown Room'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">
                                                            {res.total_guest} Guest(s)
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Dates */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col text-sm text-gray-700 dark:text-gray-300">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">In</span>
                                                            {formatDate(res.check_in_date)}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">Out</span>
                                                            {formatDate(res.check_out_date)}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(res.status)}
                                                </td>

                                                {/* Services Used */}
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {res.services && res.services.length > 0 ? (
                                                            res.services.map(svc => (
                                                                <span key={svc.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                                                    {svc.services_name}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">None</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Amount */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                        ₱{res.reservation_amount.toLocaleString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                <div className="flex flex-col items-center justify-center">
                                                    <CalendarDays className="h-10 w-10 mb-2 text-gray-300 dark:text-gray-600" />
                                                    <p>No reservations found.</p>
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

            <AddReservation
                rooms={rooms}
                services={services} 
                isOpen={isShowingAddModal} 
                onClose={() => setIsShowingAddModal(false)} 
            />
        </AppLayout>
    );
}