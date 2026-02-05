import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import rooms from '@/routes/rooms';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    ArrowLeft, // Import ArrowLeft
    BedDouble,
    CheckCircle2,
    ChevronDown,
    FileText,
    ImagePlus,
    LayoutGrid,
    Tag,
    Users,
    Wifi,
    X
} from 'lucide-react';
import React, { FormEventHandler, useState } from 'react';
import { route } from 'ziggy-js';

// --- Types ---
interface Category {
    id: number;
    room_category: string;
    price?: number;
}

interface Props {
    categories: Category[];
}

export default function RoomPage({ categories }: Props) {
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

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
        { title: 'Manage Rooms', href: rooms.create.url() },
        { title: 'Create', href: '#' },
    ];

    // --- Handlers ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        processFile(file);
    };

    const processFile = (file: File | null) => {
        setData('img_url', file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = () => setIsDragging(false);
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0] || null;
        if (file && file.type.startsWith('image/')) processFile(file);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('rooms.store'), {
            forceFormData: true,
            onSuccess: () => { reset(); setPreview(null); },
        });
    };

    // --- Styles ---
    const inputIconWrapper = "relative";
    const iconClass = "absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10";
    const inputBaseClass = "w-full rounded-md border border-input/80 bg-muted/30 pl-9 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200";

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create New Room" />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">

                    {/* --- Back Button --- */}
                    <div className="mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 pl-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Rooms
                        </Button>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-serif text-foreground tracking-tight">Add New Room</h1>
                        <p className="text-muted-foreground mt-2">Fill in the details below to list a new room in the directory.</p>
                    </div>

                    <form onSubmit={submit}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                            {/* --- Left Column: Details --- */}
                            <div className="lg:col-span-2 h-full flex flex-col">
                                <div className="bg-card text-card-foreground shadow-sm rounded-xl border border-border p-6 md:p-8 space-y-6 flex-1">
                                    <h2 className="text-lg font-medium flex items-center gap-2 border-b border-border pb-4">
                                        <LayoutGrid className="w-5 h-5 text-primary" />
                                        Room Details
                                    </h2>

                                    {/* Name & Category Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="room_name">Room Name</Label>
                                            <div className={inputIconWrapper}>
                                                <FileText className={iconClass} />
                                                <Input
                                                    id="room_name"
                                                    placeholder="e.g. Deluxe Ocean View"
                                                    className={inputBaseClass}
                                                    value={data.room_name}
                                                    onChange={(e) => setData('room_name', e.target.value)}
                                                />
                                            </div>
                                            {errors.room_name && <p className="text-destructive text-xs font-medium">{errors.room_name}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="room_categories_id">Category</Label>
                                            <div className={inputIconWrapper}>
                                                <Tag className={iconClass} />
                                                <div className="relative">
                                                    <select
                                                        id="room_categories_id"
                                                        className={`${inputBaseClass} appearance-none`}
                                                        value={data.room_categories_id}
                                                        onChange={(e) => setData('room_categories_id', e.target.value)}
                                                    >
                                                        <option value="" disabled>Select category...</option>
                                                        {categories.map((c) => (
                                                            <option key={c.id} value={c.id} className="bg-card">
                                                                {c.room_category} {c.price ? `— ₱${c.price}` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                </div>
                                            </div>
                                            {errors.room_categories_id && <p className="text-destructive text-xs font-medium">{errors.room_categories_id}</p>}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="room_description">Description</Label>
                                        <textarea
                                            id="room_description"
                                            rows={5}
                                            className="flex w-full rounded-md border border-input/80 bg-muted/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none min-h-[120px]"
                                            placeholder="Describe the room experience..."
                                            value={data.room_description}
                                            onChange={(e) => setData('room_description', e.target.value)}
                                        />
                                        {errors.room_description && <p className="text-destructive text-xs font-medium">{errors.room_description}</p>}
                                    </div>

                                    {/* Capacity & Bed Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="max_extra_person">Max Extra Guests</Label>
                                            <div className={inputIconWrapper}>
                                                <Users className={iconClass} />
                                                <Input
                                                    id="max_extra_person"
                                                    type="number"
                                                    className={inputBaseClass}
                                                    value={data.max_extra_person}
                                                    onChange={(e) => setData('max_extra_person', e.target.value)}
                                                />
                                            </div>
                                            {errors.max_extra_person && <p className="text-destructive text-xs font-medium">{errors.max_extra_person}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="type_of_bed">Bed Configuration</Label>
                                            <div className={inputIconWrapper}>
                                                <BedDouble className={iconClass} />
                                                <Input
                                                    id="type_of_bed"
                                                    placeholder="e.g. 1 King, 2 Twin"
                                                    className={inputBaseClass}
                                                    value={data.type_of_bed}
                                                    onChange={(e) => setData('type_of_bed', e.target.value)}
                                                />
                                            </div>
                                            {errors.type_of_bed && <p className="text-destructive text-xs font-medium">{errors.type_of_bed}</p>}
                                        </div>
                                    </div>

                                    {/* Amenities */}
                                    <div className="space-y-2">
                                        <Label htmlFor="room_amenities">Amenities</Label>
                                        <div className={inputIconWrapper}>
                                            <Wifi className={iconClass} />
                                            <Input
                                                id="room_amenities"
                                                placeholder="WiFi, AC, Smart TV, Mini Bar"
                                                className={inputBaseClass}
                                                value={data.room_amenities}
                                                onChange={(e) => setData('room_amenities', e.target.value)}
                                            />
                                        </div>
                                        {errors.room_amenities && <p className="text-destructive text-xs font-medium">{errors.room_amenities}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* --- Right Column: Media & Status --- */}
                            <div className="space-y-6 flex flex-col h-full">

                                <div className="bg-card text-card-foreground shadow-sm rounded-xl border border-border p-6">
                                    <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                                        <ImagePlus className="w-5 h-5 text-primary" />
                                        Room Photo
                                    </h2>

                                    <div className="space-y-4">
                                        <div
                                            className={`
                                                relative w-full aspect-video rounded-lg border-2 border-dashed transition-all duration-200 overflow-hidden flex flex-col items-center justify-center text-center cursor-pointer
                                                ${isDragging ? 'border-primary bg-primary/10' : 'border-border bg-muted/20 hover:bg-muted/40'}
                                                ${preview ? 'border-none' : ''}
                                            `}
                                            onDragOver={onDragOver}
                                            onDragLeave={onDragLeave}
                                            onDrop={onDrop}
                                            onClick={() => document.getElementById('img_url')?.click()}
                                        >
                                            {preview ? (
                                                <>
                                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white font-medium text-sm">Change Image</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="p-4 text-muted-foreground">
                                                    <ImagePlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm font-medium">Click or Drag image</p>
                                                    <p className="text-xs opacity-70 mt-1">JPEG, PNG up to 5MB</p>
                                                </div>
                                            )}
                                        </div>

                                        <input
                                            id="img_url"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />

                                        {preview && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); setPreview(null); setData('img_url', null); }}
                                                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                                            >
                                                <X className="w-4 h-4 mr-2" /> Remove Image
                                            </Button>
                                        )}
                                        {errors.img_url && <p className="text-destructive text-xs font-medium text-center">{errors.img_url}</p>}
                                    </div>
                                </div>

                                <div className="bg-card text-card-foreground shadow-sm rounded-xl border border-border p-6 flex flex-col justify-between h-full">
                                    <div>
                                        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                            Publish Status
                                        </h2>

                                        <div className="space-y-2 mb-6">
                                            <Label htmlFor="status">Availability</Label>
                                            <div className={inputIconWrapper}>
                                                <CheckCircle2 className={iconClass} />
                                                <div className="relative">
                                                    <select
                                                        id="status"
                                                        className={`${inputBaseClass} appearance-none`}
                                                        value={data.status}
                                                        onChange={(e) => setData('status', e.target.value)}
                                                    >
                                                        <option value="available" className="bg-card">Available</option>
                                                        <option value="booked" className="bg-card">Booked</option>
                                                        <option value="occupied" className="bg-card">Occupied</option>
                                                        <option value="unavailable" className="bg-card">Unavailable</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-border mt-auto">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-base shadow-md"
                                        >
                                            {processing ? 'Saving Room...' : 'Create Room'}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}