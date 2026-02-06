import React from 'react';
import { Link, Head } from '@inertiajs/react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function Unauthorized() {
    return (
        <>
            <Head title="Unauthorized Access" />

            <div className="min-h-screen flex flex-col justify-center items-center bg-[#F9FAFB] font-sans text-[#2C3930] p-6">
                
                {/* Brand Logo (Optional, adds context) */}
                <div className="mb-8 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                    <img 
                        src="/img/logo.jpg" 
                        alt="Estaca Bay Logo" 
                        className="h-16 w-16 object-contain rounded-full border-2 border-white shadow-md mb-3" 
                    />
                    <span className="text-xl font-serif font-bold text-[#2C3930] tracking-wide">Estaca Bay</span>
                </div>

                <div className="w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden relative">
                    {/* Decorative Top Bar */}
                    <div className="h-2 w-full bg-[#2C3930]" />

                    <div className="px-8 py-10 text-center">
                        
                        {/* Icon Section */}
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 border border-red-100 mb-6 shadow-sm">
                            <ShieldAlert className="h-10 w-10 text-red-500" strokeWidth={1.5} />
                        </div>

                        {/* Text Content */}
                        <div className="space-y-3">
                            <h2 className="text-3xl font-serif font-bold text-[#2C3930]">
                                Access Denied
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                                You do not have permission to view this page. This area is restricted to authorized personnel only.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2C3930] px-5 py-2.5 text-sm font-bold text-[#FFFDE1] uppercase tracking-wider shadow-md hover:bg-[#628141] transition-all duration-300"
                            >
                                <Home size={16} />
                                Go Home
                            </Link>
                            
                            <button
                                onClick={() => window.history.back()}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-gray-600 uppercase tracking-wider border border-gray-200 hover:bg-gray-50 hover:text-[#2C3930] transition-all duration-300"
                            >
                                <ArrowLeft size={16} />
                                Go Back
                            </button>
                        </div>
                    </div>

                    {/* Footer / Error Code */}
                    <div className="bg-gray-50 py-3 text-center border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                            Error Code: 403
                        </p>
                    </div>
                </div>

                {/* Bottom decoration */}
                <div className="mt-8 text-center text-xs text-gray-400">
                    <p>&copy; {new Date().getFullYear()} Estaca Bay Resort. All rights reserved.</p>
                </div>
            </div>
        </>
    );
}