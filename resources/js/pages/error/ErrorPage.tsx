import React from 'react';
import { Link, Head } from '@inertiajs/react';

export default function Unauthorized() {
    return (
        <>
            <Head title="Unauthorized Access" />

            <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                <div className="w-full max-w-md px-6 py-8 bg-white shadow-lg rounded-xl border border-gray-200 text-center dark:bg-gray-800 dark:border-gray-700">
                    
                    {/* Icon Section */}
                    {/* Dark mode: slightly transparent red background, lighter red icon */}
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-auto">
                        <svg 
                            className="h-8 w-8 text-red-600 dark:text-red-400" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth="1.5" 
                            stroke="currentColor" 
                            aria-hidden="true"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    </div>

                    {/* Text Content */}
                    <div className="mt-6">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                            Access Denied
                        </h2>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            You do not have permission to view this page. This area is restricted to authorized users only.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex gap-4 justify-center">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center rounded-md bg-gray-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 transition-colors dark:bg-gray-200 dark:text-gray-800 dark:hover:bg-white"
                        >
                            Go Back Home
                        </Link>
                    </div>
                </div>
                
                {/* Footer / Error Code */}
                <p className="mt-8 text-xs text-gray-400 uppercase tracking-widest dark:text-gray-500">
                    Error Code: 403
                </p>
            </div>
        </>
    );
}