import { dashboard, login, register } from '@/routes';
import guest from '@/routes/guest';
import type { SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { 
    Phone, Facebook, MapPin, Mail, Menu, X, ArrowRight, 
    BedDouble, Utensils, Waves, Users, CheckCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';

// --- Types ---
interface RoomCategory {
    id: number;
    room_category: string;
    price: number;
    room_capacity: number;
}

interface Room {
    id: number;
    room_name: string;
    room_description: string;
    img_url: string;
    max_extra_person: number;
    room_amenities: string; 
    type_of_bed: string;
    status: string;
    room_category?: RoomCategory;
}

interface WelcomeProps {
    canRegister?: boolean;
    rooms: Room[];
}

export default function Welcome({ canRegister = true, rooms = [] }: WelcomeProps) {
    const { auth } = usePage<SharedData>().props;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    // Lock body scroll when mobile menu is open to prevent background scrolling
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileMenuOpen]);

    // --- Helper Functions ---
    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            setIsMobileMenuOpen(false); // Close menu first
            // Small timeout to allow menu to close before scrolling
            setTimeout(() => {
                // Adjustment for fixed header offset
                const headerOffset = 80; 
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.scrollY - headerOffset;
        
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }, 300);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const getRoomImage = (url: string | null) => {
        if (!url) return '/img/room1.jpg';
        if (url.startsWith('http') || url.startsWith('https')) {
            return url;
        }
        return `/storage/${url}`;
    };

    return (
        <>
            <Head title="Estaca Bay Resort" />
            
            <style>{`
                @keyframes float {
                    0% { transform: translate3d(0, 0, 0); }
                    50% { transform: translate3d(0, -15px, 0); }
                    100% { transform: translate3d(0, 0, 0); }
                }
                @keyframes float-slow {
                    0% { transform: translate3d(0, 0, 0); }
                    50% { transform: translate3d(10px, 10px, 0); }
                    100% { transform: translate3d(0, 0, 0); }
                }
                .animate-float { animation: float 8s ease-in-out infinite; will-change: transform; }
                .animate-float-slow { animation: float-slow 12s ease-in-out infinite; will-change: transform; }
            `}</style>
            
            <div className="min-h-screen bg-white font-sans text-[#2C3930] relative overflow-x-hidden">
                
                {/* --- NAVIGATION (UPDATED: Fixed Position) --- */}
                {/* Changed 'sticky' to 'fixed', added 'top-0 left-0 right-0' */}
                <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-[#2C3930]/5 transition-all">
                    <div className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto relative z-50">
                        
                        {/* Logo */}
                        <a href="#home" onClick={(e) => scrollToSection(e, 'home')} className="block hover:opacity-80 transition z-50 relative">
                            <img 
                                src="/img/logo.jpg" 
                                alt="Estaca Bay Logo" 
                                className="h-8 w-auto md:h-12 object-contain" 
                            />
                        </a>

                        {/* Desktop Menu */}
                        <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-[#2C3930]">
                            {['Home', 'About', 'Rooms', 'Amenities', 'Contact'].map((item) => (
                                <a 
                                    key={item}
                                    href={`#${item.toLowerCase()}`}
                                    onClick={(e) => scrollToSection(e, item.toLowerCase())}
                                    className="hover:text-[#628141] transition-colors duration-300 relative group"
                                >
                                    {item}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#628141] transition-all duration-300 group-hover:w-full"></span>
                                </a>
                            ))}
                        </nav>

                        {/* Desktop Auth Buttons */}
                        <div className="hidden md:flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={auth.user.role === 'guest' ? guest.guestpage.url() : dashboard.url()}
                                    className="px-6 py-2.5 bg-[#2C3930] text-[#FFFDE1] rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#628141] transition-all duration-300 shadow-lg shadow-[#2C3930]/20"
                                >
                                    {auth.user.role === 'guest' ? 'My Booking' : 'Dashboard'}
                                </Link>
                            ) : (
                                <>
                                    <Link href={login.url()} className="text-xs font-bold uppercase tracking-wider hover:text-[#628141] transition">
                                        Log in
                                    </Link>
                                    {canRegister && (
                                        <Link href={register.url()} className="px-6 py-2.5 bg-[#628141] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#4e6632] transition-all duration-300 shadow-md">
                                            Register
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Toggle Button */}
                        <button 
                            className="md:hidden text-[#2C3930] p-2 focus:outline-none" 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>

                    {/* --- MOBILE MENU OVERLAY --- */}
                    <div 
                        className={`fixed inset-0 bg-[#FFFDE1] z-40 flex flex-col items-center pt-32 pb-10 px-6 transition-all duration-300 ease-in-out md:hidden ${
                            isMobileMenuOpen 
                                ? 'opacity-100 visible translate-y-0' 
                                : 'opacity-0 invisible -translate-y-5 pointer-events-none'
                        }`}
                        style={{ height: '100dvh' }}
                    >
                        {/* Navigation Links */}
                        <nav className="flex flex-col items-center gap-8 w-full">
                            {['Home', 'About', 'Rooms', 'Amenities', 'Contact'].map((item) => (
                                <a 
                                    key={item} 
                                    href={`#${item.toLowerCase()}`} 
                                    onClick={(e) => scrollToSection(e, item.toLowerCase())} 
                                    className="text-2xl font-serif text-[#2C3930] hover:text-[#628141] transition-colors border-b border-transparent hover:border-[#628141]/30 pb-1"
                                >
                                    {item}
                                </a>
                            ))}
                        </nav>

                        {/* Separator */}
                        <div className="w-12 h-px bg-[#2C3930]/10 my-8"></div>

                        {/* Mobile Auth Buttons */}
                        <div className="flex flex-col gap-4 w-full max-w-xs mt-auto mb-8">
                            {auth.user ? (
                                <Link
                                    href={auth.user.role === 'guest' ? guest.guestpage.url() : dashboard.url()}
                                    className="w-full py-4 bg-[#2C3930] text-[#FFFDE1] text-center rounded-xl text-sm font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
                                >
                                    {auth.user.role === 'guest' ? 'My Booking' : 'Go to Dashboard'}
                                </Link>
                            ) : (
                                <>
                                    <Link 
                                        href={login.url()} 
                                        className="w-full py-4 border-2 border-[#2C3930] text-[#2C3930] text-center rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#2C3930] hover:text-[#FFFDE1] transition-colors"
                                    >
                                        Log in
                                    </Link>
                                    {canRegister && (
                                        <Link 
                                            href={register.url()} 
                                            className="w-full py-4 bg-[#628141] text-white text-center rounded-xl text-sm font-bold uppercase tracking-widest shadow-lg hover:bg-[#4e6632] transition-colors"
                                        >
                                            Register Now
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* --- HERO SECTION --- */}
                {/* Added pt-32 (padding-top) to compensate for fixed header */}
                <section id="home" className="bg-[#FFFDE1] px-6 pt-32 pb-20 lg:py-40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#D8E983] opacity-20 rounded-full blur-3xl pointer-events-none animate-float-slow transform-gpu"></div>
                    <div className="absolute bottom-20 left-10 w-64 h-64 bg-[#628141] opacity-10 rounded-full blur-3xl pointer-events-none animate-float transform-gpu"></div>

                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                        <div className="space-y-8 text-center lg:text-left">
                            <h1 className="text-5xl lg:text-7xl font-serif font-medium text-[#2C3930] leading-[1.1] tracking-tight">
                                Welcome to <br/> <span className="italic text-[#628141]">Estaca Bay</span>
                            </h1>
                            <p className="text-base md:text-lg text-[#2C3930]/80 max-w-lg mx-auto lg:mx-0 font-light leading-relaxed">
                                Where crystal waters meet lush greenery. Experience the perfect blend of relaxation and adventure in our tropical paradise.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                                <Link href={guest.guestpage.url()} className="group px-8 py-4 bg-[#2C3930] text-[#FFFDE1] font-bold uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-[#628141] transition duration-300 rounded-sm flex items-center justify-center gap-2">
                                    Book Your Stay <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="px-8 py-4 bg-transparent border border-[#2C3930] text-[#2C3930] font-bold uppercase text-xs tracking-[0.2em] hover:bg-[#2C3930] hover:text-[#FFFDE1] transition duration-300 rounded-sm">
                                    Explore
                                </a>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative">
                            <div className="space-y-4 mt-12">
                                <img src="/img/beach1.jpg" alt="Beach" className="w-full h-48 lg:h-64 object-cover rounded-2xl shadow-lg transform transition-transform duration-500 hover:scale-[1.02]" />
                                <img src="/img/pool.jpg" alt="Pool" className="w-full h-32 lg:h-40 object-cover rounded-2xl shadow-lg transform transition-transform duration-500 hover:scale-[1.02]" />
                            </div>
                            <div className="space-y-4">
                                <img src="/img/resort1.jpg" alt="Resort" className="w-full h-32 lg:h-40 object-cover rounded-2xl shadow-lg transform transition-transform duration-500 hover:scale-[1.02]" />
                                <img src="/img/beach2.jpg" alt="Ocean" className="w-full h-48 lg:h-64 object-cover rounded-2xl shadow-lg transform transition-transform duration-500 hover:scale-[1.02]" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- AMENITIES --- */}
                <section id="amenities" className="px-6 -mt-20 relative z-20">
                    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: BedDouble, title: 'Comfort', subtitle: 'Luxury Rooms' },
                            { icon: MapPin, title: 'Location', subtitle: 'By the Sea' },
                            { icon: Utensils, title: 'Service', subtitle: 'Top Notch Dining' },
                        ].map((item, idx) => (
                            <div key={idx} className="bg-[#FFFDE1] h-52 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center gap-3 hover:-translate-y-2 transition-transform duration-300 border-2 border-[#D8E983]/50 group">
                                <div className="p-3 bg-[#D8E983] rounded-full text-[#2C3930] group-hover:bg-[#628141] group-hover:text-white transition-colors duration-300">
                                    <item.icon size={32} strokeWidth={1.5} />
                                </div>
                                <h3 className="font-serif italic text-3xl text-[#2C3930]">{item.title}</h3>
                                <p className="text-[10px] uppercase tracking-widest text-[#2C3930]/60">{item.subtitle}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* --- ROOMS SECTION (Optimized Cards) --- */}
                <section id="rooms" className="bg-[#628141] text-white px-6 pt-32 pb-32 -mt-24 relative">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center space-y-4 mb-16">
                            <span className="text-[#D8E983] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                <Waves size={16} /> Accommodation
                            </span>
                            <h2 className="text-3xl md:text-5xl font-serif font-medium text-[#FFFDE1]">Choose Your Sanctuary</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {rooms.length > 0 ? (
                                rooms.map((room) => (
                                    <div 
                                        key={room.id} 
                                        className="group relative flex flex-col bg-[#FFFDE1] rounded-2xl shadow-xl border border-[#2C3930]/10 overflow-hidden transition-transform duration-300 hover:scale-[1.01] hover:shadow-2xl"
                                    >
                                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-200">
                                            <div className="absolute inset-0 bg-[#2C3930]/10 group-hover:bg-transparent transition-colors duration-300 z-10" />
                                            <img 
                                                src={getRoomImage(room.img_url)} 
                                                alt={room.room_name} 
                                                className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out will-change-transform"
                                                loading="lazy"
                                            />
                                            
                                            {room.room_category && (
                                                <div className="absolute top-3 right-3 z-20">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#D8E983] text-[#2C3930] shadow-sm">
                                                        {room.room_category.room_category}
                                                    </span>
                                                </div>
                                            )}

                                            {room.room_category && (
                                                <div className="absolute bottom-3 left-3 z-20">
                                                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold bg-[#2C3930]/90 text-[#FFFDE1] shadow-lg">
                                                        {formatCurrency(room.room_category.price)}
                                                        <span className="text-[10px] font-normal opacity-70 ml-1">/ night</span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col flex-1 p-6">
                                            <div className="mb-2">
                                                <h3 className="text-xl font-serif font-bold text-[#2C3930] line-clamp-1 group-hover:text-[#628141] transition-colors">
                                                    {room.room_name}
                                                </h3>
                                            </div>

                                            <p className="text-sm text-[#2C3930]/70 line-clamp-2 mb-6 h-10 leading-relaxed">
                                                {room.room_description}
                                            </p>

                                            <div className="flex items-center gap-4 text-xs text-[#2C3930]/60 mb-6 py-3 border-t border-b border-[#2C3930]/10">
                                                <div className="flex items-center gap-1.5">
                                                    <BedDouble className="size-4 text-[#628141]" />
                                                    <span className="font-medium">{room.type_of_bed}</span>
                                                </div>
                                                <div className="w-px h-3 bg-[#2C3930]/20"></div>
                                                {room.room_category && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="size-4 text-[#628141]" />
                                                        <span className="font-medium">{room.room_category.room_capacity} Guests</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-auto">
                                                <button
                                                    onClick={() => setSelectedRoom(room)}
                                                    className="w-full py-3 rounded-lg border-2 border-[#2C3930] text-[#2C3930] font-bold uppercase text-[10px] tracking-widest hover:bg-[#2C3930] hover:text-[#FFFDE1] transition-colors duration-300 flex items-center justify-center gap-2"
                                                >
                                                    View Details <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-3 text-center text-[#FFFDE1]/70 italic py-12">
                                    No rooms currently available. Please check back soon.
                                </div>
                            )}
                        </div>

                        <div className="pt-16 flex justify-center">
                            <Link 
                                href={guest.guestpage.url()}
                                className="bg-[#2C3930] text-[#FFFDE1] px-12 py-4 text-xs font-extrabold uppercase tracking-widest shadow-xl hover:bg-[#1a221d] hover:shadow-2xl transition rounded-sm transform hover:-translate-y-1"
                            >
                                Book Your Stay Now
                            </Link>
                        </div>
                    </div>
                </section>

                {/* --- ABOUT SECTION --- */}
                <section id="about" className="px-6 py-24 max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="lg:w-1/2 space-y-8">
                            <span className="text-[#628141] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <span className="h-px w-8 bg-[#628141]"></span> Discover
                            </span>
                            <h2 className="text-4xl md:text-5xl font-serif text-[#2C3930] leading-tight">
                                Your Perfect Escape <br/> <span className="italic text-[#628141]">By The Sea.</span>
                            </h2>
                            <p className="text-base text-gray-600 font-light leading-relaxed">
                                Escape the ordinary and immerse yourself in the extraordinary. Estaca Bay offers a sanctuary where the rhythm of the waves sets the pace of your day.
                            </p>
                            <ul className="grid grid-cols-2 gap-4 pt-4">
                                {['Private Beach Access', 'Infinity Pools', 'Gourmet Dining', 'Sunset Views'].map(item => (
                                    <li key={item} className="flex items-center gap-3 text-[#2C3930] text-sm font-medium">
                                        <div className="w-2 h-2 rounded-full bg-[#D8E983]" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="lg:w-1/2 grid grid-cols-2 gap-4">
                            <img src="/img/beach3.jpg" className="w-full h-64 object-cover rounded-2xl shadow-lg mt-8 hover:opacity-90 transition" alt="Beachfront" />
                            <img src="/img/pic1.jpg" className="w-full h-64 object-cover rounded-2xl shadow-lg hover:opacity-90 transition" alt="Recreation" />
                            <img src="/img/beach4.jpg" className="col-span-2 w-full h-48 object-cover rounded-2xl shadow-lg hover:opacity-90 transition" alt="Sunset view" />
                        </div>
                    </div>
                </section>

                {/* --- CONTACT & FOOTER --- */}
                <section id="contact" className="bg-[#FFFDE1]/50 px-6 py-20 border-t border-[#FFFDE1]">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <span className="text-[#628141] text-xs font-bold uppercase tracking-widest block mb-4">Get in Touch</span>
                            <h2 className="text-3xl md:text-4xl font-serif text-[#2C3930]">Plan Your Visit</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-[#2C3930]">
                            {[
                                { icon: Phone, title: "Call Us", text: "0920 281 6722" },
                                { icon: Facebook, title: "Facebook", text: "Estaca Bay Resort" },
                                { icon: MapPin, title: "Location", text: "Estaca, Cebu" },
                                { icon: Mail, title: "Email", text: "estacabay@gmail.com" },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white p-8 rounded-2xl flex flex-col items-center gap-4 shadow-lg hover:shadow-xl hover:-translate-y-1 transition duration-300 border border-[#2C3930]/5 group">
                                    <div className="w-12 h-12 bg-[#FFFDE1] rounded-full flex items-center justify-center text-[#2C3930] group-hover:bg-[#D8E983] transition-colors">
                                        <item.icon size={20} />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="font-bold uppercase text-xs tracking-wider mb-1">{item.title}</h4>
                                        <p className="text-sm font-serif">{item.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <footer className="bg-[#2C3930] text-[#FFFDE1] px-6 py-12 border-t-4 border-[#D8E983]">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left space-y-2">
                            <div className="text-2xl font-serif italic text-[#D8E983]">Estaca Bay</div>
                            <p className="text-xs opacity-70 max-w-xs">Your tropical sanctuary in Compostela, Cebu.</p>
                        </div>
                        <div className="flex gap-8 text-xs font-bold uppercase tracking-widest opacity-80">
                            {['Home', 'Rooms', 'Contact'].map(link => (
                                <a key={link} href={`#${link.toLowerCase()}`} onClick={(e) => scrollToSection(e, link.toLowerCase())} className="hover:text-[#D8E983] transition">{link}</a>
                            ))}
                        </div>
                        <div className="text-[10px] opacity-50 uppercase tracking-wide">
                            &copy; {new Date().getFullYear()} Estaca Bay Resort.
                        </div>
                    </div>
                </footer>
            </div>

            {/* --- ROOM DETAILS MODAL --- */}
            {selectedRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C3930]/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#FFFDE1] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col md:flex-row overflow-hidden border border-[#D8E983] animate-in zoom-in-95 duration-200">
                        <button onClick={() => setSelectedRoom(null)} className="absolute top-4 right-4 z-20 p-2 bg-white/50 hover:bg-white rounded-full text-[#2C3930] transition">
                            <X size={20} />
                        </button>
                        <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                            <img src={getRoomImage(selectedRoom.img_url)} alt={selectedRoom.room_name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#2C3930] via-transparent to-transparent md:hidden" />
                            <div className="absolute bottom-4 left-4 text-white md:hidden">
                                <h3 className="text-2xl font-serif font-bold">{selectedRoom.room_name}</h3>
                            </div>
                        </div>
                        <div className="w-full md:w-1/2 p-8 flex flex-col">
                            <div className="hidden md:block mb-6">
                                <span className="text-[#628141] text-[10px] font-bold uppercase tracking-widest mb-1 block">{selectedRoom.room_category?.room_category}</span>
                                <h3 className="text-3xl font-serif font-bold text-[#2C3930]">{selectedRoom.room_name}</h3>
                            </div>
                            <div className="space-y-6 flex-1">
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase text-[#2C3930]/50 tracking-widest mb-2">Description</h4>
                                    <p className="text-sm text-[#2C3930]/80 leading-relaxed">{selectedRoom.room_description || "A wonderful room perfect for relaxation."}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-[#2C3930]/10">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase text-[#2C3930]/50 font-bold">Capacity</span>
                                        <div className="flex items-center gap-2 text-sm font-medium text-[#2C3930]">
                                            <Users size={16} className="text-[#628141]" /> {selectedRoom.room_category?.room_capacity} Guests
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase text-[#2C3930]/50 font-bold">Bed Type</span>
                                        <div className="flex items-center gap-2 text-sm font-medium text-[#2C3930]">
                                            <BedDouble size={16} className="text-[#628141]" /> {selectedRoom.type_of_bed}
                                        </div>
                                    </div>
                                </div>
                                {selectedRoom.room_amenities && (
                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase text-[#2C3930]/50 tracking-widest mb-2">Amenities</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedRoom.room_amenities.split(',').map((amenity, idx) => (
                                                <span key={idx} className="bg-white text-[#2C3930] text-[10px] font-bold px-3 py-1 rounded-full border border-[#D8E983] flex items-center gap-1 shadow-sm">
                                                    <CheckCircle size={10} className="text-[#628141]" /> {amenity.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-8 pt-4 border-t border-[#2C3930]/10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-[#2C3930]/60 font-medium">Total Price</span>
                                    {selectedRoom.room_category && (
                                        <span className="text-2xl font-bold text-[#628141]">{formatCurrency(selectedRoom.room_category.price)}</span>
                                    )}
                                </div>
                                <Link href={guest.guestpage.url()} className="w-full block text-center bg-[#2C3930] text-[#FFFDE1] py-4 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-[#628141] transition shadow-lg">
                                    Proceed to Booking
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}