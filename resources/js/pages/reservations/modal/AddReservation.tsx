import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    X, Minus, Plus, ChevronLeft, ChevronRight, CheckCircle, XCircle
} from 'lucide-react';
import reservationRoute from '@/routes/reservation';
import { 
    format, addMonths, subMonths, startOfMonth, endOfMonth, 
    eachDayOfInterval, isSameDay, startOfToday, addHours, startOfDay, 
    isBefore, parseISO, isWithinInterval, areIntervalsOverlapping,
    endOfDay, isAfter
} from 'date-fns';

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
    reservations?: { 
        id: number;
        check_in_date: string; 
        check_out_date: string;
        status: string;
    }[];
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
    preSelectedRoomId?: number | null;
    // Updated to include super_admin
    role?: 'admin' | 'staff' | 'guest' | 'super_admin';
}

const BUFFER_HOURS = 3; // Room prep time

export default function AddReservation({ 
    isOpen, onClose, rooms = [], services = [], 
    preSelectedRoomId = null, role = 'staff' 
}: Props) {
    
    const [step, setStep] = useState<'room' | 'calendar' | 'form'>('room');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const { data, setData, post, processing, reset } = useForm({
        room_id: preSelectedRoomId ? preSelectedRoomId.toString() : '',
        guest_name: '',
        contact_number: '',
        total_guest: 1,
        check_in_date: '',
        check_out_date: '',
        status: 'pending',
        reservation_amount: 0,
        selected_services: [] as SelectedServiceItem[],
    });

    const selectedRoom = useMemo(() => rooms.find(r => String(r.id) === String(data.room_id)), [data.room_id, rooms]);
    const isAdminOrStaff = ['admin', 'super_admin', 'staff'].includes(role);

    // --- Reset Logic ---
    useEffect(() => {
        if (isOpen) {
            if (preSelectedRoomId) {
                setData('room_id', preSelectedRoomId.toString());
                setStep('calendar');
            } else {
                setStep('room');
            }
        } else {
            setTimeout(() => {
                reset();
                setStep('room');
                setSelectedDate(null);
                setCurrentMonth(new Date());
            }, 300);
        }
    }, [isOpen, preSelectedRoomId]);

    // --- Auto-fill Guests ---
    useEffect(() => {
        if (selectedRoom) {
            setData(prev => ({ ...prev, total_guest: selectedRoom.room_category?.room_capacity ?? 1 }));
        }
    }, [selectedRoom]);

    // --- Calendar Availability Logic ---
    const daysInMonth = useMemo(() => {
        return eachDayOfInterval({ 
            start: startOfMonth(currentMonth), 
            end: endOfMonth(currentMonth) 
        });
    }, [currentMonth]);

    const getReservationsForDate = (date: Date) => {
        if (!selectedRoom?.reservations) return [];
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        return selectedRoom.reservations.filter(res => {
            const start = parseISO(res.check_in_date);
            const end = parseISO(res.check_out_date);
            return areIntervalsOverlapping({ start: dayStart, end: dayEnd }, { start, end });
        });
    };

    const getEarliestAvailableTime = (date: Date) => {
        const standardCheckIn = addHours(startOfDay(date), 14); // 2:00 PM
        
        if (!selectedRoom?.reservations) return standardCheckIn;

        const overlapping = selectedRoom.reservations.filter(res => {
            const start = parseISO(res.check_in_date);
            const end = parseISO(res.check_out_date);
            return isWithinInterval(end, { start: startOfDay(date), end: endOfDay(date) }) ||
                   isWithinInterval(start, { start: startOfDay(date), end: endOfDay(date) }) ||
                   (isBefore(start, startOfDay(date)) && isAfter(end, endOfDay(date)));
        });

        if (overlapping.length === 0) return standardCheckIn;

        overlapping.sort((a, b) => parseISO(b.check_out_date).getTime() - parseISO(a.check_out_date).getTime());
        const lastRes = overlapping[0];
        const lastCheckout = parseISO(lastRes.check_out_date);
        const availableTime = addHours(lastCheckout, BUFFER_HOURS);

        if (!isSameDay(availableTime, date)) return null;

        return isAfter(standardCheckIn, availableTime) ? standardCheckIn : availableTime;
    };

    const confirmDateSelection = () => {
        if (!selectedDate) return;
        const availableTime = getEarliestAvailableTime(selectedDate);
        if (!availableTime) return;

        const checkOut = addHours(availableTime, 22); 

        setData(prev => ({
            ...prev,
            check_in_date: format(availableTime, "yyyy-MM-dd'T'HH:mm"),
            check_out_date: format(checkOut, "yyyy-MM-dd'T'HH:mm"),
        }));
        setStep('form');
    };

    // --- Services Logic ---
    const updateServiceQuantity = (id: number, delta: number) => {
        const existingIndex = data.selected_services.findIndex(s => s.id === id);
        const masterService = services.find(s => s.id === id);
        if (!masterService) return;

        let newServices = [...data.selected_services];

        if (existingIndex > -1) {
            const newQty = newServices[existingIndex].quantity + delta;
            if (newQty <= 0) {
                newServices = newServices.filter(s => s.id !== id);
            } else {
                newServices[existingIndex].quantity = newQty;
            }
        } else if (delta > 0) {
            newServices.push({ id, quantity: 1, price: masterService.services_price });
        }

        setData('selected_services', newServices);
    };

    // --- Price Calculation ---
    const priceDetails = useMemo(() => {
        let roomTotal = 0; let nights = 0; let extraHours = 0;
        if (data.check_in_date && data.check_out_date && selectedRoom) {
            const start = new Date(data.check_in_date);
            const end = new Date(data.check_out_date);
            const diffMs = end.getTime() - start.getTime();
            if (diffMs > 0) {
                const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
                nights = Math.floor(totalHours / 24);
                extraHours = totalHours % 24;
                const roomPrice = selectedRoom.room_category?.price ?? 0;
                roomTotal = (nights * roomPrice) + (extraHours * (roomPrice * 0.10));
            }
        }
        const servicesTotal = data.selected_services.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return { grandTotal: roomTotal + servicesTotal, roomTotal, servicesTotal, nights, extraHours };
    }, [data.check_in_date, data.check_out_date, selectedRoom, data.selected_services]);

    useEffect(() => { setData('reservation_amount', priceDetails.grandTotal); }, [priceDetails.grandTotal]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(reservationRoute.store.url(), { onSuccess: () => onClose() });
    };

    const startingDayIndex = startOfMonth(currentMonth).getDay();
    const activeReservations = selectedDate ? getReservationsForDate(selectedDate) : [];
    const availableTimeSlot = selectedDate ? getEarliestAvailableTime(selectedDate) : null;
    const isFullyBooked = selectedDate && availableTimeSlot === null;

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-5xl rounded-2xl bg-card shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[600px] border border-border transition-all">
                            
                            <div className="flex-1 p-8 overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title className="text-xl font-bold dark:text-white flex items-center gap-2">
                                        {step === 'form' ? 'Finalize Details' : 'New Booking'}
                                    </Dialog.Title>
                                    <button onClick={onClose}><X className="text-gray-400" /></button>
                                </div>

                                {/* STEP 1: ROOM SELECTION */}
                                {step === 'room' && (
                                    <div className="animate-in slide-in-from-right duration-300">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {rooms.map(room => (
                                                <div 
                                                    key={room.id}
                                                    onClick={() => { setData('room_id', room.id.toString()); setStep('calendar'); }}
                                                    className="group p-5 border rounded-xl hover:border-indigo-500 hover:shadow-lg cursor-pointer transition-all dark:border-gray-700 dark:hover:bg-indigo-900/10 relative overflow-hidden"
                                                >
                                                    <div className="font-bold text-lg dark:text-white mb-1">{room.room_name}</div>
                                                    <div className="text-xs font-medium text-primary bg-primary/10 inline-block px-2 py-1 rounded mb-2 dark:bg-primary/20">
                                                        {room.room_category?.room_category}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        Max {room.max_extra_person} guests • ₱{room.room_category?.price.toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: CALENDAR */}
                                {step === 'calendar' && (
                                    <div className="animate-in slide-in-from-right duration-300 flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-6">
                                            <button onClick={() => setStep('room')} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium"><ChevronLeft className="size-4"/> Change Room</button>
                                            <div className="flex items-center gap-4 bg-muted rounded-full px-4 py-1">
                                                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-muted rounded-full"><ChevronLeft className="size-4"/></button>
                                                <span className="font-bold text-sm dark:text-white w-32 text-center">{format(currentMonth, 'MMMM yyyy')}</span>
                                                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-muted rounded-full"><ChevronRight className="size-4"/></button>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400 mb-2">
                                            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
                                        </div>
                                        <div className="grid grid-cols-7 gap-2 mb-6">
                                            {Array.from({ length: startingDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}
                                            {daysInMonth.map((day) => {
                                                const isPast = isBefore(day, startOfToday());
                                                const hasRes = getReservationsForDate(day).length > 0;
                                                const isSelected = selectedDate && isSameDay(day, selectedDate);
                                                
                                                return (
                                                    <button
                                                        key={day.toString()}
                                                        type="button"
                                                        disabled={isPast}
                                                        onClick={() => setSelectedDate(day)}
                                                        className={`
                                                            h-12 rounded-lg flex flex-col items-center justify-center text-sm font-semibold transition-all relative border
                                                            ${isPast ? 'opacity-30 cursor-not-allowed' : 'hover:border-primary'}
                                                            ${isSelected ? 'ring-2 ring-primary border-primary bg-primary/10 dark:bg-primary/20' : 'bg-card border-border'}
                                                        `}
                                                    >
                                                        <span className={isSelected ? 'text-primary' : 'dark:text-gray-200'}>{format(day, 'd')}</span>
                                                        {hasRes && <div className={`mt-1 w-1.5 h-1.5 rounded-full bg-accent`} />}
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        <div className="mt-auto bg-muted rounded-xl p-5 border border-border">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                                                {selectedDate ? format(selectedDate, 'EEEE, MMMM do') : 'Select a date'}
                                            </h4>
                                            
                                            {selectedDate ? (
                                                <div className="space-y-3">
                                                    <div className={`flex items-center gap-2 text-sm font-medium ${isFullyBooked ? 'text-red-600' : 'text-primary'}`}>
                                                        {isFullyBooked ? <XCircle className="size-5"/> : <CheckCircle className="size-5"/>}
                                                        <span>{isFullyBooked ? 'Fully Booked' : `Available from ${format(availableTimeSlot!, 'h:mm a')}`}</span>
                                                    </div>

                                                    {activeReservations.length > 0 && (
                                                        <div className="bg-background p-3 rounded-lg border border-border space-y-2">
                                                            <p className="text-xs text-gray-500 font-medium">Occupied Times:</p>
                                                            {activeReservations.map(res => (
                                                                <div key={res.id} className="text-xs flex justify-between text-gray-700 dark:text-gray-300">
                                                                    <span className="font-mono">
                                                                        {format(parseISO(res.check_in_date), 'MMM d, h:mm a')} - {format(parseISO(res.check_out_date), 'MMM d, h:mm a')}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            {!isFullyBooked && <p className="text-xs text-accent mt-1 italic">+ {BUFFER_HOURS} hours cleaning buffer applied</p>}
                                                        </div>
                                                    )}

                                                    <button 
                                                        onClick={confirmDateSelection}
                                                        disabled={isFullyBooked}
                                                        className="w-full mt-2 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {isFullyBooked ? 'No Slots Available' : `Book starting at ${format(availableTimeSlot!, 'h:mm a')}`}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-400 italic text-center py-2">Click a date above to check availability.</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: DETAILS FORM */}
                                {step === 'form' && (
                                    <form id="res-form" onSubmit={submit} className="space-y-6 animate-in slide-in-from-right duration-300">
                                        <div className="flex items-center justify-between bg-primary/10 dark:bg-primary/20 p-4 rounded-xl border border-primary/20 dark:border-primary/30">
                                            <div>
                                                <p className="text-xs text-primary font-bold uppercase">Room & Date</p>
                                                <p className="font-bold dark:text-white">{selectedRoom?.room_name} • {format(new Date(data.check_in_date), 'MMM dd, h:mm a')}</p>
                                            </div>
                                            <button type="button" onClick={() => setStep('calendar')} className="text-sm text-primary hover:underline">Change</button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">Guest Name</label>
                                                <input className="w-full border rounded p-2 bg-background border-border" placeholder="Full Name" value={data.guest_name} onChange={e => setData('guest_name', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">Contact</label>
                                                <input className="w-full border rounded p-2 bg-background border-border" placeholder="Phone / Email" value={data.contact_number} onChange={e => setData('contact_number', e.target.value)} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">Check-in</label>
                                                <input type="datetime-local" className="w-full border rounded p-2 bg-background border-border" value={data.check_in_date} onChange={e => setData('check_in_date', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">Check-out</label>
                                                <input type="datetime-local" className="w-full border rounded p-2 bg-background border-border" value={data.check_out_date} onChange={e => setData('check_out_date', e.target.value)} />
                                            </div>
                                        </div>

                                        {/* Status and Guest Count Section */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Total Guest is visible to everyone */}
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">Total Guests</label>
                                                <input 
                                                    type="number" 
                                                    className="w-full border rounded p-2 bg-background border-border" 
                                                    value={data.total_guest} 
                                                    onChange={e => setData('total_guest', parseInt(e.target.value))} 
                                                    min={1} 
                                                />
                                            </div>

                                            {/* Status is ONLY visible to Admin, Super Admin, and Staff */}
                                            {isAdminOrStaff && (
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Reservation Status</label>
                                                    <select className="w-full border rounded p-2 bg-background border-border" value={data.status} onChange={e => setData('status', e.target.value)}>
                                                        <option value="pending">Pending</option>
                                                        <option value="confirmed">Confirmed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-sm font-bold mb-2 block dark:text-white">Add Services</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                                {services.map(svc => {
                                                    const selected = data.selected_services.find(s => s.id === svc.id);
                                                    const qty = selected?.quantity || 0;
                                                    
                                                    return (
                                                        <div key={svc.id} className={`p-3 border rounded-lg flex justify-between items-center transition-all ${qty > 0 ? 'border-primary bg-primary/10 dark:bg-primary/20' : 'border-border'}`}>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium dark:text-white">{svc.services_name}</span>
                                                                <span className="text-xs text-gray-500">₱{svc.services_price}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3 bg-background rounded-md border border-border px-2 py-1">
                                                                <button type="button" onClick={() => updateServiceQuantity(svc.id, -1)} disabled={qty === 0} className="text-gray-500 hover:text-red-500 disabled:opacity-30"><Minus className="size-3"/></button>
                                                                <span className="text-xs font-bold w-3 text-center dark:text-white">{qty}</span>
                                                                <button type="button" onClick={() => updateServiceQuantity(svc.id, 1)} className="text-gray-500 hover:text-primary"><Plus className="size-3"/></button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </div>

                            {/* RIGHT SIDE: SUMMARY */}
                            {step === 'form' && (
                                <div className="w-full md:w-80 bg-muted p-8 border-l flex flex-col justify-between border-border">
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-lg dark:text-white">Estimate</h3>
                                        <div className="flex justify-between text-sm dark:text-gray-300"><span>Room ({priceDetails.nights} nights)</span><span>₱{priceDetails.roomTotal.toLocaleString()}</span></div>
                                        <div className="flex justify-between text-sm dark:text-gray-300"><span>Services</span><span>₱{priceDetails.servicesTotal.toLocaleString()}</span></div>
                                        <div className="border-t pt-4 flex justify-between font-bold text-xl text-primary"><span>Total</span><span>₱{priceDetails.grandTotal.toLocaleString()}</span></div>
                                    </div>
                                    <div className="flex gap-2 mt-8">
                                        <button onClick={() => setStep('calendar')} className="flex-1 py-2 border rounded hover:bg-muted">Back</button>
                                        <button onClick={submit} disabled={processing} className="flex-1 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50">Confirm</button>
                                    </div>
                                </div>
                            )}
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}