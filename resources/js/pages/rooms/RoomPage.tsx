import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import rooms from '@/routes/rooms';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import React, { FormEventHandler, useState } from 'react';
import { route } from 'ziggy-js';

// Define the shape of a Category (passed from Laravel)
interface Category {
    id: number;
    room_category: string;
    price?: number;
}

// Define the props this page expects
interface Props {
    categories: Category[];
}

export default function RoomPage({ categories }: Props) {
    // 1. State for local image preview
    const [preview, setPreview] = useState<string | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        room_categories_id: '',
        room_name: '',
        room_description: '',
        img_url: null as File | null,
        max_extra_person: '',
        room_amenities: '',
        type_of_bed: '',
        status: 'available', 
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Manage Rooms',
            href: rooms.create.url(),
        },
    ];

    // 2. Handle file selection and preview generation
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('img_url', file);

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // 3. Use 'post' with forceFormData for reliable file uploads
        post(route('rooms.store'), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setPreview(null);
            },
        });
    };

    const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Rooms" />
            
            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 border dark:border-gray-700">
                        
                        <form onSubmit={submit} className="space-y-6">
                            
                            {/* Room Category */}
                            <div className="space-y-2">
                                <Label htmlFor="room_categories_id" className="dark:text-gray-200">Room Category</Label>
                                <select
                                    id="room_categories_id"
                                    className={selectClass}
                                    value={data.room_categories_id}
                                    onChange={(e) => setData('room_categories_id', e.target.value)}
                                >
                                    <option value="" disabled>Select a category</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id} className="dark:bg-gray-800">
                                            {category.room_category} {category.price ? `(₱${category.price})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.room_categories_id && <p className="text-red-500 text-sm dark:text-red-400">{errors.room_categories_id}</p>}
                            </div>

                            {/* Room Name */}
                            <div className="space-y-2">
                                <Label htmlFor="room_name" className="dark:text-gray-200">Room Name</Label>
                                <Input 
                                    id="room_name" 
                                    type="text" 
                                    className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                                    value={data.room_name} 
                                    onChange={(e) => setData('room_name', e.target.value)} 
                                />
                                {errors.room_name && <p className="text-red-500 text-sm dark:text-red-400">{errors.room_name}</p>}
                            </div>

                            {/* Room Description */}
                            <div className="space-y-2">
                                <Label htmlFor="room_description" className="dark:text-gray-200">Room Description</Label>
                                <Input 
                                    id="room_description" 
                                    type="text" 
                                    className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                                    value={data.room_description} 
                                    onChange={(e) => setData('room_description', e.target.value)} 
                                />
                                {errors.room_description && <p className="text-red-500 text-sm dark:text-red-400">{errors.room_description}</p>}
                            </div>

                            {/* Max Extra Person */}
                            <div className="space-y-2">
                                <Label htmlFor="max_extra_person" className="dark:text-gray-200">Max Extra Person</Label>
                                <Input 
                                    id="max_extra_person" 
                                    type="number" 
                                    className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                                    value={data.max_extra_person} 
                                    onChange={(e) => setData('max_extra_person', e.target.value)} 
                                />
                                {errors.max_extra_person && <p className="text-red-500 text-sm dark:text-red-400">{errors.max_extra_person}</p>}
                            </div>

                            {/* Room Amenities */}
                            <div className="space-y-2">
                                <Label htmlFor="room_amenities" className="dark:text-gray-200">Amenities</Label>
                                <Input 
                                    id="room_amenities" 
                                    placeholder="e.g. WiFi, AC, TV"
                                    type="text" 
                                    className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
                                    value={data.room_amenities} 
                                    onChange={(e) => setData('room_amenities', e.target.value)} 
                                />
                                {errors.room_amenities && <p className="text-red-500 text-sm dark:text-red-400">{errors.room_amenities}</p>}
                            </div>

                            {/* Type of Bed */}
                            <div className="space-y-2">
                                <Label htmlFor="type_of_bed" className="dark:text-gray-200">Type of Bed</Label>
                                <Input 
                                    id="type_of_bed" 
                                    placeholder="e.g. King Size, Twin"
                                    type="text" 
                                    className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
                                    value={data.type_of_bed} 
                                    onChange={(e) => setData('type_of_bed', e.target.value)} 
                                />
                                {errors.type_of_bed && <p className="text-red-500 text-sm dark:text-red-400">{errors.type_of_bed}</p>}
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label htmlFor="status" className="dark:text-gray-200">Status</Label>
                                <select
                                    id="status"
                                    className={selectClass}
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                >
                                    <option value="available" className="dark:bg-gray-800">Available</option>
                                    <option value="booked" className="dark:bg-gray-800">Booked</option>
                                    <option value="occupied" className="dark:bg-gray-800">Occupied</option>
                                    <option value="unavailable" className="dark:bg-gray-800">Unavailable</option>
                                </select>
                                {errors.status && <p className="text-red-500 text-sm dark:text-red-400">{errors.status}</p>}
                            </div>

                            {/* Image Upload & Preview */}
                            <div className="space-y-2">
                                <Label htmlFor="img_url" className="dark:text-gray-200">Room Image</Label>
                                
                                {preview && (
                                    <div className="relative w-full h-48 mb-2 border rounded-lg overflow-hidden dark:border-gray-700">
                                        <img 
                                            src={preview} 
                                            alt="Selected room" 
                                            className="w-full h-full object-cover"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => { setPreview(null); setData('img_url', null); }}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs hover:bg-red-600 transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}

                                <Input
                                    id="img_url"
                                    type="file"
                                    accept="image/*"
                                    className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 file:dark:text-gray-100"
                                    onChange={handleFileChange}
                                />
                                {errors.img_url && <p className="text-red-500 text-sm dark:text-red-400">{errors.img_url}</p>}
                            </div>

                            <div className="pt-2">
                                <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                                    {processing ? 'Creating...' : 'Create Room'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}