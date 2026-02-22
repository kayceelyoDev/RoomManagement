import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    X, Minus, Plus, ChevronLeft, ChevronRight, CheckCircle, XCircle,
    Loader2, AlertCircle, Info, Bed, Clock, Calendar, Users, Phone, User, CreditCard
} from 'lucide-react';
import reservationRoute from '@/routes/reservation';
import {
    format, subMonths, startOfMonth, endOfMonth,
    eachDayOfInterval, isSameDay, startOfToday, addHours, startOfDay,
    isBefore, parseISO, areIntervalsOverlapping,
    differenceInCalendarDays, differenceInHours, isAfter
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
    guest_email: string; // <-- Just keep this
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
    const [localError, setLocalError] = useState<string | null>(null);

    const isAdminOrStaff = ['admin', 'super_admin', 'staff'].includes(role || 'staff');

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm<ReservationFormState>({
        room_id: preSelectedRoomId ? preSelectedRoomId.toString() : '',
        guest_name: '',
        contact_number: '',
        guest_email: '', // <-- Add this
        total_guest: 1,
        check_in_date: '',
        check_out_date: '',
        status: 'pending',
        reservation_amount: 0,
        selected_services: [],
    });

    const selectedRoom = useMemo(() => rooms.find(r => String(r.id) === String(data.room_id)), [data.room_id, rooms]);

    // --- Logic Hooks ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isOpen) {
            interval = setInterval(() => {
                router.reload({ only: ['rooms'], preserveScroll: true, preserveState: true });
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isOpen]);

    const validReservations = useMemo(() => {
        if (!selectedRoom?.reservations) return [];
        return selectedRoom.reservations.filter(res => {
            const status = res.status.toLowerCase().replace(/[-_ ]/g, '');
            return ['pending', 'confirmed', 'checkedin', 'checkedout'].includes(status);
        });
    }, [selectedRoom]);

    // --- REAL-TIME CONFLICT CHECK ---
    useEffect(() => {
        if (!data.check_in_date || !data.check_out_date) {
            setLocalError(null);
            return;
        }

        const newStart = new Date(data.check_in_date);
        const newEnd = new Date(data.check_out_date);

        if (newStart >= newEnd) {
            setLocalError("Check-out must be after check-in.");
            return;
        }

        // Add buffer to NEW reservation to check strict overlap
        const newEndWithBuffer = addHours(newEnd, BUFFER_HOURS);

        const hasConflict = validReservations.some(res => {
            const resStart = parseISO(res.check_in_date);
            const resEnd = parseISO(res.check_out_date);
            // Add buffer to EXISTING reservation
            const resEndWithBuffer = addHours(resEnd, BUFFER_HOURS);

            // STRICT OVERLAP LOGIC: (StartA < EndB) && (EndA > StartB)
            // 1. Is New Start BEFORE Existing End (+Buffer)?
            // 2. Is New End (+Buffer) AFTER Existing Start?
            return newStart < resEndWithBuffer && newEndWithBuffer > resStart;
        });

        if (hasConflict) {
            setLocalError("Time conflict detected (overlapping with existing booking or cleaning time).");
        } else {
            setLocalError(null);
        }

    }, [data.check_in_date, data.check_out_date, validReservations]);

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
                setLocalError(null);
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

    // --- Calendar Logic ---
    const daysInMonth = useMemo(() => {
        return eachDayOfInterval({
            start: startOfMonth(currentMonth),
            end: endOfMonth(currentMonth)
        });
    }, [currentMonth]);

    const getReservationsForDate = (date: Date) => {
        const dayStart = startOfDay(date);
        const dayEnd = addHours(dayStart, 24);
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
            // Simple overlap check for the day grid
            return areIntervalsOverlapping({ start: startOfDay(date), end: addHours(startOfDay(date), 24) }, { start, end });
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

    // --- Price Calculation ---
    const priceDetails = useMemo(() => {
        let roomTotal = 0;
        let nights = 0;
        let extraHours = 0;
        let lateHours = 0;

        if (data.check_in_date && data.check_out_date && selectedRoom) {
            const start = new Date(data.check_in_date);
            const end = new Date(data.check_out_date);

            if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
                nights = differenceInCalendarDays(end, start);
                if (nights === 0) nights = 1;

                const policyCheckOut = new Date(end);
                policyCheckOut.setHours(12, 0, 0, 0);

                if (isAfter(end, policyCheckOut)) {
                    lateHours = differenceInHours(end, policyCheckOut);
                }

                extraHours = lateHours;
                const roomPrice = selectedRoom.room_category?.price ?? 0;
                const hourlyFee = roomPrice * 0.10;

                roomTotal = (nights * roomPrice) + (extraHours * hourlyFee);
            }
        }
        const servicesTotal = data.selected_services.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return {
            grandTotal: roomTotal + servicesTotal,
            roomTotal,
            servicesTotal,
            nights,
            extraHours,
            lateHours
        };
    }, [data.check_in_date, data.check_out_date, selectedRoom, data.selected_services]);

    useEffect(() => { setData('reservation_amount', priceDetails.grandTotal); }, [priceDetails.grandTotal]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        // Prevent submission if local error exists
        if (localError) return;
        post(reservationRoute.store.url(), { onSuccess: () => onClose() });
    };

    const startingDayIndex = startOfMonth(currentMonth).getDay();
    const activeReservations = selectedDate ? getReservationsForDate(selectedDate) : [];

    const sortedReservations = [...activeReservations].sort((a, b) => {
        return parseISO(a.check_out_date).getTime() - parseISO(b.check_out_date).getTime();
    });

    const availableTimeSlot = selectedDate ? getEarliestAvailableTime(selectedDate) : null;
    const isFullyBooked = selectedDate && availableTimeSlot === null;

    const gradientBg = "bg-gradient-to-br from-background to-muted/30";
    const inputClass = "w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm";

    // --- Responsive Step Indicator ---
    const StepIndicator = ({ current, target, label }: { current: string, target: string, label: string }) => {
        const isActive = current === target;
        const isCompleted = (target === 'room' && current !== 'room') || (target === 'calendar' && current === 'form');
        return (
            <div className={`flex items-center gap-2 ${isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border-2 transition-all ${isActive ? 'border-primary bg-primary/10' : isCompleted ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}>
                    {isCompleted ? <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5" /> : (target === 'room' ? 1 : target === 'calendar' ? 2 : 3)}
                </div>
                <span className={`text-xs sm:text-sm font-medium ${isActive && 'font-bold'}`}>{label}</span>
            </div>
        );
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" />
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-0 md:p-4">
                        <Dialog.Panel className={`w-full md:max-w-6xl h-full md:h-[800px] md:rounded-3xl bg-card shadow-2xl flex flex-col lg:flex-row overflow-hidden ${gradientBg}`}>

                            {/* --- Left Panel (Main Content) --- */}
                            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                                <div className="px-4 py-4 md:px-8 md:pt-8 md:pb-4 flex justify-between items-start z-10 bg-card/80 backdrop-blur-md sticky top-0 border-b border-border/50">
                                    <div className="space-y-2 md:space-y-4">
                                        <Dialog.Title className="text-xl md:text-3xl font-serif font-bold text-foreground tracking-tight">
                                            {step === 'room' && 'Select Room'}
                                            {step === 'calendar' && 'Select Dates'}
                                            {step === 'form' && 'Guest Details'}
                                        </Dialog.Title>
                                        <div className="flex gap-3 md:gap-6">
                                            <StepIndicator current={step} target="room" label="Room" />
                                            <div className="h-px w-4 md:w-8 bg-border self-center" />
                                            <StepIndicator current={step} target="calendar" label="Date" />
                                            <div className="h-px w-4 md:w-8 bg-border self-center" />
                                            <StepIndicator current={step} target="form" label="Confirm" />
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="p-2 bg-muted/50 hover:bg-destructive/10 hover:text-destructive rounded-full transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-primary/10">
                                    {Object.keys(errors).length > 0 && (
                                        <div className="mb-6 p-3 bg-destructive/5 border border-destructive/20 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2">
                                            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-semibold text-destructive">Error</h4>
                                                <p className="text-xs text-destructive/80">Please check the fields below.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- STEP 1: ROOMS --- */}
                                    {step === 'room' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-20 lg:pb-0">
                                            {rooms.map(room => (
                                                <div
                                                    key={room.id}
                                                    onClick={() => { setData('room_id', room.id.toString()); setStep('calendar'); }}
                                                    className="group relative bg-card border border-border/60 hover:border-primary/50 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg active:scale-95 md:active:scale-100 flex flex-col"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="p-2.5 bg-primary/5 group-hover:bg-primary/10 rounded-xl text-primary"><Bed size={20} /></div>
                                                        <span className="px-2.5 py-1 bg-muted rounded-full text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{room.room_category?.room_category}</span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-foreground mb-1">{room.room_name}</h3>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                                                        <Users size={14} /> <span>Max {room.max_extra_person} Guests</span>
                                                    </div>
                                                    <div className="pt-3 border-t border-border/50 flex items-end justify-between mt-auto">
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">From</p>
                                                            <p className="text-lg font-bold text-foreground">₱{room.room_category?.price.toLocaleString()}</p>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><ChevronRight size={16} /></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* --- STEP 2: CALENDAR --- */}
                                    {step === 'calendar' && (
                                        <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-500 pb-4">
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                                                <button onClick={() => setStep('room')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-lg hover:bg-muted self-start sm:self-auto">
                                                    <ChevronLeft size={16} /> <span className="font-medium">Change Room</span>
                                                </button>
                                                <div className="flex items-center justify-between w-full sm:w-auto gap-4 bg-card border border-border rounded-xl p-1.5 pl-4 shadow-sm">
                                                    <span className="font-serif text-base font-bold text-foreground flex-1 text-center sm:min-w-[140px]">
                                                        {format(currentMonth, 'MMMM yyyy')}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-muted rounded-lg text-foreground"><ChevronLeft size={16} /></button>
                                                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-muted rounded-lg text-foreground"><ChevronRight size={16} /></button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-card rounded-2xl border border-border p-4 md:p-6 shadow-sm flex-1 flex flex-col">
                                                <div className="grid grid-cols-7 mb-2">
                                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                                        <div key={d} className="text-center text-[10px] sm:text-xs font-bold text-muted-foreground/50 uppercase py-2">{d}</div>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-7 gap-1 md:gap-3 flex-1">
                                                    {Array.from({ length: startingDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}
                                                    {daysInMonth.map((day) => {
                                                        const isPast = isBefore(day, startOfToday());
                                                        const hasRes = getReservationsForDate(day).length > 0;
                                                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                                                        return (
                                                            <button
                                                                key={day.toString()}
                                                                disabled={isPast}
                                                                onClick={() => { setSelectedDate(day); clearErrors(); }}
                                                                className={`
                                                                    relative rounded-lg md:rounded-xl flex flex-col items-center justify-center transition-all duration-200 border
                                                                    h-10 sm:h-16 md:h-auto md:min-h-[4rem]
                                                                    ${isPast ? 'opacity-30 cursor-not-allowed border-transparent' : 'hover:border-primary/50'}
                                                                    ${isSelected ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105 z-10' : 'bg-background border-border text-foreground'}
                                                                `}
                                                            >
                                                                <span className={`text-xs sm:text-sm font-bold`}>{format(day, 'd')}</span>
                                                                {hasRes && !isSelected && (
                                                                    <div className="mt-0.5 sm:mt-1 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-orange-400" />
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- STEP 3: FORM --- */}
                                    {step === 'form' && (
                                        <div className="animate-in slide-in-from-right-8 duration-500 max-w-3xl mx-auto w-full pb-20 lg:pb-0">
                                            <div className="bg-card border border-border rounded-2xl p-4 md:p-6 mb-6 flex items-center justify-between shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="hidden sm:flex w-12 h-12 bg-primary/10 rounded-xl items-center justify-center text-primary"><Bed size={24} /></div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Booking For</p>
                                                        <h3 className="text-lg md:text-xl font-serif font-bold text-foreground">{selectedRoom?.room_name}</h3>
                                                    </div>
                                                </div>
                                                <button onClick={() => setStep('room')} className="text-xs font-bold text-primary border-b border-primary/20 pb-0.5">Change</button>
                                            </div>

                                            <div className="grid gap-6 md:gap-8">
                                                {/* Guest Info */}

                                                <div className="space-y-4">
                                                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                        <User size={14} /> Guest Information
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-medium text-foreground ml-1">Full Name</label>
                                                            <input className={`${inputClass} ${errors.guest_name && 'border-destructive'}`} placeholder="John Doe" value={data.guest_name} onChange={e => setData('guest_name', e.target.value)} required />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-medium text-foreground ml-1">Phone Number</label>
                                                            <input className={`${inputClass} ${errors.contact_number && 'border-destructive'}`} placeholder="0912 345 6789" maxLength={11} value={data.contact_number} onChange={e => setData('contact_number', e.target.value.replace(/\D/g, ''))} required />
                                                        </div>

                                                        {/* ONLY staff sees this, so only staff fills it out */}
                                                        {isAdminOrStaff && (
                                                            <div className="space-y-1.5 md:col-span-2 animate-in fade-in slide-in-from-top-2">
                                                                <label className="text-xs font-medium text-foreground ml-1">Guest Email (For Booking Confirmation)</label>
                                                                <input
                                                                    type="email"
                                                                    className={`${inputClass} ${errors.guest_email && 'border-destructive'}`}
                                                                    placeholder="guest@example.com"
                                                                    value={data.guest_email}
                                                                    onChange={e => setData('guest_email', e.target.value)}
                                                                    required={isAdminOrStaff} // Forces staff to enter an email
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Stay Details */}
                                                <div className="space-y-4">
                                                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground"><Calendar size={14} /> Stay Details</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-medium text-foreground ml-1">Check-in</label>
                                                            {/* Update input class based on localError */}
                                                            <input type="datetime-local" className={`${inputClass} ${(errors.check_in_date || localError) && 'border-destructive bg-destructive/5'}`} value={data.check_in_date} onChange={e => setData('check_in_date', e.target.value)} />
                                                            {/* Show Local Error or Server Error */}
                                                            {(errors.check_in_date || localError) && (
                                                                <p className="text-[10px] font-bold text-destructive flex items-center gap-1">
                                                                    <XCircle size={10} /> {localError || errors.check_in_date}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-medium text-foreground ml-1">Check-out</label>
                                                            <input type="datetime-local" className={`${inputClass} ${errors.check_out_date && 'border-destructive'}`} value={data.check_out_date} onChange={e => setData('check_out_date', e.target.value)} />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-medium text-foreground ml-1">Total Guests</label>
                                                            <div className="flex items-center gap-4 bg-muted/30 border border-border rounded-xl p-2 w-full sm:w-fit">
                                                                <button onClick={() => setData('total_guest', Math.max(1, data.total_guest - 1))} className="p-2 hover:bg-background rounded-lg shadow-sm"><Minus size={14} /></button>
                                                                <span className="w-8 text-center font-bold text-sm">{data.total_guest}</span>
                                                                <button onClick={() => setData('total_guest', data.total_guest + 1)} className="p-2 hover:bg-background rounded-lg shadow-sm"><Plus size={14} /></button>
                                                            </div>
                                                        </div>
                                                        {isAdminOrStaff && (
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-foreground ml-1">Status</label>
                                                                <select className={inputClass} value={data.status} onChange={e => setData('status', e.target.value)}>
                                                                    <option value="pending">Pending</option>
                                                                    <option value="confirmed">Confirmed</option>
                                                                    <option value="cancelled">Cancelled</option>
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Extras */}
                                                <div className="space-y-4">
                                                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground"><Plus size={14} /> Extras</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {services.map(svc => {
                                                            const selected = data.selected_services.find(s => s.id === svc.id);
                                                            const qty = selected?.quantity || 0;
                                                            return (
                                                                <div key={svc.id} className={`p-3 border rounded-xl flex justify-between items-center ${qty > 0 ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                                                                    <div>
                                                                        <p className="font-medium text-sm text-foreground">{svc.services_name}</p>
                                                                        <p className="text-[10px] text-muted-foreground font-mono">₱{svc.services_price}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 bg-background rounded-lg border border-border p-1">
                                                                        <button type="button" onClick={() => updateServiceQuantity(svc.id, -1)} disabled={qty === 0} className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded text-foreground disabled:opacity-30"><Minus size={10} /></button>
                                                                        <span className="w-4 text-center text-xs font-bold">{qty}</span>
                                                                        <button type="button" onClick={() => updateServiceQuantity(svc.id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded text-primary"><Plus size={10} /></button>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* --- Right Panel: Sidebar / Summary --- */}
                            <div className="w-full lg:w-[350px] bg-muted/30 border-t lg:border-t-0 lg:border-l border-border flex flex-col flex-shrink-0">
                                {step === 'calendar' ? (
                                    <div className="p-4 md:p-8 flex flex-col h-full">
                                        <h3 className="font-serif text-lg md:text-xl font-bold mb-4 text-foreground">Selected Date</h3>
                                        {selectedDate ? (
                                            <div className="space-y-4 md:space-y-6 flex-1">
                                                <div className="bg-card p-4 md:p-6 rounded-2xl border border-border shadow-sm">
                                                    <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{format(selectedDate, 'd')}</div>
                                                    <div className="text-base md:text-lg font-medium text-muted-foreground">{format(selectedDate, 'EEEE')}</div>
                                                    <div className="text-xs md:text-sm text-muted-foreground">{format(selectedDate, 'MMMM yyyy')}</div>
                                                </div>
                                                <div className={`p-4 rounded-xl border flex items-start gap-3 ${isFullyBooked ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/20'}`}>
                                                    {isFullyBooked ? <XCircle className="w-5 h-5 text-destructive mt-0.5" /> : <CheckCircle className="w-5 h-5 text-primary mt-0.5" />}
                                                    <div>
                                                        <p className={`font-bold text-sm ${isFullyBooked ? 'text-destructive' : 'text-primary'}`}>{isFullyBooked ? 'Fully Booked' : 'Available'}</p>
                                                        {!isFullyBooked && (<p className="text-[10px] md:text-xs text-muted-foreground mt-1">Check-in allowed from {format(availableTimeSlot!, 'h:mm a')}</p>)}
                                                    </div>
                                                </div>
                                                {sortedReservations.length > 0 && (
                                                    <div className="space-y-3">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Day Schedule</p>
                                                        <div className="bg-background rounded-xl border border-border p-3 md:p-4 space-y-3 max-h-[200px] md:max-h-[300px] overflow-y-auto">
                                                            {sortedReservations.map(res => {
                                                                const start = parseISO(res.check_in_date);
                                                                const end = parseISO(res.check_out_date);
                                                                const isStart = isSameDay(start, selectedDate);
                                                                const isEnd = isSameDay(end, selectedDate);
                                                                return (
                                                                    <div key={res.id} className="relative pl-3 border-l-2 border-border text-xs">
                                                                        {isStart && isEnd ? (
                                                                            <div className="space-y-0.5"><div className="font-medium text-blue-500">In: {format(start, 'h:mm a')}</div><div className="font-medium text-orange-500">Out: {format(end, 'h:mm a')}</div></div>
                                                                        ) : isStart ? (
                                                                            <div className="font-medium text-blue-500">Check-in: {format(start, 'h:mm a')}</div>
                                                                        ) : isEnd ? (
                                                                            <div className="font-medium text-orange-500">Check-out: {format(end, 'h:mm a')}</div>
                                                                        ) : (
                                                                            <div className="text-muted-foreground italic">Full Day</div>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5"><Info size={10} /> {BUFFER_HOURS}h cleaning buffer</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-4 opacity-60">
                                                <Calendar size={40} strokeWidth={1} className="mb-3" />
                                                <p className="text-sm">Select a date on the calendar.</p>
                                            </div>
                                        )}
                                        <div className="pt-4 md:pt-6 mt-auto border-t border-border">
                                            <Button onClick={confirmDateSelection} disabled={!selectedDate || isFullyBooked} className="w-full h-12 md:h-14 text-sm md:text-base bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 rounded-xl">
                                                {isFullyBooked ? 'Unavailable' : 'Confirm Date'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : step === 'form' ? (
                                    <div className="p-4 md:p-8 flex flex-col h-full bg-card shadow-inner lg:shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] z-20">
                                        <h3 className="font-serif text-lg md:text-xl font-bold mb-4 md:mb-6 text-foreground flex items-center gap-2"><CreditCard size={18} /> Payment</h3>
                                        <div className="space-y-4 md:space-y-6 flex-1">
                                            <div className="space-y-2 md:space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-muted-foreground">Room Charge</span>
                                                    <span className="font-medium text-foreground">₱{priceDetails.roomTotal.toLocaleString()}</span>
                                                </div>
                                                <div className="pl-3 text-xs text-muted-foreground border-l-2 border-muted space-y-1">
                                                    <div className="flex justify-between"><span>Duration</span><span>{priceDetails.nights} Night(s)</span></div>
                                                    {priceDetails.lateHours > 0 && (<div className="flex justify-between text-orange-500"><span>Late Fee ({priceDetails.lateHours}h)</span><span>+₱{(priceDetails.lateHours * (selectedRoom?.room_category?.price ?? 0) * 0.10).toLocaleString()}</span></div>)}
                                                </div>
                                            </div>
                                            {priceDetails.servicesTotal > 0 && (
                                                <div className="flex justify-between items-center text-sm pt-3 border-t border-border border-dashed">
                                                    <span className="text-muted-foreground">Add-on Services</span>
                                                    <span className="font-medium text-foreground">₱{priceDetails.servicesTotal.toLocaleString()}</span>
                                                </div>
                                            )}
                                            <div className="bg-primary/5 rounded-xl p-3 md:p-4 mt-auto border border-primary/10">
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Total Due</p>
                                                <p className="text-2xl md:text-3xl font-serif font-bold text-primary">₱{priceDetails.grandTotal.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="pt-4 md:pt-6 mt-auto flex gap-3">
                                            <Button variant="outline" onClick={() => setStep('calendar')} className="h-12 md:h-14 px-4 md:px-6 rounded-xl border-border font-bold">Back</Button>
                                            {/* Disable button if localError is present */}
                                            <Button onClick={submit} disabled={processing || !!localError} className="flex-1 h-12 md:h-14 text-sm md:text-base bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 rounded-xl">
                                                {processing ? <Loader2 className="animate-spin size-5" /> : 'Confirm Booking'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 flex flex-col h-full justify-center items-center text-center text-muted-foreground hidden lg:flex">
                                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4"><Bed size={32} strokeWidth={1.5} className="opacity-50" /></div>
                                        <h3 className="text-lg font-bold text-foreground mb-2">Select a Room</h3>
                                        <p className="text-sm max-w-[200px]">Choose a room from the list.</p>
                                    </div>
                                )}
                            </div>

                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}