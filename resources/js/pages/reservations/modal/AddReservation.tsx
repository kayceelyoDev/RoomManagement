import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    X, Minus, Plus, ChevronLeft, ChevronRight, CheckCircle, XCircle,
    Loader2, AlertCircle, Info, Bed, Clock, Calendar, Users, Phone, User, CreditCard, Sparkles
} from 'lucide-react';
import reservationRoute from '@/routes/reservation';
import {
    format, subMonths, startOfMonth, endOfMonth,
    eachDayOfInterval, isSameDay, startOfToday, addHours, startOfDay,
    isBefore, parseISO, areIntervalsOverlapping,
    differenceInCalendarDays, differenceInHours, isAfter, addMonths
} from 'date-fns';
import { Button } from '@/components/ui/button';
import ReCAPTCHA from "react-google-recaptcha";

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
        max_extra_bed: number;
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
    guest_email: string;
    total_guest: number;
    check_in_date: string;
    check_out_date: string;
    status: string;
    reservation_amount: number;
    selected_services: SelectedServiceItem[];
    'g-recaptcha-response'?: string;
}

interface Props {
    rooms: Room[];
    services: Service[];
    isOpen: boolean;
    onClose: () => void;
    preSelectedRoomId?: number | null;
    role?: 'admin' | 'staff' | 'guest' | 'supperAdmin';
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
    const isGuest = role === 'guest';
    const [requiresCaptcha, setRequiresCaptcha] = useState(false);

    const isAdminOrStaff = ['admin', 'supperAdmin', 'staff'].includes(role || 'staff');

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm<ReservationFormState>({
        room_id: preSelectedRoomId ? preSelectedRoomId.toString() : '',
        guest_name: '',
        contact_number: '',
        guest_email: '',
        total_guest: 1,
        check_in_date: '',
        check_out_date: '',
        status: 'pending',
        reservation_amount: 0,
        selected_services: [],
        'g-recaptcha-response': '',
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

    const serviceCounts = useMemo(() => {
        let extraPerson = 0;
        let extraBed = 0;

        data.selected_services.forEach(item => {
            const svc = services.find(s => s.id === item.id);
            if (!svc) return;
            const nameLower = svc.services_name.toLowerCase();
            if (nameLower.includes('extra person')) {
                extraPerson += item.quantity;
            } else if (nameLower.includes('extra bed')) {
                extraBed += item.quantity;
            }
        });

        return { extraPerson, extraBed };
    }, [data.selected_services, services]);

    // --- REAL-TIME CONFLICT & LIMIT CHECK ---
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

        const newEndWithBuffer = addHours(newEnd, BUFFER_HOURS);

        const hasConflict = validReservations.some(res => {
            const resStart = parseISO(res.check_in_date);
            const resEnd = parseISO(res.check_out_date);
            const resEndWithBuffer = addHours(resEnd, BUFFER_HOURS);
            return newStart < resEndWithBuffer && newEndWithBuffer > resStart;
        });

        if (hasConflict) {
            setLocalError("Time conflict detected (overlapping with existing booking or cleaning time).");
        } else {
            setLocalError(null);
        }

    }, [data.check_in_date, data.check_out_date, validReservations]);

    // --- CAPTCHA MONITOR ---
    useEffect(() => {
        if (isGuest) {
            setRequiresCaptcha(true);
        } else {
            setRequiresCaptcha(false);
        }
    }, [isGuest]);

    useEffect(() => {
        // @ts-ignore
        if (!isGuest) return;
        // @ts-ignore
        if (errors['g-recaptcha-response']) {
            setRequiresCaptcha(true);
        }
    }, [errors['g-recaptcha-response'], isGuest]);

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
        clearErrors('selected_services');
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

        const maxP = selectedRoom?.max_extra_person ?? 0;
        const maxB = selectedRoom?.room_category?.max_extra_bed ?? 0;

        if (localError) return;
        if (serviceCounts.extraPerson > maxP || serviceCounts.extraBed > maxB) return;

