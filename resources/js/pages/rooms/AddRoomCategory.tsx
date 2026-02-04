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
    categories: RoomCategory[]; // Received from Controller
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

    // Reset form when modal opens or switches mode
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
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all dark:bg-gray-800">
                                <div className="flex items-center justify-between mb-5">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-gray-900 dark:text-white">
                                        {isEditMode ? 'Edit Category' : 'Add New Category'}
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                                        <X className="size-5" />
                                    </button>
                                </div>

                                <form onSubmit={submit} className="space-y-4">
                                    {/* Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="room_category" className="flex items-center gap-2 dark:text-gray-200">
                                            <Layers className="size-4" /> Category Name
                                        </Label>
                                        <Input
                                            id="room_category"
                                            value={data.room_category}
                                            onChange={(e) => setData('room_category', e.target.value)}
                                            placeholder="e.g. Deluxe Suite"
                                            className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                                        />
                                        {errors.room_category && <p className="text-sm text-red-500">{errors.room_category}</p>}
                                    </div>

                                    {/* Price & Capacity Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="price" className="flex items-center gap-2 dark:text-gray-200">
                                                <CircleDollarSign className="size-4" /> Price
                                            </Label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <span className="text-gray-500 sm:text-sm">₱</span>
                                                </div>
                                                <Input
                                                    id="price"
                                                    type="number"
                                                    value={data.price}
                                                    onChange={(e) => setData('price', e.target.value)}
                                                    placeholder="0.00"
                                                    className="pl-7 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                                                />
                                            </div>
                                            {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="room_capacity" className="flex items-center gap-2 dark:text-gray-200">
                                                <Users className="size-4" /> Capacity
                                            </Label>
                                            <Input
                                                id="room_capacity"
                                                type="number"
                                                value={data.room_capacity}
                                                onChange={(e) => setData('room_capacity', e.target.value)}
                                                placeholder="Max pax"
                                                className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                                            />
                                            {errors.room_capacity && <p className="text-sm text-red-500">{errors.room_capacity}</p>}
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end gap-3">
                                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                                        <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                            <Save className="size-4 mr-2" />
                                            {processing ? 'Saving...' : 'Save'}
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
export default function RoomCategoryPage({ categories = [] }: Props) { // Default to empty array
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
        if (confirm('Are you sure you want to delete this category? All associated rooms might be affected.')) {
            router.delete(roomcategoryRoute.destroy.url(id));
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Room Categories', href: roomcategoryRoute.index.url() }]}>
            <Head title="Room Categories" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Room Categories
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Define types of rooms, their prices, and capacities.
                            </p>
                        </div>
                        <Button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="size-4 mr-2" /> Add Category
                        </Button>
                    </div>

                    {/* Categories List */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg border dark:border-gray-700">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Capacity</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {categories.length > 0 ? (
                                        categories.map((cat) => (
                                            <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                            <Layers className="size-4" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{cat.room_category}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-bold">
                                                    ₱{Number(cat.price).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="size-3.5 text-gray-400" />
                                                        {cat.room_capacity} Person(s)
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => openEditModal(cat)} className="h-8 w-8 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                                            <Edit className="size-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)} className="h-8 w-8 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                No categories found.
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