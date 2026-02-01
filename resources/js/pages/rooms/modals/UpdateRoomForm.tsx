import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { useForm } from '@inertiajs/react'; 
import roomsRoute from '@/routes/rooms';
import { Room } from '@/types/Rooms';
import { X, PencilLine, AlignLeft, CircleDollarSign, Info, ImagePlus, Save, RotateCcw } from 'lucide-react';

interface Props {
    room: Room | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function UpdateRoomForm({ room, isOpen, onClose }: Props) {

    interface UpdateRoomFormData {
        room_name: string;
        room_description: string;
        room_price: number;
        status: string;
        img_url?: File | null;
        _method: string;
    }

    const { data, setData, post, processing, errors, reset } = useForm<UpdateRoomFormData>({
        room_name: '',
        room_description: '',
        room_price: 0,
        status: '',
        img_url: null,
        _method: 'put',
    });


    useEffect(() => {
        if (room) {
            setData({
                room_name: room.room_name,
                room_description: room.room_description,
                room_price: room.room_price,
                status: room.status,
                img_url: null,
                _method: 'put',
            });
        }
    }, [room]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!room) return;

        if (!data.img_url) {
            delete data.img_url;
        }

        post(roomsRoute.update.url(room), {
            forceFormData: true,
            onSuccess: () => {
                onClose();
                reset();
            },
        });
    };

    if (!room) return null;

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Backdrop logic stays the same */}
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} /* ... animations ... */>
                            <Dialog.Panel className="w-full max-w-xl bg-white p-8 rounded-2xl dark:bg-gray-900 shadow-2xl">

                                <form onSubmit={submit} className="space-y-5">

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold">
                                            <PencilLine className="size-4" /> Room Name
                                        </label>
                                        <input
                                            type="text"
                                            value={data.room_name}
                                            onChange={(e) => setData('room_name', e.target.value)}
                                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:text-white mt-1"
                                        />
                                        {errors.room_name && <p className="text-red-500 text-xs mt-1">{errors.room_name}</p>}
                                    </div>


                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold">
                                            <AlignLeft className="size-4" /> Description
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={data.room_description}
                                            onChange={(e) => setData('room_description', e.target.value)}
                                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:text-white mt-1"
                                        />
                                        {errors.room_description && <p className="text-red-500 text-xs mt-1">{errors.room_description}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold">
                                                <CircleDollarSign className="size-4" /> Price
                                            </label>
                                            <input
                                                type="number"
                                                value={data.room_price}
                                                onChange={(e) => setData('room_price', Number(e.target.value))}
                                                className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:text-white mt-1"
                                            />
                                        </div>


                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold">
                                                <Info className="size-4" /> Status
                                            </label>
                                            <select
                                                value={data.status}
                                                onChange={(e) => setData('status', e.target.value)}
                                                className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:text-white mt-1"
                                            >
                                                <option value="available">Available</option>
                                                <option value="booked">Booked</option>
                                                <option value="occupied">Occupied</option>
                                                <option value="unvailable">Unvailable</option>
                                            </select>
                                        </div>
                                    </div>


                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold">
                                            <ImagePlus className="size-4" /> Room Image
                                        </label>
                                        <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-xl border-gray-200 dark:border-gray-700">

                                            <img
                                                src={room.img_url}
                                                className="h-16 w-16 rounded-lg object-cover"
                                                alt="Current"
                                            />
                                            <div className="flex-1">
                                                <input
                                                    type="file"

                                                    onChange={(e) => setData('img_url', e.target.files ? e.target.files[0] : null)}
                                                    className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700"
                                                />
                                            </div>
                                        </div>
                                        {errors.img_url && <p className="text-red-500 text-xs mt-1">{errors.img_url}</p>}
                                    </div>


                                    <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-800">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex items-center gap-2 px-5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:text-gray-300"
                                        >
                                            <RotateCcw className="size-4" /> Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            <Save className="size-4" />
                                            {processing ? 'Updating...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}