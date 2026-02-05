import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    const form = useForm({
        email: '',
        password: '',
        remember: false,
    });

    return (
        <div className="min-h-screen w-full grid lg:grid-cols-2 font-sans text-[#2C3930]">
            <Head title="Log in" />

            {/* Custom Animation Styles - Made Slower and Subtler */}
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
                        src="/img/beach1.jpg" 
                        alt="Resort beach view" 
                        className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-[25s]" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>

                <div className="relative z-10 space-y-4 max-w-lg">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#FFFDE1] leading-tight drop-shadow-lg">
                        Ready for a break? <br />
                        Reserve your stay with us.
                    </h1>
                </div>
            </div>

            {/* --- RIGHT SIDE: Login Form --- */}
            <div className="flex flex-col justify-center items-center p-6 lg:p-12 bg-[#2C3930] relative overflow-hidden">
                
                {/* --- ANIMATED BACKGROUND CIRCLES (Subtler) --- */}
                
                {/* Top Right - Large Lime Circle */}
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#D8E983] rounded-full opacity-10 blur-3xl animate-float-slower" />
                
                {/* Middle Right - Green Circle */}
                <div className="absolute top-1/4 -right-8 w-32 h-32 bg-[#628141] rounded-full opacity-10 blur-2xl animate-float" />

                {/* Bottom Left - Large Lime Circle */}
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#D8E983] rounded-full opacity-5 blur-3xl animate-float-slow" />

                {/* Top Left - Small Green Circle */}
                <div className="absolute top-10 left-10 w-24 h-24 bg-[#628141] rounded-full opacity-10 blur-2xl animate-float-slow" />

                {/* --- FORM CONTENT --- */}
                <div className="w-full max-w-md space-y-8 relative z-10">
                    
                    <div className="space-y-2">
                        <Link href="/" className="inline-flex items-center text-[#D8E983] text-xs uppercase tracking-widest hover:text-white transition mb-6">
                            <ArrowLeft size={14} className="mr-1" /> Back to Home
                        </Link>
                        <h2 className="text-3xl font-serif font-bold text-[#FFFDE1]">Sign in</h2>
                        <p className="text-[#FFFDE1]/60 text-sm">
                            Don't have an account?{' '}
                            <Link href={register()} className="text-[#D8E983] hover:text-white hover:underline transition font-bold">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    {status && (
                        <div className="p-4 rounded-md bg-[#628141]/20 border border-[#628141] text-[#D8E983] text-sm font-medium text-center">
                            {status}
                        </div>
                    )}

                    <Form
                        method="post"
                        action={store()}
                        resetOnSuccess={['password']}
                        className="space-y-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[#FFFDE1] text-xs uppercase tracking-wider font-bold">
                                            Email address
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={form.data.email}
                                            onChange={(e) => form.setData('email', e.target.value)}
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            placeholder="name@example.com"
                                            className="bg-transparent border-[#FFFDE1]/20 text-[#FFFDE1] placeholder:text-[#FFFDE1]/30 focus:border-[#D8E983] focus:ring-[#D8E983]/50 h-12"
                                        />
                                        <InputError message={errors.email} className="text-red-400" />
                                    </div>

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
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder="Enter your password"
                                            className="bg-transparent border-[#FFFDE1]/20 text-[#FFFDE1] placeholder:text-[#FFFDE1]/30 focus:border-[#D8E983] focus:ring-[#D8E983]/50 h-12"
                                        />
                                        <InputError message={errors.password} className="text-red-400" />
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                checked={form.data.remember}
                                                onCheckedChange={(checked) => form.setData('remember', !!checked)}
                                                tabIndex={3}
                                                className="border-[#FFFDE1]/40 data-[state=checked]:bg-[#D8E983] data-[state=checked]:text-[#2C3930]"
                                            />
                                            <Label htmlFor="remember" className="text-[#FFFDE1]/80 text-sm font-normal cursor-pointer">
                                                Remember me
                                            </Label>
                                        </div>
                                        
                                        {canResetPassword && (
                                            <Link
                                                href={request()}
                                                className="text-xs text-[#D8E983] hover:text-white transition"
                                                tabIndex={5}
                                            >
                                                Forgot password?
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-[#FFFDE1] text-[#2C3930] hover:bg-white hover:scale-[1.01] transition-all font-bold uppercase text-xs tracking-widest shadow-lg"
                                    tabIndex={4}
                                    disabled={processing}
                                >
                                    {processing && <Spinner className="text-[#2C3930] mr-2" />}
                                    Log In
                                </Button>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </div>
    );
}