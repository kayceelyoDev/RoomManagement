import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Room } from '@/types/Rooms';
import RoomDescription from './modals/RoomDescription';
import UpdateRoomForm from './modals/UpdateRoomForm';

export default function DisplayRoom({ rooms }: { rooms: Room[] }) {
    const [activeRoom, setActiveRoom] = useState<Room | null>(null);
    const [isShowingDesc, setIsShowingDesc] = useState(false);
    const [isShowingUpdate, setIsShowingUpdate] = useState(false);

    const handleOpenDesc = (room: Room) => {
        setActiveRoom(room);
        setIsShowingDesc(true);
    };

    const handleOpenUpdate = (room: Room) => {
        setActiveRoom(room);
        setIsShowingUpdate(true);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Rooms', href: '#' }]}>
            <Head title="Browse Rooms" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    
                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {rooms.map((room) => (
                            <div 
                                key={room.id} 
                                className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 shadow-sm transition-all hover:shadow-md"
                            >
                                {/* Room Image Area */}
                                <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    <img 
                                        src={room.img_url} 
                                        alt={room.room_name} 
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2">
                                        <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-700 shadow-sm backdrop-blur-md">
                                            {room.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Room Content Area */}
                                <div className="flex flex-1 flex-col p-4">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
                                        {room.room_name}
                                    </h3>
                                    
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                        {room.room_description}
                                    </p>

                                    <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                                        <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                                            ₱{Number(room.room_price).toLocaleString()}
                                        </p>
                                    </div>
                                    
                                    {/* Buttons Container */}
                                    <div className="flex flex-col gap-2 mt-4">
                                        <button 
                                            onClick={() => handleOpenDesc(room)}
                                            className="w-full rounded-lg bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                        >
                                            View Details
                                        </button>
                                        <button 
                                            onClick={() => handleOpenUpdate(room)}
                                            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
                                        >
                                            Update Room
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State Fallback */}
                    {rooms.length === 0 && (
                        <div className="text-center py-20 bg-gray-50 rounded-lg dark:bg-gray-800/50">
                            <p className="text-gray-500">No rooms available found.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals remain exactly the same */}
            <RoomDescription 
                room={activeRoom} 
                isOpen={isShowingDesc} 
                onClose={() => setIsShowingDesc(false)} 
            />

            <UpdateRoomForm 
                room={activeRoom} 
                isOpen={isShowingUpdate} 
                onClose={() => setIsShowingUpdate(false)} 
            />
        </AppLayout>
    );
}