import { Fragment, FormEventHandler, useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Dialog, Transition } from '@headlessui/react';
import { 
    Loader2, Save, X, User, Mail, Lock, 
    Shield, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// --- Import your Wayfinder route definition ---
import usermanagement from '@/routes/usermanagement';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateUserModal({ isOpen, onClose }: Props) {
    const [isSuccess, setIsSuccess] = useState(false);
    
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'staff',
    });


    useEffect(() => {
        if (isOpen) {
            clearErrors();
            setIsSuccess(false);
            reset();
        }
    }, [isOpen]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // FIX: Use Wayfinder directly. Do NOT wrap it in route()
        post(usermanagement.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setIsSuccess(true);
                // Show success animation for 1.5s before closing
                setTimeout(() => {
                    onClose();
                    setTimeout(() => setIsSuccess(false), 300);
                }, 1500);
            },
            onError: (err) => {
                console.error("Submission error:", err);
            }
        });
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Backdrop Fade */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        {/* Modal Pop Animation */}
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300" 
                            enterFrom="opacity-0 scale-95 translate-y-4" 
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200" 
                            leaveFrom="opacity-100 scale-100 translate-y-0" 
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-card p-0 shadow-2xl transition-all border border-border">
                                
                                {/* Header */}
                                <div className="px-6 py-5 border-b border-border bg-muted/20 flex items-center justify-between">
                                    <div>
                                        <Dialog.Title as="h3" className="text-xl font-serif font-bold text-foreground">
                                            Register New User
                                        </Dialog.Title>
                                        <p className="text-xs text-muted-foreground mt-0.5">Create a new staff or admin account.</p>
                                    </div>
                                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                        <X className="size-5" />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <form onSubmit={submit} className="space-y-5">
                                        
                                        {/* Name Field */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Full Name</Label>
                                            <div className="relative group">
                                                <User className={`absolute left-3 top-1/2 -translate-y-1/2 size-4 transition-colors ${errors.name ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary'}`} />
                                                <Input 
                                                    id="name" 
                                                    value={data.name} 
                                                    onChange={(e) => setData('name', e.target.value)} 
                                                    className={`pl-10 h-11 transition-all ${errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                                    placeholder="e.g. Juan Dela Cruz" 
                                                />
                                            </div>
                                            {errors.name && <p className="text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-top-1"><AlertCircle size={12}/> {errors.name}</p>}
                                        </div>

                                        {/* Email Field */}
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Email Address</Label>
                                            <div className="relative group">
                                                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 size-4 transition-colors ${errors.email ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary'}`} />
                                                <Input 
                                                    id="email" 
                                                    type="email" 
                                                    value={data.email} 
                                                    onChange={(e) => setData('email', e.target.value)} 
                                                    className={`pl-10 h-11 transition-all ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                                    placeholder="user@estacabay.com" 
                                                />
                                            </div>
                                            {errors.email && <p className="text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-top-1"><AlertCircle size={12}/> {errors.email}</p>}
                                        </div>

                                        {/* Role Select */}
                                        <div className="space-y-2">
                                            <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Assign Role</Label>
                                            <div className="relative group">
                                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary" />
                                                <select
                                                    id="role"
                                                    value={data.role}
                                                    onChange={(e) => setData('role', e.target.value)}
                                                    className="w-full h-11 pl-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none cursor-pointer hover:bg-muted/50 transition-colors"
                                                >
                                                    <option value="staff">Staff (Limited Access)</option>
                                                    <option value="admin">Admin (Full Access)</option>
                                                    <option value="supperadmin">Super Admin (Owner)</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-[10px]">▼</div>
                                            </div>
                                            {errors.role && <p className="text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-top-1"><AlertCircle size={12}/> {errors.role}</p>}
                                        </div>

                                        {/* Passwords */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Password</Label>
                                                <div className="relative group">
                                                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 size-4 transition-colors ${errors.password ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary'}`} />
                                                    <Input 
                                                        id="password" 
                                                        type="password" 
                                                        value={data.password} 
                                                        onChange={(e) => setData('password', e.target.value)} 
                                                        className={`pl-10 h-11 transition-all ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                                    />
                                                </div>
                                                {errors.password && <p className="text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-top-1"><AlertCircle size={12}/> {errors.password}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="password_confirmation" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Confirm</Label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary" />
                                                    <Input 
                                                        id="password_confirmation" 
                                                        type="password" 
                                                        value={data.password_confirmation} 
                                                        onChange={(e) => setData('password_confirmation', e.target.value)} 
                                                        className="pl-10 h-11"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Actions with Animated Button */}
                                        <div className="pt-6 flex justify-end gap-3 border-t border-border mt-4">
                                            <Button type="button" variant="ghost" onClick={onClose} className="h-11">Cancel</Button>
                                            
                                            <Button 
                                                type="submit" 
                                                disabled={processing || isSuccess} 
                                                className={`h-11 min-w-[160px] font-bold uppercase tracking-widest text-xs transition-all duration-500 ease-in-out ${
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
                                                            <Loader2 className="h-4 w-4 animate-spin" /> 
                                                            <span>Saving...</span>
                                                        </>
                                                    ) : isSuccess ? (
                                                        <>
                                                            <CheckCircle2 className="h-4 w-4 animate-bounce" /> 
                                                            <span>Created!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="h-4 w-4" /> 
                                                            <span>Register User</span>
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