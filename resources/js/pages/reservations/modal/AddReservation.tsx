import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    X, Minus, Plus, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2, AlertCircle, Info, Bed
} from 'lucide-react';
import reservationRoute from '@/routes/reservation';
import { 
    format, addMonths, subMonths, startOfMonth, endOfMonth, 
    eachDayOfInterval, isSameDay, startOfToday, addHours, startOfDay, 
    isBefore, parseISO, isWithinInterval, areIntervalsOverlapping,
    endOfDay, isAfter, differenceInCalendarDays, differenceInHours
} from 'date-fns';
import { Button } from '@/components/ui/button';

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

interface ReservationFormState {
    room_id: string;
    guest_name: string;
    contact_number: string;
    total_guest: number;
    check_in_date: string;
    check_out_date: string;
    status: string;
    reservation_amount: number;
    selected_services: SelectedServiceItem[];
}

interface Props {
    rooms: Room[];
    services: Service[];
    isOpen: boolean;
    onClose: () => void;
    preSelectedRoomId?: number | null;
    role?: 'admin' | 'staff' | 'guest' | 'super_admin';
}

const BUFFER_HOURS = 3; 

export default function AddReservation({ 
    isOpen, onClose, rooms = [], services = [], 
    preSelectedRoomId = null, role = 'staff' 
}: Props) {
    
    const [step, setStep] = useState<'room' | 'calendar' | 'form'>('room');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm<ReservationFormState>({
        room_id: preSelectedRoomId ? preSelectedRoomId.toString() : '',
        guest_name: '',
        contact_number: '',
        total_guest: 1,
        check_in_date: '',
        check_out_date: '',
        status: 'pending',
        reservation_amount: 0,
        selected_services: [],
    });

    const selectedRoom = useMemo(() => rooms.find(r => String(r.id) === String(data.room_id)), [data.room_id, rooms]);
    const isAdminOrStaff = ['admin', 'super_admin', 'staff'].includes(role || 'staff');

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isOpen) {
            interval = setInterval(() => {
                router.reload({ 
                    only: ['rooms'], 
                    preserveScroll: true,
                    preserveState: true 
                });
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isOpen]);

    const validReservations = useMemo(() => {
        if (!selectedRoom?.reservations) return [];
        return selectedRoom.reservations.filter(res => {
            const status = res.status.toLowerCase();
            return ['pending', 'confirmed', 'checked-in'].includes(status);
        });
    }, [selectedRoom]);

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
                clearErrors();
                setStep('room');
                setSelectedDate(null);
                setCurrentMonth(new Date());
            }, 300);
        }
    }, [isOpen, preSelectedRoomId]);

    useEffect(() => {
        if (selectedRoom) {
            setData(prev => ({ ...prev, total_guest: selectedRoom.room_category?.room_capacity ?? 1 }));
        }
    }, [selectedRoom]);

    const daysInMonth = useMemo(() => {
        return eachDayOfInterval({ 
            start: startOfMonth(currentMonth), 
            end: endOfMonth(currentMonth) 
        });
    }, [currentMonth]);

    const getReservationsForDate = (date: Date) => {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        return validReservations.filter(res => {
            const start = parseISO(res.check_in_date);
            const end = parseISO(res.check_out_date);
            return areIntervalsOverlapping({ start: dayStart, end: dayEnd }, { start, end });
        });
    };

    const getEarliestAvailableTime = (date: Date) => {
        const standardCheckIn = addHours(startOfDay(date), 14); 
        const overlapping = validReservations.filter(res => {
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

        const nextDay = addHours(startOfDay(availableTime), 24 + 12); 

        setData(prev => ({
            ...prev,
            check_in_date: format(availableTime, "yyyy-MM-dd'T'HH:mm"),
            check_out_date: format(nextDay, "yyyy-MM-dd'T'HH:mm"),
        }));
        clearErrors(); 
        setStep('form');
    };

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

    const priceDetails = useMemo(() => {
        let roomTotal = 0; let nights = 0; let extraHours = 0;
        if (data.check_in_date && data.check_out_date && selectedRoom) {
            const start = new Date(data.check_in_date);
            const end = new Date(data.check_out_date);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
                nights = differenceInCalendarDays(end, start);
                if (nights === 0) nights = 1; 
                const standardCheckIn = addHours(startOfDay(start), 14);
                const standardCheckOut = addHours(startOfDay(end), 12);
                const earlyDiff = differenceInHours(standardCheckIn, start);
                const earlyHours = Math.max(0, earlyDiff);
                const lateDiff = differenceInHours(end, standardCheckOut);
                const lateHours = Math.max(0, lateDiff);
                extraHours = earlyHours + lateHours;
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
        post(reservationRoute.store.url(), { 
            onSuccess: () => onClose(),
            onError: (err) => {
                if (err.check_in_date || err.check_out_date || err.room_id) setStep('calendar');
            }
        });
    };

    const startingDayIndex = startOfMonth(currentMonth).getDay();
    const activeReservations = selectedDate ? getReservationsForDate(selectedDate) : [];
    const availableTimeSlot = selectedDate ? getEarliestAvailableTime(selectedDate) : null;
    const isFullyBooked = selectedDate && availableTimeSlot === null;

    const inputClass = (fieldName: keyof ReservationFormState) => `
        w-full border rounded-lg p-2.5 bg-background transition-all outline-none text-sm
        ${errors[fieldName] ? 'border-red-500 ring-2 ring-red-100' : 'border-border focus:ring-2 focus:ring-primary/20 focus:border-primary'}
    `;

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-0 sm:p-4">
                        <Dialog.Panel className="w-full max-w-5xl rounded-none sm:rounded-2xl bg-card shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-screen sm:min-h-[650px] border-x sm:border border-border">
                            
                            {/* Main Content Area */}
                            <div className="flex-1 flex flex-col h-full overflow-hidden">
                                <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <Dialog.Title className="text-2xl font-serif font-bold text-foreground">
                                                {step === 'room' && 'Select a Room'}
                                                {step === 'calendar' && 'Check Availability'}
                                                {step === 'form' && 'Finalize Details'}
                                            </Dialog.Title>
                                            <div className="flex gap-1.5 mt-2">
                                                <div className={`h-1 w-8 rounded-full ${step === 'room' ? 'bg-primary' : 'bg-muted'}`} />
                                                <div className={`h-1 w-8 rounded-full ${step === 'calendar' ? 'bg-primary' : 'bg-muted'}`} />
                                                <div className={`h-1 w-8 rounded-full ${step === 'form' ? 'bg-primary' : 'bg-muted'}`} />
                                            </div>
                                        </div>
                                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                                            <X className="text-muted-foreground size-6" />
                                        </button>
                                    </div>

                                    {/* Error Banner */}
                                    {Object.keys(errors).length > 0 && (
                                        <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in zoom-in duration-200">
                                            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                                            <div className="text-sm">
                                                <h3 className="font-bold text-destructive">Submission Error</h3>
                                                <ul className="list-disc list-inside mt-1 text-destructive/80">
                                                    {Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 1: ROOM SELECTION */}
                                    {step === 'room' && (
                                        <div className="animate-in slide-in-from-bottom-4 duration-300">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {rooms.map(room => (
                                                    <div 
                                                        key={room.id}
                                                        onClick={() => { setData('room_id', room.id.toString()); setStep('calendar'); }}
                                                        className="group p-5 border border-border rounded-2xl hover:border-primary hover:shadow-xl cursor-pointer transition-all bg-muted/30 hover:bg-card relative overflow-hidden"
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="font-bold text-lg text-foreground">{room.room_name}</div>
                                                            <Bed className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        </div>
                                                        <div className="text-[10px] font-bold text-primary bg-primary/10 inline-block px-2 py-0.5 rounded uppercase tracking-widest mb-3">
                                                            {room.room_category?.room_category}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Max {room.max_extra_person} guests • <span className="font-bold text-foreground">₱{room.room_category?.price.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 2: CALENDAR */}
                                    {step === 'calendar' && (
                                        <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                                                <button onClick={() => setStep('room')} className="w-full sm:w-auto text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 font-bold uppercase tracking-wider transition-colors">
                                                    <ChevronLeft className="size-4"/> Change Room
                                                </button>
                                                <div className="flex items-center gap-4 bg-muted px-4 py-2 rounded-xl border border-border">
                                                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-card rounded-md transition-colors"><ChevronLeft className="size-4"/></button>
                                                    <span className="font-serif font-bold text-sm w-32 text-center uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy')}</span>
                                                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-card rounded-md transition-colors"><ChevronRight className="size-4"/></button>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-2">
                                                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
                                            </div>
                                            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-6">
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
                                                            onClick={() => { setSelectedDate(day); clearErrors(); }}
                                                            className={`
                                                                aspect-square sm:h-12 rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all relative border
                                                                ${isPast ? 'opacity-20 cursor-not-allowed bg-muted' : 'hover:border-primary'}
                                                                ${isSelected ? 'ring-4 ring-primary/10 border-primary bg-primary text-primary-foreground' : 'bg-muted/20 border-border text-foreground'}
                                                            `}
                                                        >
                                                            {format(day, 'd')}
                                                            {hasRes && !isSelected && <div className="mt-1 w-1 h-1 rounded-full bg-accent" />}
                                                        </button>
                                                    )
                                                })}
                                            </div>

                                            <div className="mt-auto bg-muted/50 rounded-2xl p-5 border border-border">
                                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                                                    Availability for: {selectedDate ? format(selectedDate, 'EEEE, MMMM do') : 'Select a date'}
                                                </h4>
                                                {selectedDate ? (
                                                    <div className="space-y-4">
                                                        <div className={`flex items-center gap-3 text-sm font-bold ${isFullyBooked ? 'text-destructive' : 'text-primary'}`}>
                                                            {isFullyBooked ? <XCircle className="size-5"/> : <CheckCircle className="size-5"/>}
                                                            <span>{isFullyBooked ? 'Fully Booked' : `Check-in from ${format(availableTimeSlot!, 'h:mm a')}`}</span>
                                                        </div>
                                                        {activeReservations.length > 0 && (
                                                            <div className="bg-card p-3 rounded-xl border border-border overflow-hidden">
                                                                <p className="text-[10px] text-muted-foreground font-bold uppercase mb-2">Occupied Periods</p>
                                                                <div className="max-h-24 overflow-y-auto space-y-1 pr-2 scrollbar-thin">
                                                                    {activeReservations.map(res => (
                                                                        <div key={res.id} className="text-[11px] flex justify-between text-muted-foreground">
                                                                            <span className="font-mono">{format(parseISO(res.check_in_date), 'h:mm a')} - {format(parseISO(res.check_out_date), 'h:mm a')}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {!isFullyBooked && <div className="mt-2 flex items-center gap-1.5 text-[10px] text-accent font-bold italic"><Info size={12}/> +{BUFFER_HOURS}h cleaning buffer</div>}
                                                            </div>
                                                        )}
                                                        <Button 
                                                            onClick={confirmDateSelection}
                                                            disabled={isFullyBooked}
                                                            className="w-full h-12 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 uppercase tracking-widest"
                                                        >
                                                            {isFullyBooked ? 'No Vacancy' : 'Confirm Date'}
                                                        </Button>
                                                    </div>
                                                ) : <div className="text-sm text-muted-foreground italic text-center py-4">Click a date on the calendar to see available slots.</div>}
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 3: DETAILS FORM */}
                                    {step === 'form' && (
                                        <div className="animate-in slide-in-from-right-4 duration-300">
                                            <div className="flex items-center justify-between bg-primary/10 p-4 rounded-2xl border border-primary/20 mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary text-primary-foreground rounded-lg"><Bed size={18}/></div>
                                                    <div>
                                                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest leading-none mb-1">Room Selection</p>
                                                        <p className="font-serif font-bold text-foreground">{selectedRoom?.room_name}</p>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => setStep('calendar')} className="text-xs font-bold text-primary hover:underline uppercase tracking-tighter">Change</button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Guest Name</label>
                                                    <input className={inputClass('guest_name')} placeholder="Full Name" value={data.guest_name} onChange={e => setData('guest_name', e.target.value)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Contact Number</label>
                                                    <input className={inputClass('contact_number')} placeholder="09xxxxxxxxx" type="tel" maxLength={11} value={data.contact_number} onChange={e => setData('contact_number', e.target.value.replace(/\D/g, ''))} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Check-in</label>
                                                    <input type="datetime-local" className={inputClass('check_in_date')} value={data.check_in_date} onChange={e => setData('check_in_date', e.target.value)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Check-out</label>
                                                    <input type="datetime-local" className={inputClass('check_out_date')} value={data.check_out_date} onChange={e => setData('check_out_date', e.target.value)} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Total Guests</label>
                                                    <input type="number" className={inputClass('total_guest')} value={data.total_guest} onChange={e => setData('total_guest', parseInt(e.target.value))} min={1} />
                                                </div>
                                                {isAdminOrStaff && (
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Booking Status</label>
                                                        <select className={inputClass('status')} value={data.status} onChange={e => setData('status', e.target.value)}>
                                                            <option value="pending">Pending</option>
                                                            <option value="confirmed">Confirmed</option>
                                                            <option value="cancelled">Cancelled</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Additional Services</label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                                                    {services.map(svc => {
                                                        const selected = data.selected_services.find(s => s.id === svc.id);
                                                        const qty = selected?.quantity || 0;
                                                        return (
                                                            <div key={svc.id} className={`p-3 border rounded-xl flex justify-between items-center transition-all ${qty > 0 ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                                                <div>
                                                                    <p className="text-xs font-bold text-foreground">{svc.services_name}</p>
                                                                    <p className="text-[10px] text-muted-foreground font-mono">₱{svc.services_price}</p>
                                                                </div>
                                                                <div className="flex items-center gap-3 bg-card p-1 rounded-lg border border-border">
                                                                    <button type="button" onClick={() => updateServiceQuantity(svc.id, -1)} disabled={qty === 0} className="p-1 hover:text-destructive disabled:opacity-20"><Minus size={12}/></button>
                                                                    <span className="text-xs font-bold w-4 text-center">{qty}</span>
                                                                    <button type="button" onClick={() => updateServiceQuantity(svc.id, 1)} className="p-1 hover:text-primary"><Plus size={12}/></button>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sidebar / Estimate Section */}
                            {step === 'form' && (
                                <div className="w-full md:w-80 bg-muted/50 p-6 md:p-8 border-t md:border-t-0 md:border-l border-border flex flex-col justify-between">
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
                                            <Info size={18} className="text-primary" /> Cost Summary
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                                <span>Room ({priceDetails.nights}n {priceDetails.extraHours > 0 && `+ ${priceDetails.extraHours}h`})</span>
                                                <span className="text-foreground">₱{priceDetails.roomTotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                                <span>Services</span>
                                                <span className="text-foreground">₱{priceDetails.servicesTotal.toLocaleString()}</span>
                                            </div>
                                            <div className="pt-4 border-t border-border flex justify-between items-end">
                                                <span className="text-sm font-bold text-primary uppercase">Estimated Total</span>
                                                <span className="text-3xl font-serif font-bold text-primary leading-none">₱{priceDetails.grandTotal.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-10">
                                        <Button variant="outline" onClick={() => setStep('calendar')} className="flex-1 h-12 border-border font-bold uppercase text-[10px] tracking-widest">Back</Button>
                                        <Button 
                                            onClick={submit} 
                                            disabled={processing} 
                                            className="flex-1 h-12 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 uppercase tracking-widest"
                                        >
                                            {processing ? <Loader2 className="animate-spin size-4" /> : 'Confirm'}
                                        </Button>
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