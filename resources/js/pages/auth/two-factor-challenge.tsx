import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import twoFactor from '@/routes/two-factor';
import { store } from '@/routes/two-factor/login';
import { Form, Head, useForm, Link } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useMemo, useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');
    const form = useForm({
        code: '',
        recovery_code: '',
    });

    const authConfigContent = useMemo<{
        title: string;
        description: string;
        toggleText: string;
    }>(() => {
        if (showRecoveryInput) {
            return {
                title: 'Recovery Code',
                description:
                    'Please confirm access to your account by entering one of your emergency recovery codes.',
                toggleText: 'Use authentication code',
            };
        }

        return {
            title: 'Two-Factor Authentication',
            description:
                'Enter the authentication code provided by your authenticator application.',
            toggleText: 'Use recovery code',
        };
    }, [showRecoveryInput]);

    const toggleRecoveryMode = (clearErrors: () => void): void => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode('');
    };

    return (
        <div className="min-h-screen w-full grid lg:grid-cols-2 font-sans text-[#2C3930]">
            <Head title="Two-Factor Authentication" />

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
                        src="/img/pool.jpg" 
                        alt="Resort pool" 
                        className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-[25s]" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>

                <div className="relative z-10 space-y-4 max-w-lg">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#FFFDE1] leading-tight drop-shadow-lg">
                        Your security is <br />
                        our priority.
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
                    <div className="space-y-4 text-center lg:text-left">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFFDE1]/10 text-[#D8E983] mb-2 border border-[#D8E983]/20">
                            <ShieldCheck size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-serif font-bold text-[#FFFDE1]">{authConfigContent.title}</h2>
                            <p className="text-[#FFFDE1]/70 text-sm mt-2 leading-relaxed">
                                {authConfigContent.description}
                            </p>
                        </div>
                    </div>

                    <Form
                        method="post"
                        action={twoFactor.login.url()}
                        className="space-y-6"
                        resetOnError
                        resetOnSuccess={!showRecoveryInput}
                    >
                        {({ errors, processing, clearErrors }) => (
                            <>
                                {showRecoveryInput ? (
                                    <div className="space-y-2">
                                        <Label className="text-[#FFFDE1] text-xs uppercase tracking-wider font-bold">
                                            Recovery Code
                                        </Label>
                                        <Input
                                            name="recovery_code"
                                            type="text"
                                            placeholder="Enter recovery code"
                                            autoFocus={showRecoveryInput}
                                            required
                                            className="bg-transparent border-[#FFFDE1]/20 text-[#FFFDE1] placeholder:text-[#FFFDE1]/30 focus:border-[#D8E983] focus:ring-[#D8E983]/50 h-12"
                                        />
                                        <InputError message={errors.recovery_code} className="text-red-400" />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-center py-4">
                                            <InputOTP
                                                name="code"
                                                maxLength={OTP_MAX_LENGTH}
                                                value={code}
                                                onChange={(value) => setCode(value)}
                                                disabled={processing}
                                                pattern={REGEXP_ONLY_DIGITS}
                                                className="gap-2"
                                            >
                                                <InputOTPGroup className="gap-2">
                                                    {Array.from(
                                                        { length: OTP_MAX_LENGTH },
                                                        (_, index) => (
                                                            <InputOTPSlot
                                                                key={index}
                                                                index={index}
                                                                className="w-12 h-14 bg-[#FFFDE1]/5 border-[#FFFDE1]/20 text-[#FFFDE1] text-xl font-bold focus:border-[#D8E983] focus:ring-[#D8E983]/50 rounded-md transition-all"
                                                            />
                                                        ),
                                                    )}
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </div>
                                        <div className="text-center">
                                            <InputError message={errors.code} className="text-red-400" />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4 pt-2">
                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-[#FFFDE1] text-[#2C3930] hover:bg-white hover:scale-[1.01] transition-all font-bold uppercase text-xs tracking-widest shadow-lg"
                                        disabled={processing}
                                    >
                                        Confirm
                                    </Button>

                                    <div className="text-center">
                                        <button
                                            type="button"
                                            className="text-xs text-[#D8E983] hover:text-white underline underline-offset-4 transition-colors font-bold uppercase tracking-wider"
                                            onClick={() => toggleRecoveryMode(clearErrors)}
                                        >
                                            {authConfigContent.toggleText}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </div>
    );
}