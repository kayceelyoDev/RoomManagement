import { Room } from '@/types/Rooms';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface Props {
    room: Room | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function RoomDescription({ room, isOpen, onClose }: Props) {
    if (!room) return null;

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* 1. The Backdrop (Dark overlay) */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50" />
                </Transition.Child>

                {/* 2. The Modal Positioning */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            {/* 3. The Actual Card Content */}
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-card p-6 shadow-xl transition-all border border-border">
                                <div className="flex justify-between items-center mb-4">
                                    <Dialog.Title className="text-2xl font-bold dark:text-white">
                                        {room.room_name}
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                                </div>

                                <img src={room.img_url} className="w-full h-64 object-cover rounded-lg mb-4" alt="" />
                                
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    {room.room_description}
                                </p>

                                <div className="flex justify-between items-center border-t pt-4 dark:border-gray-700">
                                    <span className="text-2xl font-bold text-primary">
                                        ₱{room.room_price.toLocaleString()}
                                    </span >
                                    <button 
                                        onClick={onClose}
                                        className="rounded-lg bg-indigo-600 px-6 py-2 text-white font-semibold hover:bg-indigo-700"
                                    >
                                        Close
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}