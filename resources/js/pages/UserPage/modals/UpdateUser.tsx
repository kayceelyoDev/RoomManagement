import { Fragment, FormEventHandler, useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Dialog, Transition } from '@headlessui/react';
import { Loader2, Save, X, Shield, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import usermanagement from '@/routes/usermanagement'; // Wayfinder import

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

export default function UpdateUserModal({ isOpen, onClose, user }: Props) {
    const [isSuccess, setIsSuccess] = useState(false);

    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        role: '',
    });

    // Sync form with selected user when modal opens
    useEffect(() => {
        if (isOpen && user) {
            clearErrors();
            setIsSuccess(false);
            setData('role', user.role);
        }
    }, [isOpen, user]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        if (!user) return;

        // Wayfinder Usage
        put(usermanagement.update.url(user.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsSuccess(true);
                // Animation delay before closing
                setTimeout(() => {
                    onClose();
                    setTimeout(() => setIsSuccess(false), 300);
                }, 1500);
            },
            onError: (err) => {
                console.error("Update failed:", err);
            }
        });
    };

    if (!user) return null;

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Backdrop Animation */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        {/* Modal Animation */}
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-card p-0 shadow-xl transition-all border border-border">
                                
                                {/* Header */}
                                <div className="px-6 py-5 border-b border-border bg-muted/20 flex items-center justify-between">
                                    <div>
                                        <Dialog.Title as="h3" className="text-xl font-serif font-bold text-foreground">
                                            Update User Role
                                        </Dialog.Title>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Changing access for <span className="font-bold text-foreground">{user.name}</span>
                                        </p>
                                    </div>
                                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                        <X className="size-5" />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <form onSubmit={submit} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Assign Role</Label>
                                            
                                            {/* Stylized Select Wrapper */}
                                            <div className="relative group">
                                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                
                                                <select
                                                    id="role"
                                                    value={data.role}
                                                    onChange={(e) => setData('role', e.target.value)}
                                                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-input bg-background text-foreground text-sm ring-offset-background 
                                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
                                                    appearance-none cursor-pointer transition-all hover:bg-muted/30 hover:border-primary/50"
                                                >
                                                    <option value="staff" className="bg-background text-foreground py-2">
                                                        Staff (Limited Access)
                                                    </option>
                                                    <option value="admin" className="bg-background text-foreground py-2">
                                                        Admin (Full Access)
                                                    </option>
                                                    <option value="supperAdmin" className="bg-background text-foreground py-2 font-bold text-primary">
                                                        Super Admin (Owner)
                                                    </option>
                                                </select>

                                                {/* Custom Arrow Icon */}
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-foreground transition-colors">
                                                    <ChevronDown className="size-4" />
                                                </div>
                                            </div>
                                            
                                            {errors.role && (
                                                <p className="text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-top-1">
                                                    <AlertCircle size={12}/> {errors.role}
                                                </p>
                                            )}
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                                            <Button type="button" variant="ghost" onClick={onClose} className="h-11 rounded-xl">Cancel</Button>
                                            
                                            <Button 
                                                type="submit" 
                                                disabled={processing || isSuccess} 
                                                className={`h-11 min-w-[160px] rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all duration-500 ease-in-out ${
                                                    isSuccess 
                                                        ? 'bg-green-600 hover:bg-green-700 text-white scale-105 shadow-green-500/20 shadow-lg' 
                                                        : processing 
                                                            ? 'bg-primary/80 opacity-90 cursor-not-allowed' 
                                                            : 'bg-primary hover:bg-primary/90 shadow-primary/20 shadow-lg'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {processing ? (
                                                        <>
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> 
                                                            <span>Saving...</span>
                                                        </>
                                                    ) : isSuccess ? (
                                                        <>
                                                            <CheckCircle2 className="h-3.5 w-3.5 animate-bounce" /> 
                                                            <span>Role Updated!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="h-3.5 w-3.5" /> 
                                                            <span>Save Changes</span>
                                                        </>
                                                    )}
                                                </div>
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}