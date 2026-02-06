import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import roomcategoryRoute from '@/routes/roomcategory';
import { Dialog, Transition } from '@headlessui/react';
import { Head, router, useForm } from '@inertiajs/react';
import { CircleDollarSign, Edit, Layers, Plus, Save, Trash2, Users, X } from 'lucide-react';
import { FormEventHandler, Fragment, useEffect, useState } from 'react';

// --- Types ---
interface RoomCategory {
    id: number;
    room_category: string;
    price: number;
    room_capacity: number;
}

interface Props {
    categories: RoomCategory[];
}

// --- Reusable Modal Component ---
function CategoryFormModal({ 
    isOpen, 
    onClose, 
    categoryToEdit = null 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    categoryToEdit?: RoomCategory | null; 
}) {
    const isEditMode = !!categoryToEdit;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        room_category: '',
        price: '',
        room_capacity: '',
    });

    useEffect(() => {
        if (isOpen) {
            clearErrors();
            if (categoryToEdit) {
                setData({
                    room_category: categoryToEdit.room_category,
                    price: categoryToEdit.price.toString(),
                    room_capacity: categoryToEdit.room_capacity.toString(),
                });
            } else {
                reset();
            }
        }
    }, [isOpen, categoryToEdit]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditMode && categoryToEdit) {
            put(roomcategoryRoute.update.url(categoryToEdit.id), {
                onSuccess: () => { onClose(); reset(); }
            });
        } else {
            post(roomcategoryRoute.store.url(), {
                onSuccess: () => { onClose(); reset(); }
            });
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />

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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-card p-6 shadow-2xl transition-all border border-border">
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title as="h3" className="text-xl font-serif font-bold text-foreground">
                                        {isEditMode ? 'Edit Category' : 'New Category'}
                                    </Dialog.Title>
                                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                                        <X className="size-5 text-muted-foreground" />
                                    </button>
                                </div>

                                <form onSubmit={submit} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="room_category" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                            Category Name
                                        </Label>
                                        <Input
                                            id="room_category"
                                            value={data.room_category}
                                            onChange={(e) => setData('room_category', e.target.value)}
                                            placeholder="e.g. Deluxe Suite"
                                            className="bg-background border-border h-11 focus:ring-primary/20"
                                        />
                                        {errors.room_category && <p className="text-xs font-bold text-destructive mt-1">{errors.room_category}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="price" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                                Nightly Rate
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">₱</span>
                                                <Input
                                                    id="price"
                                                    type="number"
                                                    value={data.price}
                                                    onChange={(e) => setData('price', e.target.value)}
                                                    className="pl-7 bg-background border-border h-11"
                                                />
                                            </div>
                                            {errors.price && <p className="text-xs font-bold text-destructive mt-1">{errors.price}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="room_capacity" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                                Capacity
                                            </Label>
                                            <Input
                                                id="room_capacity"
                                                type="number"
                                                value={data.room_capacity}
                                                onChange={(e) => setData('room_capacity', e.target.value)}
                                                placeholder="Max pax"
                                                className="bg-background border-border h-11"
                                            />
                                            {errors.room_capacity && <p className="text-xs font-bold text-destructive mt-1">{errors.room_capacity}</p>}
                                        </div>
                                    </div>

                                    <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
                                        <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto text-muted-foreground order-2 sm:order-1">Cancel</Button>
                                        <Button type="submit" disabled={processing} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/10 order-1 sm:order-2">
                                            {processing ? <Loader2 className="animate-spin size-4 mr-2" /> : <Save className="size-4 mr-2" />}
                                            {isEditMode ? 'Update Category' : 'Save Category'}
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

// --- Main Page Component ---
export default function RoomCategoryPage({ categories = [] }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<RoomCategory | null>(null);

    const openAddModal = () => {
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    const openEditModal = (category: RoomCategory) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const deleteCategory = (id: number) => {
        if (confirm('Are you sure you want to delete this category? All associated rooms will be affected.')) {
            router.delete(roomcategoryRoute.destroy.url(id));
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Room Categories', href: roomcategoryRoute.index.url() }]}>
            <Head title="Room Categories" />

            <div className="min-h-screen bg-background py-6 md:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Responsive Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                        <div className="w-full sm:w-auto">
                            <h2 className="text-3xl font-serif font-bold text-foreground">
                                Room Categories
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Define types of rooms, their prices, and capacities.
                            </p>
                        </div>
                        <Button 
                            onClick={openAddModal} 
                            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md h-11"
                        >
                            <Plus className="size-4 mr-2" /> Add Category
                        </Button>
                    </div>

                    {/* Scrollable Table Card */}
                    <div className="bg-card overflow-hidden shadow-xl rounded-2xl border border-border transition-all">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/10">
                            <table className="min-w-[600px] w-full divide-y divide-border/50">
                                <thead className="bg-muted/30">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Category Name</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nightly Price</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Max Capacity</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {categories.length > 0 ? (
                                        categories.map((cat) => (
                                            <tr key={cat.id} className="group hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                                            <Layers className="size-4" />
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground">{cat.room_category}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-serif font-bold text-primary">
                                                        ₱{Number(cat.price).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="size-3.5 text-primary/60" />
                                                        <span className="font-medium">{cat.room_capacity} Person(s)</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => openEditModal(cat)} 
                                                            className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                        >
                                                            <Edit className="size-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => deleteCategory(cat.id)} 
                                                            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground opacity-30">
                                                    <Layers size={48} className="mb-4" />
                                                    <p className="text-sm font-medium tracking-widest uppercase">No room categories found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <CategoryFormModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                categoryToEdit={editingCategory} 
            />
        </AppLayout>
    );
}

// Helper icon for processing
function Loader2({ className, size }: { className?: string; size?: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}