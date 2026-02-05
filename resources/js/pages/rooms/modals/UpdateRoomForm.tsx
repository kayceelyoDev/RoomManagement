import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import roomsRoute from '@/routes/rooms';
import { Room } from '@/types/Rooms';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { AlignLeft, BedDouble, CircleDollarSign, ImagePlus, Info, LayoutList, PencilLine, RotateCcw, Save, Users } from 'lucide-react';
import { Fragment, useEffect } from 'react';

// 1. Reuse the Category Interface
interface Category {
    id: number;
    room_category: string;
    price?: number;
}

interface Props {
    room: Room | null;
    categories: Category[]; // Passed from parent
    isOpen: boolean;
    onClose: () => void;
}

export default function UpdateRoomForm({ room, categories, isOpen, onClose }: Props) {

    interface UpdateRoomFormData {
        room_categories_id: string | number;
        room_name: string;
        room_description: string;
        max_extra_person: string | number;
        room_amenities: string;
        type_of_bed: string;
        status: string;
        img_url?: File | null;
        _method: string;
    }

    // 2. Setup form with ALL fields
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<UpdateRoomFormData>({
        room_categories_id: '',
        room_name: '',
        room_description: '',
        max_extra_person: '',
        room_amenities: '',
        type_of_bed: '',
        status: '',
        img_url: null,
        _method: 'put',
    });

    // 3. Populate form when modal opens
    useEffect(() => {
        if (room && isOpen) {
            clearErrors();
            setData({
                room_categories_id: room.room_categories_id || '',
                room_name: room.room_name,
                room_description: room.room_description,
                max_extra_person: room.max_extra_person,
                room_amenities: room.room_amenities,
                type_of_bed: room.type_of_bed,
                status: room.status,
                img_url: null,
                _method: 'put',
            });
        }
    }, [room, isOpen]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!room) return;

        post(roomsRoute.update.url(room), {
            forceFormData: true,
            onSuccess: () => {
                onClose();
                reset();
            },
            preserveScroll: true,
        });
    };

    // Shared style for Select inputs to match Shadcn UI
    const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

    if (!room) return null;

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

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
                            <Dialog.Panel className="w-full max-w-2xl overflow-hidden rounded-lg bg-card p-6 text-left align-middle shadow-xl transition-all border border-border">
                                
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-5 border-b pb-2 dark:border-gray-700">
                                    Update Room Details
                                </Dialog.Title>

                                <form onSubmit={submit} className="space-y-4">
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Room Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="room_name" className="flex items-center gap-2 dark:text-gray-200">
                                                <PencilLine className="size-4" /> Room Name
                                            </Label>
                                            <Input
                                                id="room_name"
                                                value={data.room_name}
                                                onChange={(e) => setData('room_name', e.target.value)}
                                                className="bg-background border-border text-foreground"
                                            />
                                            {errors.room_name && <p className="text-red-500 text-sm">{errors.room_name}</p>}
                                        </div>

                                        {/* Room Category */}
                                        <div className="space-y-2">
                                            <Label htmlFor="room_categories_id" className="flex items-center gap-2 dark:text-gray-200">
                                                <LayoutList className="size-4" /> Category
                                            </Label>
                                            <select
                                                id="room_categories_id"
                                                value={data.room_categories_id}
                                                onChange={(e) => setData('room_categories_id', e.target.value)}
                                                className={selectClass}
                                            >
                                                <option value="" disabled>Select Category</option>
                                                {categories?.map((cat) => (
                                                    <option key={cat.id} value={cat.id} className="bg-card">
                                                        {cat.room_category} {cat.price ? `(₱${cat.price})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.room_categories_id && <p className="text-red-500 text-sm">{errors.room_categories_id}</p>}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="room_description" className="flex items-center gap-2 dark:text-gray-200">
                                            <AlignLeft className="size-4" /> Description
                                        </Label>
                                        <Input
                                            id="room_description"
                                            value={data.room_description}
                                            onChange={(e) => setData('room_description', e.target.value)}
                                            className="bg-background border-border"
                                        />
                                        {errors.room_description && <p className="text-red-500 text-sm">{errors.room_description}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Max Extra Person */}
                                        <div className="space-y-2">
                                            <Label htmlFor="max_extra_person" className="flex items-center gap-2 dark:text-gray-200">
                                                <Users className="size-4" /> Max Extra Person
                                            </Label>
                                            <Input
                                                id="max_extra_person"
                                                type="number"
                                                value={data.max_extra_person}
                                                onChange={(e) => setData('max_extra_person', e.target.value)}
                                                className="bg-background border-border"
                                            />
                                            {errors.max_extra_person && <p className="text-red-500 text-sm">{errors.max_extra_person}</p>}
                                        </div>

                                        {/* Type of Bed */}
                                        <div className="space-y-2">
                                            <Label htmlFor="type_of_bed" className="flex items-center gap-2 dark:text-gray-200">
                                                <BedDouble className="size-4" /> Type of Bed
                                            </Label>
                                            <Input
                                                id="type_of_bed"
                                                value={data.type_of_bed}
                                                onChange={(e) => setData('type_of_bed', e.target.value)}
                                                className="bg-background border-border"
                                            />
                                            {errors.type_of_bed && <p className="text-red-500 text-sm">{errors.type_of_bed}</p>}
                                        </div>
                                    </div>

                                    {/* Amenities */}
                                    <div className="space-y-2">
                                        <Label htmlFor="room_amenities" className="flex items-center gap-2 dark:text-gray-200">
                                            <Info className="size-4" /> Amenities
                                        </Label>
                                        <Input
                                            id="room_amenities"
                                            value={data.room_amenities}
                                            onChange={(e) => setData('room_amenities', e.target.value)}
                                            placeholder="e.g. WiFi, AC, TV"
                                            className="bg-background border-border"
                                        />
                                        {errors.room_amenities && <p className="text-red-500 text-sm">{errors.room_amenities}</p>}
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-2">
                                        <Label htmlFor="status" className="flex items-center gap-2 dark:text-gray-200">
                                            <Info className="size-4" /> Status
                                        </Label>
                                        <select
                                            id="status"
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className={selectClass}
                                        >
                                            <option value="unavailable" className="bg-card">Unavailable</option>
                                        </select>
                                        {errors.status && <p className="text-red-500 text-sm">{errors.status}</p>}
                                    </div>

                                    {/* Image Upload */}
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 dark:text-gray-200">
                                            <ImagePlus className="size-4" /> Room Image
                                        </Label>
                                        
                                        <div className="flex items-center gap-4 rounded-md border border-input p-4 bg-muted/50">
                                            {/* Preview */}
                                            <div className="shrink-0">
                                                <img
                                                    src={room.img_url ? `/storage/${room.img_url}` : 'https://placehold.co/100'} 
                                                    className="h-16 w-16 rounded-md object-cover border dark:border-gray-600"
                                                    alt="Current"
                                                />
                                            </div>
                                            {/* File Input */}
                                            <div className="w-full">
                                                <Input
                                                    type="file"
                                                    onChange={(e) => setData('img_url', e.target.files ? e.target.files[0] : null)}
                                                    className="bg-background border-border"
                                                />
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    Leave empty to keep current image.
                                                </p>
                                            </div>
                                        </div>
                                        {errors.img_url && <p className="text-red-500 text-sm">{errors.img_url}</p>}
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-6 flex justify-end gap-3 border-t pt-4 dark:border-gray-700">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={onClose}
                                            className="gap-2"
                                        >
                                            <RotateCcw className="size-4" /> Cancel
                                        </Button>
                                        
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                        >
                                            <Save className="size-4" />
                                            {processing ? 'Updating...' : 'Save Changes'}
                                        </Button>
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