        post(reservationRoute.store.url(), {
            data: {
                ...data,
                selected_services: data.selected_services.length ? data.selected_services : [],
            },
            onSuccess: () => onClose(),
        });
    };

    const startingDayIndex = startOfMonth(currentMonth).getDay();
    const activeReservations = selectedDate ? getReservationsForDate(selectedDate) : [];

    const sortedReservations = [...activeReservations].sort((a, b) => {
        return parseISO(a.check_out_date).getTime() - parseISO(b.check_out_date).getTime();
    });

    const availableTimeSlot = selectedDate ? getEarliestAvailableTime(selectedDate) : null;
    const isFullyBooked = selectedDate && availableTimeSlot === null;

    const inputClass = "w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-sm text-foreground placeholder:text-muted-foreground/60";

    // --- Step Indicator ---
    const StepIndicator = ({ current, target, label, icon }: { current: string; target: string; label: string; icon: React.ReactNode }) => {
        const isActive = current === target;
        const isCompleted = (target === 'room' && current !== 'room') || (target === 'calendar' && current === 'form');
        return (
            <div className={`flex items-center gap-2 transition-all ${isActive ? 'text-primary' : isCompleted ? 'text-foreground/70' : 'text-muted-foreground/50'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${isActive ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30'
                    : isCompleted ? 'border-primary/60 bg-primary/10 text-primary'
                        : 'border-border bg-card'
                    }`}>
                    {isCompleted ? <CheckCircle size={13} /> : (target === 'room' ? 1 : target === 'calendar' ? 2 : 3)}
                </div>
                <span className={`text-xs font-semibold tracking-wide hidden sm:block`}>{label}</span>
            </div>
        );
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-md" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-0 sm:p-4 md:p-6">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel className="w-full md:max-w-6xl h-full sm:h-auto md:h-[88vh] md:max-h-[860px] sm:rounded-2xl md:rounded-2xl bg-background shadow-2xl flex flex-col lg:flex-row overflow-hidden border border-border/60">

                                {/* ═══════════════════════════════════════════
                                    LEFT PANEL — Main Content
                                ═══════════════════════════════════════════ */}
                                <div className="flex-1 flex flex-col h-full overflow-hidden">

                                    {/* Header */}
                                    <div className="px-5 py-4 md:px-8 md:py-5 flex justify-between items-center bg-card border-b border-border/60 shrink-0 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Bed size={16} className="text-primary" />
                                                </div>
                                                <Dialog.Title className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                                                    {step === 'room' && 'Select a Room'}
                                                    {step === 'calendar' && 'Pick Your Dates'}
                                                    {step === 'form' && 'Guest & Stay Details'}
                                                </Dialog.Title>
                                            </div>
                                            {/* Step Indicators */}
                                            <div className="flex items-center gap-2">
                                                <StepIndicator current={step} target="room" label="Room" icon={<Bed size={12} />} />
                                                <div className="h-px w-5 bg-border" />
                                                <StepIndicator current={step} target="calendar" label="Dates" icon={<Calendar size={12} />} />
                                                <div className="h-px w-5 bg-border" />
                                                <StepIndicator current={step} target="form" label="Details" icon={<User size={12} />} />
                                            </div>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* Scrollable Body */}
                                    <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">

                                        {/* Server Error Banner */}
                                        {Object.keys(errors).length > 0 && (
                                            <div className="mb-5 p-3 bg-destructive/5 border border-destructive/20 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2">
                                                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-semibold text-destructive">Please fix the errors below before submitting.</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* ─── STEP 1: ROOMS ─── */}
                                        {step === 'room' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-3 duration-400 pb-24 lg:pb-4">
                                                {rooms.map(room => (
                                                    <button
                                                        key={room.id}
                                                        type="button"
                                                        onClick={() => { setData('room_id', room.id.toString()); setStep('calendar'); }}
                                                        className="group text-left bg-card border border-border/70 hover:border-primary/50 hover:shadow-lg rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col focus:outline-none focus:ring-2 focus:ring-primary/30 active:scale-[0.98]"
                                                    >
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center text-primary transition-colors">
                                                                <Bed size={18} />
                                                            </div>
                                                            <span className="px-2.5 py-1 bg-secondary/40 text-secondary-foreground rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                                {room.room_category?.room_category}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-base font-bold text-foreground mb-1.5">{room.room_name}</h3>
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                                                            <Users size={12} />
                                                            <span>Up to {room.max_extra_person} extra guests</span>
                                                        </div>
                                                        <div className="pt-3 border-t border-border/50 flex items-center justify-between mt-auto">
                                                            <div>
                                                                <p className="text-[10px] text-muted-foreground font-medium">From</p>
                                                                <p className="text-lg font-bold text-foreground">₱{room.room_category?.price.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/night</span></p>
                                                            </div>
                                                            <div className="w-7 h-7 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center text-primary transition-all">
                                                                <ChevronRight size={14} />
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* ─── STEP 2: CALENDAR ─── */}
                                        {step === 'calendar' && (
                                            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-400 pb-24 lg:pb-4">
                                                {/* Change Room back link */}
                                                <button
                                                    onClick={() => setStep('room')}
                                                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors self-start -ml-1 px-2 py-1 rounded-lg hover:bg-muted"
                                                >
                                                    <ChevronLeft size={15} />
                                                    <span className="font-medium">Change Room</span>
                                                </button>
                                                {/* Selected Room Banner */}
                                                <div className="bg-card border border-border/70 rounded-2xl p-4 flex flex-wrap items-center gap-3">
                                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                                        <Bed size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Selected Room</p>
                                                        <p className="text-sm font-bold text-foreground truncate">{selectedRoom?.room_name}</p>
                                                    </div>
                                                    <div className="flex gap-5 text-center shrink-0">
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground font-medium">Capacity</p>
                                                            <p className="text-sm font-bold text-primary">{selectedRoom?.room_category?.room_capacity ?? 0} pax</p>
                                                        </div>
                                                        <div className="hidden sm:block">
                                                            <p className="text-[10px] text-muted-foreground font-medium">Extra Person</p>
                                                            <p className="text-sm font-bold text-primary">{selectedRoom?.max_extra_person ?? 0}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground font-medium">Price/Night</p>
                                                            <p className="text-sm font-bold text-primary">₱{selectedRoom?.room_category?.price?.toLocaleString() ?? 0}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setStep('room')}
                                                        className="text-xs font-semibold text-primary hover:underline shrink-0 px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors"
                                                    >
                                                        Change
                                                    </button>
                                                </div>

                                                {/* Month Navigator */}
                                                <div className="flex items-center justify-between bg-card border border-border/60 rounded-xl px-4 py-2.5">
                                                    <span className="text-sm font-bold text-foreground">{format(currentMonth, 'MMMM yyyy')}</span>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                                            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            <ChevronLeft size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                                            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            <ChevronRight size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Calendar Grid */}
                                                <div className="bg-card rounded-2xl border border-border/70 p-4 md:p-5">
                                                    <div className="grid grid-cols-7 mb-2">
                                                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                                            <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase py-1.5">{d}</div>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1 md:gap-1.5">
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
                                                                        relative rounded-xl flex flex-col items-center justify-center transition-all duration-200 border
                                                                        h-11 sm:h-14 md:h-16 text-xs font-semibold
                                                                        ${isPast ? 'opacity-20 cursor-not-allowed border-transparent bg-transparent text-muted-foreground' : 'cursor-pointer active:scale-95'}
                                                                        ${isSelected
                                                                            ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25 scale-105 z-10'
                                                                            : !isPast ? 'bg-card border-border/60 text-foreground hover:border-primary/40 hover:bg-primary/5'
                                                                                : ''
                                                                        }
                                                                    `}
                                                                >
                                                                    {format(day, 'd')}
                                                                    {hasRes && !isSelected && (
                                                                        <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-orange-400" />
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* ─── STEP 3: FORM ─── */}
                                        {step === 'form' && (
                                            <div className="animate-in fade-in slide-in-from-right-4 duration-400 max-w-3xl mx-auto w-full pb-28 lg:pb-4 space-y-6">

                                                {/* Selected Room Card */}
                                                <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-4">
                                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                                        <Bed size={22} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Selected Room</p>
                                                        <h3 className="text-base font-bold text-foreground truncate">{selectedRoom?.room_name}</h3>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{selectedRoom?.room_category?.room_category}</p>
                                                    </div>
                                                    <div className="hidden sm:flex gap-5 text-center shrink-0">
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground font-medium">Capacity</p>
                                                            <p className="text-base font-bold text-primary">{selectedRoom?.room_category?.room_capacity || 0}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground font-medium">Max Person</p>
                                                            <p className="text-base font-bold text-primary">{selectedRoom?.max_extra_person || 0}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground font-medium">Max Bed</p>
                                                            <p className="text-base font-bold text-primary">{selectedRoom?.room_category?.max_extra_bed || 0}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground font-medium">Price/Night</p>
                                                            <p className="text-base font-bold text-primary">₱{selectedRoom?.room_category?.price?.toLocaleString() || 0}</p>
                                                        </div>
                                                    </div>
                                                    {/* Mobile compact stats */}
                                                    <div className="sm:hidden flex gap-4 text-center w-full border-t border-border/40 pt-3">
                                                        <div className="flex-1">
                                                            <p className="text-[10px] text-muted-foreground font-medium">Capacity</p>
                                                            <p className="text-sm font-bold text-primary">{selectedRoom?.room_category?.room_capacity || 0}</p>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-[10px] text-muted-foreground font-medium">Max Person</p>
                                                            <p className="text-sm font-bold text-foreground">{selectedRoom?.max_extra_person || 0}</p>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-[10px] text-muted-foreground font-medium">Price/Night</p>
                                                            <p className="text-sm font-bold text-primary">₱{selectedRoom?.room_category?.price?.toLocaleString() || 0}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setStep('room')}
                                                        className="text-xs font-semibold text-primary hover:underline shrink-0 px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors"
                                                    >
                                                        Change
                                                    </button>
                                                </div>

                                                {/* Guest Information */}
                                                <div className="space-y-4">
                                                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-3">
                                                        <User size={13} /> Guest Information
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-semibold text-foreground/80">Full Name</label>
                                                            <input
                                                                className={`${inputClass} ${errors.guest_name && 'border-destructive bg-destructive/5'}`}
                                                                placeholder="e.g. Juan Dela Cruz"
                                                                value={data.guest_name}
                                                                onChange={e => setData('guest_name', e.target.value)}
                                                            />
                                                            {errors.guest_name && <p className="text-[10px] text-destructive font-medium mt-1">{errors.guest_name}</p>}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-semibold text-foreground/80">Phone Number</label>
                                                            <input
                                                                className={`${inputClass} ${errors.contact_number && 'border-destructive bg-destructive/5'}`}
                                                                placeholder="09XX XXX XXXX"
                                                                maxLength={11}
                                                                value={data.contact_number}
                                                                onChange={e => setData('contact_number', e.target.value.replace(/\D/g, ''))}
                                                            />
                                                            {errors.contact_number && <p className="text-[10px] text-destructive font-medium mt-1">{errors.contact_number}</p>}
                                                        </div>
                                                        {isAdminOrStaff && (
                                                            <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-top-2">
                                                                <label className="text-xs font-semibold text-foreground/80">Guest Email <span className="text-muted-foreground font-normal">(for booking confirmation)</span></label>
                                                                <input
                                                                    type="email"
                                                                    className={`${inputClass} ${errors.guest_email && 'border-destructive bg-destructive/5'}`}
                                                                    placeholder="guest@example.com"
                                                                    value={data.guest_email}
                                                                    onChange={e => setData('guest_email', e.target.value)}
                                                                    required={isAdminOrStaff}
                                                                />
                                                                {errors.guest_email && <p className="text-[10px] text-destructive font-medium mt-1">{errors.guest_email}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Stay Details */}
                                                <div className="space-y-4">
                                                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-3">
                                                        <Calendar size={13} /> Stay Details
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-foreground/80">Check-in</label>
                                                            <input
                                                                type="datetime-local"
                                                                className={`${inputClass} ${(errors.check_in_date || localError) && 'border-destructive bg-destructive/5'}`}
                                                                value={data.check_in_date}
                                                                onChange={e => setData('check_in_date', e.target.value)}
                                                            />
                                                            {(localError || errors.check_in_date) && (
                                                                <p className="text-[10px] font-semibold text-destructive flex items-center gap-1">
                                                                    <XCircle size={10} /> {localError || errors.check_in_date}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-foreground/80">Check-out</label>
                                                            <input
                                                                type="datetime-local"
                                                                className={`${inputClass} ${errors.check_out_date && 'border-destructive bg-destructive/5'}`}
                                                                value={data.check_out_date}
                                                                onChange={e => setData('check_out_date', e.target.value)}
                                                            />
                                                            {errors.check_out_date && <p className="text-[10px] text-destructive font-medium">{errors.check_out_date}</p>}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Capacity Info */}
                                                        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4">
                                                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-3">Room Capacity</p>


                                                            <div className="flex items-center justify-between pt-2 border-t border-border/40">
                                                                <span className="text-xs font-semibold text-foreground">Maximum Allowed</span>
                                                                <span className="text-xl font-bold text-primary">{(selectedRoom?.room_category?.room_capacity || 0) + (selectedRoom?.max_extra_person || 0)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {isAdminOrStaff && (
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-semibold text-foreground/80">Reservation Status</label>
                                                                <select
                                                                    className={inputClass}
                                                                    value={data.status}
                                                                    onChange={e => setData('status', e.target.value)}
                                                                >
                                                                    <option value="pending">Pending</option>
                                                                    <option value="confirmed">Confirmed</option>
                                                                    <option value="cancelled">Cancelled</option>
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Add-on Services */}
                                                <div className="space-y-4">
                                                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-3">
                                                        <Sparkles size={13} /> Add-on Services
                                                    </h4>

                                                    {/* Capacity Info Banner */}
                                                    <div className="bg-muted/60 border border-border/50 rounded-2xl p-4">
                                                        <p className="text-[10px] font-bold text-foreground/80 flex items-center gap-1.5 mb-2.5">
                                                            <Info size={11} className="text-primary" /> Capacity Limits
                                                        </p>
                                                        <ul className="text-[10px] text-muted-foreground space-y-1.5">
                                                            <li className="flex items-center justify-between">
                                                                <span className="text-foreground">Extra Person</span>
                                                                <span className="font-semibold text-foreground">{serviceCounts.extraPerson} <span className="text-muted-foreground font-normal">/ {selectedRoom?.max_extra_person || 0} max</span>
                                                                    {serviceCounts.extraPerson > (selectedRoom?.max_extra_person || 0) && <span className="ml-1 text-destructive font-bold">✕</span>}
                                                                </span>
                                                            </li>
                                                            <li className="flex items-center justify-between">
                                                                <span className='text-foreground'>Extra Bed</span>
                                                                <span className="font-semibold text-foreground">{serviceCounts.extraBed} <span className="text-muted-foreground font-normal">/ {selectedRoom?.room_category?.max_extra_bed || 0} max</span>
                                                                    {serviceCounts.extraBed > (selectedRoom?.room_category?.max_extra_bed || 0) && <span className="ml-1 text-destructive font-bold">✕</span>}
                                                                </span>
                                                            </li>
                                                        </ul>
                                                    </div>

                                                    {/* Limit Exceeded Warning */}
                                                    {(serviceCounts.extraPerson > (selectedRoom?.max_extra_person || 0) || serviceCounts.extraBed > (selectedRoom?.room_category?.max_extra_bed || 0)) && (
                                                        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 flex items-start gap-2.5 animate-in zoom-in-95 duration-200">
                                                            <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                                                            <div>
                                                                <p className="text-xs font-bold text-destructive mb-0.5">Capacity Limit Exceeded</p>
                                                                <p className="text-[10px] text-destructive/80">
                                                                    {serviceCounts.extraPerson > (selectedRoom?.max_extra_person || 0) && `Extra persons: ${serviceCounts.extraPerson} selected, max is ${selectedRoom?.max_extra_person || 0}. `}
                                                                    {serviceCounts.extraBed > (selectedRoom?.room_category?.max_extra_bed || 0) && `Extra beds: ${serviceCounts.extraBed} selected, max is ${selectedRoom?.room_category?.max_extra_bed || 0}.`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* @ts-ignore */}
                                                    {errors?.selected_services && (
                                                        <div className="flex items-center gap-1.5 text-destructive text-xs font-bold bg-destructive/5 px-3 py-2 rounded-lg border border-destructive/20">
                                                            <AlertCircle size={13} />
                                                            {/* @ts-ignore */}
                                                            {errors.selected_services}
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {services.map(svc => {
                                                            const selected = data.selected_services.find(s => s.id === svc.id);
                                                            const qty = selected?.quantity || 0;
                                                            return (
                                                                <div
                                                                    key={svc.id}
                                                                    className={`p-4 border rounded-2xl flex justify-between items-center transition-all duration-200 ${qty > 0 ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-border/60 bg-card'}`}
                                                                >
                                                                    <div>
                                                                        <p className="font-semibold text-sm text-foreground">{svc.services_name}</p>
                                                                        <p className="text-xs text-muted-foreground mt-0.5">₱{svc.services_price.toLocaleString()} / unit</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 bg-background rounded-xl border border-border/60 p-1.5">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateServiceQuantity(svc.id, -1)}
                                                                            disabled={qty === 0}
                                                                            className="w-7 h-7 flex items-center justify-center hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors active:scale-90"
                                                                        >
                                                                            <Minus size={11} />
                                                                        </button>
                                                                        <span className="w-6 text-center text-sm font-bold text-foreground">{qty}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateServiceQuantity(svc.id, 1)}
                                                                            className="w-7 h-7 flex items-center justify-center hover:bg-primary/10 rounded-lg text-primary transition-colors active:scale-90"
                                                                        >
                                                                            <Plus size={11} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* reCAPTCHA */}
                                                {requiresCaptcha && (
                                                    <div className="p-4 sm:p-5 bg-muted/50 border border-border/60 rounded-2xl space-y-3">
                                                        <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                                                            <AlertCircle size={12} className="text-primary" /> Security Verification
                                                        </label>
                                                        <p className="text-[10px] text-muted-foreground">Please verify you're human before submitting.</p>
                                                        <div className="overflow-x-auto">
                                                            <ReCAPTCHA
                                                                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                                                                onChange={(token) => setData('g-recaptcha-response', token || '')}
                                                            />
                                                        </div>
                                                        {/* @ts-ignore */}
                                                        {errors['g-recaptcha-response'] && (
                                                            <p className="text-xs text-destructive font-medium">
                                                                {/* @ts-ignore */}
                                                                {errors['g-recaptcha-response']}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ═══════════════════════════════════════════
                                    RIGHT PANEL — Sidebar / Summary
                                ═══════════════════════════════════════════ */}
                                <div className="w-full lg:w-[340px] bg-card border-t lg:border-t-0 lg:border-l border-border/60 flex flex-col shrink-0">

                                    {/* Calendar Sidebar */}
                                    {step === 'calendar' && (
                                        <div className="p-5 md:p-6 flex flex-col h-full">
                                            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                                <Calendar size={14} className="text-primary" /> Date Details
                                            </h3>
                                            {selectedDate ? (
                                                <div className="space-y-4 flex-1">
                                                    <div className="bg-primary rounded-xl p-4 text-primary-foreground text-center">
                                                        <div className="text-4xl font-bold">{format(selectedDate, 'd')}</div>
                                                        <div className="text-sm font-medium opacity-80">{format(selectedDate, 'EEEE')}</div>
                                                        <div className="text-xs opacity-60">{format(selectedDate, 'MMMM yyyy')}</div>
                                                    </div>

                                                    <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${isFullyBooked ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/15'}`}>
                                                        {isFullyBooked
                                                            ? <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                                                            : <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />}
                                                        <div>
                                                            <p className={`font-bold text-xs ${isFullyBooked ? 'text-destructive' : 'text-primary'}`}>
                                                                {isFullyBooked ? 'Fully Booked' : 'Available'}
                                                            </p>
                                                            {!isFullyBooked && availableTimeSlot && (
                                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                    Check-in from {format(availableTimeSlot, 'h:mm a')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {sortedReservations.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Day Schedule</p>
                                                            <div className="bg-background rounded-xl border border-border/50 p-3 space-y-2 max-h-[200px] overflow-y-auto">
                                                                {sortedReservations.map(res => {
                                                                    const start = parseISO(res.check_in_date);
                                                                    const end = parseISO(res.check_out_date);
                                                                    const isStart = isSameDay(start, selectedDate);
                                                                    const isEnd = isSameDay(end, selectedDate);
                                                                    return (
                                                                        <div key={res.id} className="pl-3 border-l-2 border-primary/30 text-xs space-y-0.5">
                                                                            {isStart && isEnd ? (
                                                                                <>
                                                                                    <div className="font-semibold text-foreground">In: {format(start, 'h:mm a')}</div>
                                                                                    <div className="font-semibold text-muted-foreground">Out: {format(end, 'h:mm a')}</div>
                                                                                </>
                                                                            ) : isStart ? (
                                                                                <div className="font-semibold text-foreground">Check-in: {format(start, 'h:mm a')}</div>
                                                                            ) : isEnd ? (
                                                                                <div className="font-semibold text-muted-foreground">Check-out: {format(end, 'h:mm a')}</div>
                                                                            ) : (
                                                                                <div className="text-muted-foreground italic">Full Day</div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                <Info size={10} /> {BUFFER_HOURS}h cleaning buffer applied
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground opacity-50 p-4">
                                                    <Calendar size={36} strokeWidth={1} className="mb-3" />
                                                    <p className="text-sm">Select a date on the calendar</p>
                                                </div>
                                            )}
                                            <div className="pt-4 mt-auto border-t border-border/50">
                                                <Button
                                                    onClick={confirmDateSelection}
                                                    disabled={!selectedDate || !!isFullyBooked}
                                                    className="w-full h-12 text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-md shadow-primary/20"
                                                >
                                                    {isFullyBooked ? 'Date Unavailable' : 'Confirm Date →'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Booking Summary Sidebar */}
                                    {step === 'form' && (
                                        <div className="p-5 md:p-6 flex flex-col h-full">
                                            <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
                                                <CreditCard size={14} className="text-primary" /> Booking Summary
                                            </h3>
                                            <div className="space-y-3 flex-1">
                                                {/* Room Charge */}
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground font-medium">Room Charge</span>
                                                        <span className="font-bold text-foreground">₱{priceDetails.roomTotal.toLocaleString()}</span>
                                                    </div>
                                                    <div className="pl-3 border-l-2 border-border/50 space-y-1">
                                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                                            <span>Duration</span>
                                                            <span className="font-semibold">{priceDetails.nights} Night(s)</span>
                                                        </div>
                                                        {priceDetails.lateHours > 0 && (
                                                            <div className="flex justify-between text-[10px] text-destructive font-semibold">
                                                                <span>Late Fee ({priceDetails.lateHours}h)</span>
                                                                <span>+₱{(priceDetails.lateHours * (selectedRoom?.room_category?.price ?? 0) * 0.10).toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {priceDetails.servicesTotal > 0 && (
                                                    <div className="flex justify-between items-center text-sm pt-3 border-t border-dashed border-border/50">
                                                        <span className="text-muted-foreground font-medium">Add-on Services</span>
                                                        <span className="font-bold text-foreground">₱{priceDetails.servicesTotal.toLocaleString()}</span>
                                                    </div>
                                                )}

                                                {/* Date info */}
                                                {data.check_in_date && data.check_out_date && (
                                                    <div className="text-[10px] text-muted-foreground pt-3 border-t border-border/30 space-y-0.5">
                                                        <div className="flex justify-between">
                                                            <span>Check-in</span>
                                                            <span className="font-semibold text-foreground">{format(new Date(data.check_in_date), 'MMM d, h:mm a')}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Check-out</span>
                                                            <span className="font-semibold text-foreground">{format(new Date(data.check_out_date), 'MMM d, h:mm a')}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Grand Total */}
                                                <div className="bg-primary/8 border border-primary/15 rounded-xl p-4 mt-auto">
                                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Total Due</p>
                                                    <p className="text-3xl font-bold text-primary">₱{priceDetails.grandTotal.toLocaleString()}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-1">Inclusive of all charges</p>
                                                </div>
                                            </div>

                                            <div className="pt-4 mt-auto border-t border-border/50 flex gap-3">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setStep('calendar')}
                                                    className="h-12 px-5 rounded-xl border-border text-foreground font-semibold hover:bg-muted"
                                                >
                                                    Back
                                                </Button>
                                                <Button
                                                    onClick={submit}
                                                    disabled={
                                                        processing ||
                                                        !!localError ||
                                                        serviceCounts.extraPerson > (selectedRoom?.max_extra_person ?? 0) ||
                                                        serviceCounts.extraBed > (selectedRoom?.room_category?.max_extra_bed ?? 0) ||
                                                        (requiresCaptcha && !data['g-recaptcha-response'])
                                                    }
                                                    className="flex-1 h-12 text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-md shadow-primary/20"
                                                >
                                                    {processing ? <Loader2 className="animate-spin w-4 h-4" /> : 'Confirm Booking'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Placeholder when on Room step */}
                                    {step === 'room' && (
                                        <div className="p-8 flex-1 flex flex-col items-center justify-center text-center text-muted-foreground hidden lg:flex">
                                            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                                                <Bed size={28} strokeWidth={1.5} className="opacity-40" />
                                            </div>
                                            <h4 className="text-sm font-bold text-foreground/60 mb-1">No Room Selected</h4>
                                            <p className="text-xs max-w-[180px] opacity-60">Choose a room from the list to get started.</p>
                                        </div>
                                    )}
                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}