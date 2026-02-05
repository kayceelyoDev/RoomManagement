import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function Register() {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    return (
        <div className="min-h-screen w-full grid lg:grid-cols-2 font-sans text-[#2C3930]">
            <Head title="Create an account" />

            {/* Custom Animation Styles (Same as Login for consistency) */}
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
                        src="/img/pool.jpg" 
                        alt="Paradise view" 
                        className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-[25s]" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>

                <div className="relative z-10 space-y-4 max-w-lg">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#FFFDE1] leading-tight drop-shadow-lg">
                        Join us today. <br />
                        Your paradise awaits.
                    </h1>
                </div>
            </div>

            {/* --- RIGHT SIDE: Register Form --- */}
            <div className="flex flex-col justify-center items-center p-6 lg:p-12 bg-[#2C3930] relative overflow-hidden">
                
                {/* --- ANIMATED BACKGROUND CIRCLES --- */}
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#D8E983] rounded-full opacity-10 blur-3xl animate-float-slower" />
                <div className="absolute top-1/4 -right-8 w-32 h-32 bg-[#628141] rounded-full opacity-10 blur-2xl animate-float" />
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#D8E983] rounded-full opacity-5 blur-3xl animate-float-slow" />
                <div className="absolute top-10 left-10 w-24 h-24 bg-[#628141] rounded-full opacity-10 blur-2xl animate-float-slow" />

                {/* --- FORM CONTENT --- */}
                <div className="w-full max-w-md space-y-8 relative z-10">
                    
                    {/* Header */}
                    <div className="space-y-2">
                        <Link href="/" className="inline-flex items-center text-[#D8E983] text-xs uppercase tracking-widest hover:text-white transition mb-6">
                            <ArrowLeft size={14} className="mr-1" /> Back to Home
                        </Link>
                        <h2 className="text-3xl font-serif font-bold text-[#FFFDE1]">Create Account</h2>
                        <p className="text-[#FFFDE1]/60 text-sm">
                            Already have an account?{' '}
                            <Link href={login()} className="text-[#D8E983] hover:text-white hover:underline transition font-bold">
                                Log in
                            </Link>
                        </p>
                    </div>

                    <Form
                        action={store.url()}
                        method="post"
                        resetOnSuccess={['password', 'password_confirmation']}
                        disableWhileProcessing
                        className="space-y-5"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="space-y-4">
                                    {/* Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-[#FFFDE1] text-xs uppercase tracking-wider font-bold">
                                            Full Name
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            name="name"
                                            value={form.data.name}
                                            onChange={(e) => form.setData('name', e.target.value)}
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="name"
                                            placeholder="Enter your full name"
                                            className="bg-transparent border-[#FFFDE1]/20 text-[#FFFDE1] placeholder:text-[#FFFDE1]/30 focus:border-[#D8E983] focus:ring-[#D8E983]/50 h-12"
                                        />
                                        <InputError message={errors.name} className="text-red-400" />
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[#FFFDE1] text-xs uppercase tracking-wider font-bold">
                                            Email Address
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={form.data.email}
                                            onChange={(e) => form.setData('email', e.target.value)}
                                            required
                                            tabIndex={2}
                                            autoComplete="email"
                                            placeholder="name@example.com"
                                            className="bg-transparent border-[#FFFDE1]/20 text-[#FFFDE1] placeholder:text-[#FFFDE1]/30 focus:border-[#D8E983] focus:ring-[#D8E983]/50 h-12"
                                        />
                                        <InputError message={errors.email} className="text-red-400" />
                                    </div>

                                    {/* Password */}
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
                                            required
                                            tabIndex={3}
                                            autoComplete="new-password"
                                            placeholder="Create a password"
                                            className="bg-transparent border-[#FFFDE1]/20 text-[#FFFDE1] placeholder:text-[#FFFDE1]/30 focus:border-[#D8E983] focus:ring-[#D8E983]/50 h-12"
                                        />
                                        <InputError message={errors.password} className="text-red-400" />
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation" className="text-[#FFFDE1] text-xs uppercase tracking-wider font-bold">
                                            Confirm Password
                                        </Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            name="password_confirmation"
                                            value={form.data.password_confirmation}
                                            onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                            required
                                            tabIndex={4}
                                            autoComplete="new-password"
                                            placeholder="Confirm your password"
                                            className="bg-transparent border-[#FFFDE1]/20 text-[#FFFDE1] placeholder:text-[#FFFDE1]/30 focus:border-[#D8E983] focus:ring-[#D8E983]/50 h-12"
                                        />
                                        <InputError message={errors.password_confirmation} className="text-red-400" />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-[#FFFDE1] text-[#2C3930] hover:bg-white hover:scale-[1.01] transition-all font-bold uppercase text-xs tracking-widest shadow-lg mt-6"
                                    tabIndex={5}
                                    disabled={processing}
                                    data-test="register-button"
                                >
                                    {processing && <Spinner className="text-[#2C3930] mr-2" />}
                                    Create Account
                                </Button>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </div>
    );
}