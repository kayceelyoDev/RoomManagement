import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import {
    X,
    Phone,
    DoorOpen,
    Info,
    CalendarPlus,
    Save,
    RotateCcw,
    AlertCircle,
    Clock,
    ConciergeBell,
    Plus,
    Minus,
    Users,
    User // Added User icon
} from 'lucide-react';
import reservation from '@/routes/reservation';

// --- Types ---

export interface Service {
    id: number;
    services_name: string;
    services_price: number;
}

export interface Room {
    id: number;
    room_name: string;
    max_extra_person: number; 
    room_category?: { 
        id: number;
        room_category: string;
        price: number;
        room_capacity: number;
    };
}

interface SelectedServiceItem {
    id: number;
    quantity: number;
    price: number;
}

interface Props {
    rooms: Room[];
    services: Service[];
    isOpen: boolean;
    onClose: () => void;
}

export default function AddReservation({ isOpen, onClose, rooms = [], services = [] }: Props) {

    const { data, setData, post, processing, errors, reset } = useForm({
        room_id: '',
        guest_name: '', // Added guest_name to state
        contact_number: '',
        total_guest: 1,
        check_in_date: '',
        check_out_date: '',
        status: 'pending',
        reservation_amount: 0,
        selected_services: [] as SelectedServiceItem[],
    });

    const selectedRoom = useMemo(() =>
        rooms.find(r => String(r.id) === String(data.room_id)),
        [data.room_id, rooms]
    );

    // --- NEW LOGIC: Auto-fill Guests based on Room Selection ---
    useEffect(() => {
        if (selectedRoom) {
            const defaultCapacity = selectedRoom.room_category?.room_capacity ?? 1;
            setData(prev => ({
                ...prev,
                total_guest: defaultCapacity,
            }));
        }
    }, [selectedRoom]);

    // --- Service Logic ---
    const toggleService = (service: Service) => {
        const existing = data.selected_services.find(s => s.id === service.id);
        if (existing) {
            setData('selected_services', data.selected_services.filter(s => s.id !== service.id));
        } else {
            setData('selected_services', [
                ...data.selected_services,
                { id: service.id, quantity: 1, price: service.services_price }
            ]);
        }
    };

    const updateServiceQuantity = (id: number, delta: number) => {
        const updated = data.selected_services.map(s => {
            if (s.id === id) {
                const newQty = Math.max(1, s.quantity + delta);
                return { ...s, quantity: newQty };
            }
            return s;
        });
        setData('selected_services', updated);
    };

    // --- Price Calculation Logic ---
    const priceDetails = useMemo(() => {
        let roomTotal = 0;
        let nights = 0;
        let extraHours = 0;

        if (data.check_in_date && data.check_out_date && selectedRoom) {
            const start = new Date(data.check_in_date);
            const end = new Date(data.check_out_date);
            const diffMs = end.getTime() - start.getTime();

            if (diffMs > 0) {
                const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
                nights = Math.floor(totalHours / 24);
                extraHours = totalHours % 24;

                const roomPrice = selectedRoom.room_category?.price ?? 0;
                const hourlySurcharge = roomPrice * 0.10;

                roomTotal = (nights * roomPrice) + (extraHours * hourlySurcharge);
            }
        }

        const servicesTotal = data.selected_services.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);

        const grandTotal = roomTotal + servicesTotal;

        return { grandTotal, roomTotal, servicesTotal, nights, extraHours };
    }, [data.check_in_date, data.check_out_date, selectedRoom, data.selected_services]);

    useEffect(() => {
        setData('reservation_amount', priceDetails.grandTotal);
    }, [priceDetails.grandTotal]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(reservation.store.url(), {
            onSuccess: () => {
                onClose();
                reset();
            },
        });
    };

    const ErrorMessage = ({ message }: { message?: string }) => {
        if (!message) return null;
        return (
            <div className="flex items-center gap-1 mt-1 text-red-500">
                <AlertCircle className="size-3" />
                <span className="text-xs font-medium">{message}</span>
            </div>
        );
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-0 shadow-2xl transition-all dark:bg-gray-900 flex flex-col md:flex-row">

                                {/* LEFT SIDE: FORM */}
                                <div className="flex-1 p-8 overflow-y-auto max-h-[85vh]">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                                <CalendarPlus className="size-6 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                                                New Reservation
                                            </Dialog.Title>
                                        </div>
                                        <button onClick={onClose} className="md:hidden p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <X className="size-6 text-gray-400" />
                                        </button>
                                    </div>

                                    <form id="reservation-form" onSubmit={submit} className="space-y-6">

                                        {/* Room & Guest Info */}
                                        <div className="grid grid-cols-1 gap-6">
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                                                    <DoorOpen className="size-4" /> Select Room
                                                </label>
                                                <select
                                                    value={data.room_id}
                                                    onChange={e => setData('room_id', e.target.value)}
                                                    className={`w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.room_id ? 'border-red-500' : ''}`}
                                                >
                                                    <option value="">Choose a room...</option>
                                                    {rooms.map((room) => (
                                                        <option key={room.id} value={room.id}>
                                                            {room.room_name} — ₱{(room.room_category?.price ?? 0).toLocaleString()}/night
                                                        </option>
                                                    ))}
                                                </select>
                                                <ErrorMessage message={errors.room_id} />
                                            </div>

                                            {/* NEW GUEST NAME INPUT */}
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                                                    <User className="size-4" /> Guest Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.guest_name}
                                                    onChange={e => setData('guest_name', e.target.value)}
                                                    className={`w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.guest_name ? 'border-red-500' : ''}`}
                                                    placeholder="Enter guest's full name"
                                                />
                                                <ErrorMessage message={errors.guest_name} />
                                            </div>

                                            <div>
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                                                    <Phone className="size-4" /> Contact Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.contact_number}
                                                    onChange={e => setData('contact_number', e.target.value)}
                                                    className={`w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.contact_number ? 'border-red-500' : ''}`}
                                                    placeholder="09123456789"
                                                />
                                                <ErrorMessage message={errors.contact_number} />
                                            </div>
                                        </div>

                                        {/* Dates */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                                                    <Clock className="size-4" /> Check-In
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={data.check_in_date}
                                                    onChange={e => setData('check_in_date', e.target.value)}
                                                    className={`w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.check_in_date ? 'border-red-500' : ''}`}
                                                />
                                                <ErrorMessage message={errors.check_in_date} />
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                                                    <Clock className="size-4" /> Check-Out
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={data.check_out_date}
                                                    onChange={e => setData('check_out_date', e.target.value)}
                                                    className={`w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.check_out_date ? 'border-red-500' : ''}`}
                                                />
                                                <ErrorMessage message={errors.check_out_date} />
                                            </div>
                                        </div>

                                        {/* Guests - UPDATED (Full Width now) */}
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                                                <Users className='size-4'/> 
                                                Total Guests 
                                                {selectedRoom?.room_category && (
                                                    <span className="text-[10px] text-gray-400 font-normal">
                                                        (Capacity: {selectedRoom.room_category.room_capacity})
                                                    </span>
                                                )}
                                            </label>
                                            <input
                                                type="number"
                                                value={data.total_guest}
                                                onChange={e => setData('total_guest', parseInt(e.target.value) || 0)}
                                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                                min={1} 
                                            />
                                            <ErrorMessage message={errors.total_guest} />
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                                                <Info className="size-4" /> Status
                                            </label>
                                            <select
                                                value={data.status}
                                                onChange={e => setData('status', e.target.value)}
                                                className={`w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.status ? 'border-red-500' : ''}`}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                            <ErrorMessage message={errors.status} />
                                        </div>

                                        {/* Services */}
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                                <ConciergeBell className="size-4" /> Add Services (Extras)
                                            </label>
                                            
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                {services.length === 0 ? (
                                                    <p className="text-sm text-gray-500 italic">No services available.</p>
                                                ) : (
                                                    services.map((service) => {
                                                        const isSelected = data.selected_services.find(s => s.id === service.id);
                                                        return (
                                                            <div key={service.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                                                                <div className="flex items-center gap-3">
                                                                    <input 
                                                                        type="checkbox"
                                                                        checked={!!isSelected}
                                                                        onChange={() => toggleService(service)}
                                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                    />
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{service.services_name}</p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">₱{service.services_price}</p>
                                                                    </div>
                                                                </div>

                                                                {isSelected && (
                                                                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1">
                                                                        <button type="button" onClick={() => updateServiceQuantity(service.id, -1)} className="text-gray-500 hover:text-indigo-600">
                                                                            <Minus className="size-3" />
                                                                        </button>
                                                                        <span className="text-xs font-bold w-4 text-center dark:text-white">{isSelected.quantity}</span>
                                                                        <button type="button" onClick={() => updateServiceQuantity(service.id, 1)} className="text-gray-500 hover:text-indigo-600">
                                                                            <Plus className="size-3" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>

                                    </form>
                                </div>

                                {/* RIGHT SIDE: SUMMARY */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 w-full md:w-80 p-8 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Summary</h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2 pb-4 border-b border-gray-200 dark:border-gray-700">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Room Charges</p>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600 dark:text-gray-300">Duration</span>
                                                    <span className="font-medium dark:text-white">{priceDetails.nights} Nights</span>
                                                </div>
                                                {priceDetails.extraHours > 0 && (
                                                    <div className="flex justify-between text-sm text-amber-600">
                                                        <span>Extra Hours ({priceDetails.extraHours})</span>
                                                        <span>+10%/hr</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-sm font-semibold pt-1">
                                                    <span className="text-gray-900 dark:text-white">Room Subtotal</span>
                                                    <span className="text-gray-900 dark:text-white">₱{priceDetails.roomTotal.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {data.selected_services.length > 0 && (
                                                <div className="space-y-2 pb-4 border-b border-gray-200 dark:border-gray-700">
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Services (Extras)</p>
                                                    {data.selected_services.map((s) => {
                                                        const originalService = services.find(srv => srv.id === s.id);
                                                        return (
                                                            <div key={s.id} className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                                                                <span>{originalService?.services_name} (x{s.quantity})</span>
                                                                <span>₱{(s.price * s.quantity).toLocaleString()}</span>
                                                            </div>
                                                        )
                                                    })}
                                                    <div className="flex justify-between text-sm font-semibold pt-1">
                                                        <span className="text-gray-900 dark:text-white">Services Subtotal</span>
                                                        <span className="text-gray-900 dark:text-white">₱{priceDetails.servicesTotal.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</span>
                                            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                                                ₱{priceDetails.grandTotal.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="flex gap-3">
                                            <button 
                                                type="button" 
                                                onClick={onClose}
                                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                form="reservation-form"
                                                type="submit" 
                                                disabled={processing}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md disabled:opacity-50 transition-colors"
                                            >
                                                {processing ? 'Saving...' : 'Confirm'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}