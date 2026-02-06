import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { analytics, dashboard } from '@/routes';
import type { NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Bed, Database, LayoutGrid, LogOutIcon, NotebookPen, TicketCheck, User } from 'lucide-react';
import AppLogo from './app-logo';
import rooms from '@/routes/rooms';
import reservation from '@/routes/reservation';
import checkin from '@/routes/checkin';
import checkout from '@/routes/checkout';
import usermanagement from '@/routes/usermanagement';

export function AppSidebar() {
    const { auth } = usePage<any>().props;

    // Build the menu dynamically
    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Rooms',
            href: rooms.index.url(),
            icon: Bed,
        },
        {
            title: 'Reservation',
            href: reservation.index.url(),
            icon: NotebookPen,
        },
        {
            title: 'Check-in',
            href: checkin.index.url(),
            icon: TicketCheck,
        },
        {
            title: 'Check-out',
            href: checkout.index.url(),
            icon: LogOutIcon,
        },
        // Cleaner conditional logic using spread operator
        ...(auth.user?.role === 'supperAdmin' ? [{
            title: 'Users',
            href: usermanagement.index.url(),
            icon: User,
        }] : []),

         ...(auth.user?.role === 'supperAdmin' ? [{
            title: 'Analytics',
            href: analytics.url(),
            icon: Database,
        }] : []),

    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}