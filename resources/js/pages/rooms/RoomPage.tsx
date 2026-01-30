import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout'
import { store } from '@/routes/login';
import { BreadcrumbItem } from '@/types';
import { Form, Head, useForm } from '@inertiajs/react'
import React, { FormEventHandler } from 'react'
import { route } from 'ziggy-js';

interface Rooms {
  room_name: string;
  room_description: string;
  room_price: number;
  img_url: string;
};

export default function RoomPage() {
  const { data, setData, post, errors } = useForm({
    room_name: '',
    room_description: '',
    room_price: '',
    img_url: null as File | null,
  });



  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Manage Rooms',
      href: route('rooms.index'),
    },
  ];


  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('rooms.store'))
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Manage Rooms" />
      <div className="border h-full flex items-center justify-center">
        <div className="">
          <form onSubmit={submit} className=''>
            <div className="">
              <Label>Room Name</Label>
              <Input type='text' onChange={(e) => setData('room_name', e.target.value)}></Input>
            </div>

            <div className="">
              <Label>Room Description</Label>
              <Input type='text' onChange={(e) => setData('room_description', e.target.value)}></Input>
            </div>

            <div className="">
              <Label>Room Price</Label>
              <Input type='number' onChange={(e) => setData('room_price', e.target.value)}></Input>
            </div>

            <div className="">
              <Label>Room Image</Label>
              <Input
                type="file"
                onChange={(e) => setData('img_url', e.target.files?.[0] || null)}
              />
            </div>

            <div className="">
              <Button type='submit'>Submit</Button>
            </div>
          </form>

        </div>
      </div>
    </AppLayout>
  )
}
