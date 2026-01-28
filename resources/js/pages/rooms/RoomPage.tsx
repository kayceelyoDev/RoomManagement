import AppLayout from '@/layouts/app-layout'
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react'
import React from 'react'
import { route } from 'ziggy-js';

export default function RoomPage() {
  const breadcrumbs: BreadcrumbItem[] = [
      {
          title: 'Manage Rooms',
          href: route('rooms.index'),
      },
  ];
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Manage Rooms" />
        <div>RoomPage</div>
    </AppLayout>
    
  )
}
