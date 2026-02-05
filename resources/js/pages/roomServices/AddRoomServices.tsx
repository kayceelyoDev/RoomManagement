import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import servicesRoute from '@/routes/services';
import { Head, router, useForm } from '@inertiajs/react';
import { CircleDollarSign, Edit, Plus, Save, Tag, Trash2, X } from 'lucide-react';
import { FormEventHandler, useEffect, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

// --- Types ---
interface Service {
    id: number;
    services_name: string;
    services_price: number;
}

interface Props {
    services: Service[]; // Received from Laravel Controller
}

// --- Reusable Modal Component ---
function ServiceFormModal({ 
    isOpen, 
    onClose, 
    serviceToEdit = null 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    serviceToEdit?: Service | null; 
}) {
    const isEditMode = !!serviceToEdit;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        services_name: '',
        services_price: '',
    });

    useEffect(() => {
        if (isOpen) {
            clearErrors();
            if (serviceToEdit) {
                setData({
                    services_name: serviceToEdit.services_name,
                    services_price: serviceToEdit.services_price.toString(),
                });
            } else {
                reset();
            }
        }
    }, [isOpen, serviceToEdit]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        if (isEditMode && serviceToEdit) {
            // Update Logic
            put(servicesRoute.update.url(serviceToEdit.id), {
                onSuccess: () => {
                    onClose();
                    reset();
                }
            });
        } else {
            // Create Logic
            post(servicesRoute.store.url(), {
                onSuccess: () => {
                    onClose();
                    reset();
                }
            });
        }
    };

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
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-card p-6 shadow-xl transition-all border border-border">
                                <div className="flex items-center justify-between mb-5">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-gray-900 dark:text-white">
                                        {isEditMode ? 'Edit Service' : 'Add New Service'}
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                                        <X className="size-5" />
                                    </button>
                                </div>

                                <form onSubmit={submit} className="space-y-4">
                                    {/* Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="services_name" className="flex items-center gap-2 dark:text-gray-200">
                                            <Tag className="size-4" /> Service Name
                                        </Label>
                                        <Input
                                            id="services_name"
                                            value={data.services_name}
                                            onChange={(e) => setData('services_name', e.target.value)}
                                            placeholder="e.g. Breakfast, Extra Bed"
                                            className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                                        />
                                        {errors.services_name && <p className="text-sm text-red-500">{errors.services_name}</p>}
                                    </div>

                                    {/* Price */}
                                    <div className="space-y-2">
                                        <Label htmlFor="services_price" className="flex items-center gap-2 dark:text-gray-200">
                                            <CircleDollarSign className="size-4" /> Price
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                <span className="text-gray-500 sm:text-sm">₱</span>
                                            </div>
                                            <Input
                                                id="services_price"
                                                type="number"
                                                value={data.services_price}
                                                onChange={(e) => setData('services_price', e.target.value)}
                                                placeholder="0.00"
                                                className="pl-7 bg-background border-border text-foreground"
                                            />
                                        </div>
                                        {errors.services_price && <p className="text-sm text-red-500">{errors.services_price}</p>}
                                    </div>

                                    {/* Footer Buttons */}
                                    <div className="mt-6 flex justify-end gap-3">
                                        <Button type="button" variant="outline" onClick={onClose}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={processing} className="bg-primary hover:bg-primary/90 text-primary-foreground">
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
export default function ServicesPage({ services }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    const openAddModal = () => {
        setEditingService(null);
        setIsModalOpen(true);
    };

    const openEditModal = (service: Service) => {
        setEditingService(service);
        setIsModalOpen(true);
    };

    const deleteService = (id: number) => {
        if (confirm('Are you sure you want to delete this service?')) {
            router.delete(servicesRoute.destroy.url(id));
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Services', href: servicesRoute.index.url() }]}>
            <Head title="Manage Services" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Services Management
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Manage add-on services available for guests.
                            </p>
                        </div>
                        <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Plus className="size-4 mr-2" /> Add Service
                        </Button>
                    </div>

                    {/* Services List (Table) */}
                    <div className="bg-card overflow-hidden shadow-sm sm:rounded-lg border border-border">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Service Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {services.length > 0 ? (
                                        services.map((service) => (
                                            <tr key={service.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                                                            <Tag className="size-4" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {service.services_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                        ₱{Number(service.services_price).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => openEditModal(service)}
                                                            className="h-8 w-8 text-primary hover:text-primary/80"
                                                        >
                                                            <Edit className="size-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => deleteService(service.id)}
                                                            className="h-8 w-8 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                No services found. Add one to get started.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Add/Edit */}
            <ServiceFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                serviceToEdit={editingService}
            />
        </AppLayout>
    );
}