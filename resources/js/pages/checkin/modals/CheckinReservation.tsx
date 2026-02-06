import React from 'react';
import { Calendar, MapPin, Clock, CreditCard, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, // Added this import
    DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    reservation: any;
    onConfirm: (id: string) => void;
    processing: boolean;
}

export const CheckinReservation = ({ isOpen, onClose, reservation, onConfirm, processing }: Props) => {
    // 1. Guard against null reservation early
    if (!reservation) return null;

    // 2. Safe variable extraction to avoid 'undefined' errors during render
    const displayAmount = Number(reservation?.amount ?? 0);
    const reservationId = reservation?.id ? String(reservation.id) : '';
    const checkInDate = reservation?.check_in_date;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-card border-border p-0 overflow-hidden shadow-2xl">
                <div className="h-1.5 w-full bg-primary" />
                <div className="p-6">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-serif font-bold text-foreground">
                            Guest Folio 
                            <span className="text-muted-foreground font-sans text-xs font-normal ml-2 tracking-widest uppercase">
                                ID: {reservationId.slice(0, 8) || 'N/A'}
                            </span>
                        </DialogTitle>
                        {/* FIX: Added DialogDescription to resolve the Console Warning */}
                        <DialogDescription className="text-muted-foreground text-sm">
                            Review the guest details and bill summary before confirming check-in.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <section>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Guest Details</label>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                        {reservation?.guest_name?.charAt(0) || 'G'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground">{reservation?.guest_name || 'Guest'}</p>
                                        <p className="text-xs text-muted-foreground">{reservation?.total_guest || 0} Guests • {reservation?.category || 'Standard'}</p>
                                    </div>
                                </div>
                            </section>
                            <section>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Schedule</label>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-foreground">
                                        <Calendar className="size-4 text-primary" /> 
                                        {checkInDate ? format(parseISO(checkInDate), 'PPP') : 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-2 text-foreground">
                                        <Clock className="size-4 text-primary" /> 
                                        {checkInDate ? format(parseISO(checkInDate), 'p') : 'N/A'}
                                    </div>
                                </div>
                            </section>
                        </div>
                        <div className="space-y-6">
                            <section className="bg-muted/40 p-4 rounded-xl border border-border">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Assigned Unit</label>
                                <div className="flex items-center gap-2 text-foreground font-bold">
                                    <MapPin className="size-4 text-primary" /> {reservation?.room_name || 'Not assigned'}
                                </div>
                            </section>
                            <section>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Balance Due</label>
                                {/* FIX: Used safe local variable 'displayAmount' */}
                                <div className="text-2xl font-serif font-bold text-primary">
                                    ₱{displayAmount.toLocaleString()}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1 uppercase font-bold">
                                    <CreditCard size={10}/> Pending Payment
                                </div>
                            </section>
                        </div>
                    </div>

                    {reservation?.services?.length > 0 && (
                        <div className="mt-8 border-t border-border pt-6">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Add-on Services</label>
                            <div className="grid grid-cols-2 gap-2">
                                {reservation.services.map((s: any) => (
                                    <div key={s.id} className="flex justify-between items-center text-xs bg-muted/30 p-2 rounded-lg border border-border/40">
                                        <span className="text-foreground font-medium">{s.services_name}</span>
                                        <span className="text-muted-foreground font-bold">x{s.pivot?.quantity || 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter className="bg-muted/50 p-6 flex gap-3">
                    <Button variant="outline" onClick={onClose} disabled={processing} className="flex-1 border-border transition-colors">
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => onConfirm(reservation.id)} 
                        disabled={processing} 
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-[0.98]"
                    >
                        {processing ? 'Checking in...' : 'Confirm Check-in'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};