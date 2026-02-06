import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Wallet, AlertCircle } from 'lucide-react';

export const TransactionModal = ({ isOpen, onClose, reservation, onProcess, processing }: any) => {
    const [amount, setAmount] = useState<number | string>(0);

    useEffect(() => {
        if (reservation?.amount) setAmount(reservation.amount);
    }, [reservation]);

    const totalDue = Number(reservation?.amount || 0);
    const received = Number(amount) || 0;
    const isUnderpaid = received < totalDue;

    const handleSubmit = () => {
        if (isUnderpaid) return;
        // Only passing the amount now
        onProcess(received); 
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-card border-border shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-serif text-xl text-foreground">
                        <CreditCard className="text-primary size-5" /> Finalize Payment
                    </DialogTitle>
                    <DialogDescription>Confirm full payment received to complete check-in.</DialogDescription>
                </DialogHeader>
                
                <div className="py-4 space-y-5">
                    <div className="bg-muted/30 p-5 rounded-2xl border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Amount to Settle</p>
                        <p className="text-4xl font-serif font-bold text-primary">₱{totalDue.toLocaleString()}</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-end text-xs font-bold uppercase text-muted-foreground">
                            <label>Amount Received</label>
                            <button onClick={() => setAmount(totalDue)} className="text-primary hover:underline">Exact Amount</button>
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₱</span>
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className={`w-full bg-background border-2 rounded-xl py-4 pl-10 pr-4 text-2xl font-serif font-bold outline-none transition-all ${
                                    isUnderpaid && received > 0 ? 'border-destructive' : 'border-border focus:border-primary'
                                }`}
                            />
                        </div>
                        {isUnderpaid && received > 0 && (
                            <div className="flex items-center gap-2 p-2 text-destructive">
                                <AlertCircle size={14} />
                                <p className="text-[10px] font-bold uppercase italic">Partial payments are not permitted.</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex flex-row gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={processing} className="flex-1">Cancel</Button>
                    <Button 
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" 
                        onClick={handleSubmit}
                        disabled={processing || isUnderpaid}
                    >
                        {processing ? 'Processing...' : 'Complete Check-in'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};