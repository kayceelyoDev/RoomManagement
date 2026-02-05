import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import password from '@/routes/password';
import { useForm, Head, Form, Link } from '@inertiajs/react';
import { ArrowLeft, LockKeyhole } from 'lucide-react';

export default function ConfirmPassword() {
    const form = useForm({ password: '' });

    return (
        <div className="min-h-screen w-full grid lg:grid-cols-2 font-sans text-[#2C3930]">
            <Head title="Confirm password" />

            {/* Custom Animation Styles */}
            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-10px) translateX(5px); }
                    100% { transform: translateY(0px) translateX(0px); }
                }
                @keyframes float-delayed {
                    0% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(8px) translateX(-5px); }
                    100% { transform: translateY(0px) translateX(0px); }
                }
                .animate-float {
                    animation: float 12s ease-in-out infinite;
                }
                .animate-float-slow {
                    animation: float-delayed 15s ease-in-out infinite;
                }
                .animate-float-slower {
                    animation: float 18s ease-in-out infinite;
                }
            `}</style>

            {/* --- LEFT SIDE: Image & Text --- */}
            <div className="relative hidden lg:flex flex-col justify-end p-12 overflow-hidden bg-[#2C3930]">
                <div className="absolute inset-0">
                    <img 
                        src="/img/beach3.jpg" 
                        alt="Security Check" 
                        className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-[25s]" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>

                <div className="relative z-10 space-y-4 max-w-lg">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#FFFDE1] leading-tight drop-shadow-lg">
                        Security check. <br />
                        Confirm it's really you.
                    </h1>
                </div>
            </div>

            {/* --- RIGHT SIDE: Form Content --- */}
            <div className="flex flex-col justify-center items-center p-6 lg:p-12 bg-[#2C3930] relative overflow-hidden">
                
                {/* --- ANIMATED BACKGROUND CIRCLES --- */}
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#D8E983] rounded-full opacity-10 blur-3xl animate-float-slower" />
                <div className="absolute top-1/4 -right-8 w-32 h-32 bg-[#628141] rounded-full opacity-10 blur-2xl animate-float" />
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#D8E983] rounded-full opacity-5 blur-3xl animate-float-slow" />
                
                {/* --- CONTENT CONTAINER --- */}
                <div className="w-full max-w-md space-y-8 relative z-10">
                    
                    {/* Header */}
                    <div className="space-y-4">
                        <Link href="/" className="inline-flex items-center text-[#D8E983] text-xs uppercase tracking-widest hover:text-white transition mb-4">
                            <ArrowLeft size={14} className="mr-1" /> Back
                        </Link>
                        
                        <div className="flex flex-col space-y-2">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFFDE1]/10 text-[#D8E983] mb-2 border border-[#D8E983]/20">
                                <LockKeyhole size={24} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-3xl font-serif font-bold text-[#FFFDE1]">Confirm Password</h2>
                            <p className="text-[#FFFDE1]/70 text-sm leading-relaxed">
                                This is a secure area of the application. Please confirm your password before continuing.
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <Form 
                        method="post" 
                        onSubmit={(e) => { e.preventDefault(); form.post(password.confirm.url()); }}
                        className="space-y-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-[#FFFDE1] text-xs uppercase tracking-wider font-bold">
                                            Password
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={form.data.password}
                                            onChange={(e) => form.setData('password', e.target.value)}
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                            autoFocus
                                            className="bg-transparent border-[#FFFDE1]/20 text-[#FFFDE1] placeholder:text-[#FFFDE1]/30 focus:border-[#D8E983] focus:ring-[#D8E983]/50 h-12"
                                        />
                                        <InputError message={errors.password} className="text-red-400" />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-[#FFFDE1] text-[#2C3930] hover:bg-white hover:scale-[1.01] transition-all font-bold uppercase text-xs tracking-widest shadow-lg"
                                    disabled={processing}
                                    data-test="confirm-password-button"
                                >
                                    {processing && <Spinner className="text-[#2C3930] mr-2" />}
                                    Confirm Password
                                </Button>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </div>
    );
}