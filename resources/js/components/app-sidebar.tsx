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
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Bed, BookOpen, Folder, icons, LayoutGrid, LogOutIcon, NotebookPen, OutdentIcon, TicketCheck } from 'lucide-react';
import AppLogo from './app-logo';
import { route } from 'ziggy-js';
import rooms from '@/routes/rooms';
import reservation from '@/routes/reservation';
import checkin from '@/routes/checkin';
import checkout from '@/routes/checkout';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title:'Rooms',
        href:rooms.index.url(),
        icon: Bed,
    },
    {
        title:'Reservation',
        href:reservation.index.url(),
        icon: NotebookPen,
    },
    {
        title:'Check-in',
        href:checkin.index.url(),
        icon: TicketCheck,
    },
    {
        title:'Check-out',
        href:checkout.index.url(),
        icon: LogOutIcon,
    }
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
    
];

export function AppSidebar() {
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
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
