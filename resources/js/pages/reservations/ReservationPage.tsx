import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import reservationRoute from '@/routes/reservation';
import servicesRoute from '@/routes/services';
import { BreadcrumbItem } from '@/types';
import { Room } from '@/types/Rooms';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, CheckCircle, Clock, Edit, Search, Trash2, User, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AddReservation, { Service } from './modal/AddReservation';
import UpdateReservation from './modal/UpdateReservation';

// --- Synchronized Types ---
export interface Reservation {
    id: number;
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
    filters?: { search?: string };
}

export default function ReservationPage({ rooms, services, reservations, filters }: Props) {
    const [isShowingAddModal, setIsShowingAddModal] = useState(false);
    const [isShowingUpdateModal, setIsShowingUpdateModal] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');

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

    const handleEditClick = (res: Reservation) => {
        setSelectedReservation(res);
        setIsShowingUpdateModal(true);
    };

    // FIX: Acceptance of number and conversion to string for route helper
    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this reservation?')) {
            router.delete(reservationRoute.destroy.url(id.toString()));
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Manage Reservations', href: reservationRoute.index.url() }];

    const getStatusBadge = (status: string) => {
        const styles = {
            confirmed: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
            pending: "bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent",
            cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        };
        const style = styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
                {status === 'confirmed' && <CheckCircle className="size-3"/>}
                {status === 'pending' && <Clock className="size-3"/>}
                {status === 'cancelled' && <XCircle className="size-3"/>}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Manage Reservations' />
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                                placeholder="Search reservations..." 
                                className="pl-10 bg-background border-border"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Link href={servicesRoute.index.url()}> 
                                <Button variant="outline">Manage Services</Button>
                            </Link>
                            <Button onClick={() => setIsShowingAddModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                Add Reservation
                            </Button>
                        </div>
                    </div>

                    <div className="bg-card shadow-sm rounded-lg border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium">Guest & Room</th>
                                        <th className="px-6 py-3 text-left font-medium">Schedule</th>
                                        <th className="px-6 py-3 text-left font-medium">Status</th>
                                        <th className="px-6 py-3 text-left font-medium text-right">Total</th>
                                        <th className="px-6 py-3 text-right font-medium text-primary">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {reservations.map((res) => (
                                        <tr key={res.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                                    <User className="size-3 text-primary" /> {res.guest_name}
                                                </div>
                                                <div className="text-xs text-gray-500">{res.room?.room_name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                <div className="text-primary font-medium">In: {new Date(res.check_in_date).toLocaleDateString()}</div>
                                                <div className="text-red-500 mt-1">Out: {new Date(res.check_out_date).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4">{getStatusBadge(res.status)}</td>
                                            <td className="px-6 py-4 text-right font-bold">₱{res.reservation_amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(res)} className="text-primary hover:bg-primary/10">
                                                        <Edit className="size-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(res.id)} className="text-red-600 hover:bg-red-50">
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

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