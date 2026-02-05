import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Mail, LogOut } from 'lucide-react';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <div className="min-h-screen w-full grid lg:grid-cols-2 font-sans text-[#2C3930]">
            <Head title="Email verification" />

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
                        src="/img/resort1.jpg" 
                        alt="Resort grounds" 
                        className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-[25s]" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>

                <div className="relative z-10 space-y-4 max-w-lg">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#FFFDE1] leading-tight drop-shadow-lg">
                        Almost there. <br />
                        Secure your sanctuary.
                    </h1>
                </div>
            </div>

            {/* --- RIGHT SIDE: Verification Content --- */}
            <div className="flex flex-col justify-center items-center p-6 lg:p-12 bg-[#2C3930] relative overflow-hidden text-center">
                
                {/* --- ANIMATED BACKGROUND CIRCLES --- */}
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#D8E983] rounded-full opacity-10 blur-3xl animate-float-slower" />
                <div className="absolute top-1/4 -right-8 w-32 h-32 bg-[#628141] rounded-full opacity-10 blur-2xl animate-float" />
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#D8E983] rounded-full opacity-5 blur-3xl animate-float-slow" />
                
                {/* --- CONTENT CONTAINER --- */}
                <div className="w-full max-w-md space-y-8 relative z-10">
                    
                    {/* Header Icon & Title */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-[#FFFDE1]/10 rounded-full flex items-center justify-center text-[#D8E983] mb-2 border border-[#D8E983]/20">
                            <Mail size={32} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-[#FFFDE1]">Check your inbox</h2>
                        <p className="text-[#FFFDE1]/70 text-sm leading-relaxed max-w-xs mx-auto">
                            Please verify your email address by clicking on the link we just emailed to you.
                        </p>
                    </div>

                    {/* Success Message */}
                    {status === 'verification-link-sent' && (
                        <div className="p-4 rounded-md bg-[#628141]/20 border border-[#628141] text-[#D8E983] text-sm font-medium animate-pulse">
                            A new verification link has been sent to the email address you provided during registration.
                        </div>
                    )}

                    {/* Action Buttons */}
                    <Form method="post" action={send()} className="space-y-6">
                        {({ processing }) => (
                            <div className="flex flex-col gap-4">
                                <Button 
                                    disabled={processing} 
                                    className="w-full h-12 bg-[#FFFDE1] text-[#2C3930] hover:bg-white hover:scale-[1.01] transition-all font-bold uppercase text-xs tracking-widest shadow-lg"
                                >
                                    {processing && <Spinner className="text-[#2C3930] mr-2" />}
                                    Resend Verification Email
                                </Button>

                                <Link
                                    href={logout()}
                                    method="post"
                                    as="button"
                                    className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D8E983] hover:text-white transition-colors py-2"
                                >
                                    <LogOut size={14} /> Log Out
                                </Link>
                            </div>
                        )}
                    </Form>
                </div>
            </div>
        </div>
    );
}