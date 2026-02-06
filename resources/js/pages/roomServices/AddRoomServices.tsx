import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import servicesRoute from '@/routes/services';
import { Head, router, useForm } from '@inertiajs/react';
import { Edit, Plus, Save, Tag, Trash2, X, Loader2 } from 'lucide-react';
import { FormEventHandler, useEffect, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

// --- Types ---
interface Service {
    id: number;
    services_name: string;
    services_price: number;
}

interface Props {
    services: Service[];
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

    // Sync form data when modal opens or editing target changes
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
        
        const options = {
            onSuccess: () => {
                onClose(); // Hides modal after server confirmation
                reset();   // Clears form fields
            },
            preserveScroll: true,
        };

        if (isEditMode && serviceToEdit) {
            put(servicesRoute.update.url(serviceToEdit.id), options);
        } else {
            post(servicesRoute.store.url(), options);
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Backdrop overlay */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-card p-6 shadow-2xl border border-border transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title as="h3" className="text-xl font-serif font-bold text-foreground">
                                        {isEditMode ? 'Edit Service' : 'New Service'}
                                    </Dialog.Title>
                                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                                        <X className="size-5" />
                                    </button>
                                </div>

                                <form onSubmit={submit} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="services_name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                            Service Name
                                        </Label>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                            <Input
                                                id="services_name"
                                                value={data.services_name}
                                                onChange={(e) => setData('services_name', e.target.value)}
                                                placeholder="e.g. Extra Bed, Breakfast"
                                                className="pl-10 h-11 bg-background border-border focus:ring-primary/20"
                                            />
                                        </div>
                                        {errors.services_name && <p className="text-xs font-bold text-destructive mt-1">{errors.services_name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="services_price" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                            Service Price
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₱</span>
                                            <Input
                                                id="services_price"
                                                type="number"
                                                value={data.services_price}
                                                onChange={(e) => setData('services_price', e.target.value)}
                                                placeholder="0.00"
                                                className="pl-8 h-11 bg-background border-border focus:ring-primary/20"
                                            />
                                        </div>
                                        {errors.services_price && <p className="text-xs font-bold text-destructive mt-1">{errors.services_price}</p>}
                                    </div>

                                    <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
                                        <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto order-2 sm:order-1 text-muted-foreground">
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={processing} 
                                            className="w-full sm:w-auto order-1 sm:order-2 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/10 transition-transform active:scale-95"
                                        >
                                            {processing ? <Loader2 className="animate-spin size-4 mr-2" /> : <Save className="size-4 mr-2" />}
                                            {isEditMode ? 'Update Service' : 'Add Service'}
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
            router.delete(servicesRoute.destroy.url(id.toString()));
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Services', href: servicesRoute.index.url() }]}>
            <Head title="Manage Services" />

            <div className="min-h-screen bg-background py-6 md:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                        <div className="w-full sm:w-auto">
                            <h2 className="text-3xl font-serif font-bold text-foreground">
                                Services Management
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Manage add-on services available for guests.
                            </p>
                        </div>
                        <Button 
                            onClick={openAddModal} 
                            className="w-full sm:w-auto h-11 bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90"
                        >
                            <Plus className="size-4 mr-2" /> Add Service
                        </Button>
                    </div>

                    {/* Services List (Responsive Table Card) */}
                    <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden transition-all">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/10">
                            <table className="min-w-[600px] w-full divide-y divide-border/50">
                                <thead className="bg-muted/30">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Service Name</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Price</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {services.length > 0 ? (
                                        services.map((service) => (
                                            <tr key={service.id} className="group hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                                            <Tag className="size-4" />
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground">
                                                            {service.services_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-serif font-bold text-primary">
                                                        ₱{Number(service.services_price).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => openEditModal(service)}
                                                            className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                        >
                                                            <Edit className="size-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => deleteService(service.id)}
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
                                            <td colSpan={3} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground opacity-30">
                                                    <Tag size={48} className="mb-4" />
                                                    <p className="text-sm font-medium tracking-widest uppercase">No services found</p>
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

            <ServiceFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                serviceToEdit={editingService}
            />
        </AppLayout>
    );
}