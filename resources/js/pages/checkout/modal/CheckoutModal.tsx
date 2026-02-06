import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogOut, MessageSquare, AlertTriangle, Home, User } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    reservation: any;
    onConfirm: (remarks: string) => void;
    processing: boolean;
}

export const CheckoutModal = ({ isOpen, onClose, reservation, onConfirm, processing }: Props) => {
    const [remarks, setRemarks] = useState('Room left in good condition. All keys returned.');

    if (!reservation) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-card border-border p-0 overflow-hidden shadow-2xl">
                {/* Visual indicator for Departure (Primary Color) */}
                <div className="h-1.5 w-full bg-primary" />
                
                <div className="p-6">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-serif font-bold flex items-center gap-2">
                            <LogOut className="text-primary" size={24} /> 
                            Finalize Departure
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Guest Summary Card */}
                        <div className="bg-muted/50 rounded-xl p-4 border border-border">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Guest</label>
                                    <p className="font-bold text-foreground flex items-center gap-2">
                                        <User size={14} className="text-primary"/> {reservation.guest_name}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Assigned Unit</label>
                                    <p className="font-bold text-primary flex items-center justify-end gap-2">
                                        <Home size={14}/> {reservation.room_name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Remarks Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                <MessageSquare size={12} /> Checkout Remarks (Required)
                            </label>
                            <textarea 
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="w-full h-28 bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none resize-none transition-all"
                                placeholder="e.g., Guest reported a minor leak, room is clean..."
                            />
                        </div>

                        {/* Safety Warning */}
                        <div className="flex gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <AlertTriangle className="text-primary shrink-0" size={18} />
                            <p className="text-[11px] text-muted-foreground leading-tight">
                                Confirming this will release the room back to the <strong>Available</strong> pool and finalize the billing record.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-muted/30 p-4 flex gap-3">
                    <Button variant="outline" onClick={onClose} disabled={processing} className="flex-1">
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => onConfirm(remarks)} 
                        disabled={processing || !remarks.trim()}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                    >
                        {processing ? 'Processing...' : 'Confirm Checkout'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};