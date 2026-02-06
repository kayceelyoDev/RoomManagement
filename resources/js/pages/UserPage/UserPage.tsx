import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Search, UserPlus, Shield, UserCog, 
    Mail, Calendar, Trash2, Edit 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

// --- Wayfinder Import ---
import usermanagement from '@/routes/usermanagement';
import CreateUserModal from './modals/CreateUser';
import UpdateUserModal from './modals/UpdateUser';

// --- Modals ---


interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

interface Props {
    users: {
        data: User[];
        links: any[];
    };
    filters: { search?: string };
}

const Badge = ({ role }: { role: string }) => {
    const styles: Record<string, string> = {
        supperadmin: "bg-purple-100 text-purple-700 border-purple-200",
        admin: "bg-blue-100 text-blue-700 border-blue-200",
        staff: "bg-green-100 text-green-700 border-green-200",
    };
    const normalizedRole = role.toLowerCase().replace(' ', '_');
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[normalizedRole] || "bg-gray-100 text-gray-600"}`}>
            {role.replace('_', ' ')}
        </span>
    );
};

export default function UserPage({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    
    // Update Modal State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);

    // Debounced Search using Wayfinder
    useEffect(() => {
        const delay = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get(
                    usermanagement.index.url(), // Wayfinder
                    { search },
                    { preserveState: true, replace: true }
                );
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [search]);

    const openUpdateModal = (user: User) => {
        setSelectedUser(user);
        setIsUpdateOpen(true);
    };

    const handleDelete = (user: User) => {
        if (confirm(`Are you sure you want to remove ${user.name}? This action cannot be undone.`)) {
            // Wayfinder for delete
            router.delete(usermanagement.destroy.url(user.id)); 
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'User Management', href: usermanagement.index.url() }]}>
            <Head title="Staff & Admins" />

            <div className="min-h-screen bg-background py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-foreground">User Management</h1>
                            <p className="text-sm text-muted-foreground mt-1">Manage system access for Staff and Administrators.</p>
                        </div>
                        <Button 
                            onClick={() => setIsCreateOpen(true)}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-primary/90 transition-all active:scale-95"
                        >
                            <UserPlus size={16} /> Add New User
                        </Button>
                    </div>

                    {/* Controls */}
                    <div className="bg-card p-2 rounded-2xl border border-border shadow-sm mb-6 flex items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                            <input 
                                type="text" 
                                placeholder="Search by name or email..." 
                                className="w-full pl-11 h-11 bg-transparent border-none focus:ring-0 text-sm outline-none placeholder:text-muted-foreground/50"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[600px]">
                                <thead className="bg-muted/30 border-b border-border text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">User Details</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Joined Date</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {users.data.length > 0 ? (
                                        users.data.map((user) => (
                                            <tr key={user.id} className="hover:bg-muted/20 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-serif font-bold text-sm uppercase">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-foreground">{user.name}</p>
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <Mail size={12} /> {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {user.role === 'supperadmin' && <Shield size={14} className="text-purple-500"/>}
                                                        {user.role === 'admin' && <Shield size={14} className="text-blue-500"/>}
                                                        {user.role === 'staff' && <UserCog size={14} className="text-green-500"/>}
                                                        <Badge role={user.role} />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="opacity-50" />
                                                        {format(new Date(user.created_at), 'MMM dd, yyyy')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => openUpdateModal(user)}
                                                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                            title="Edit Role"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(user)}
                                                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                            title="Remove User"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                                No users found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        <div className="p-4 border-t border-border flex justify-between items-center bg-muted/10">
                            <span className="text-xs text-muted-foreground">
                                Showing <span className="font-bold text-foreground">{users.data.length}</span> users
                            </span>
                            <div className="flex gap-1">
                                {users.links.map((link, i) => (
                                    link.url ? (
                                        <Link 
                                            key={i} 
                                            href={link.url}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                link.active 
                                                ? 'bg-primary text-primary-foreground shadow-md' 
                                                : 'bg-card border border-border hover:bg-muted text-muted-foreground'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span 
                                            key={i} 
                                            className="px-3 py-1.5 text-xs text-muted-foreground/30 font-bold" 
                                            dangerouslySetInnerHTML={{ __html: link.label }} 
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CreateUserModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
            
            <UpdateUserModal 
                isOpen={isUpdateOpen} 
                onClose={() => {
                    setIsUpdateOpen(false);
                    setSelectedUser(null);
                }} 
                user={selectedUser}
            />
        </AppLayout>
    );
}