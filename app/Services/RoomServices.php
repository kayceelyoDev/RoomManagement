<?php

namespace App\Services;

use App\Models\Rooms;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RoomServices
{
    /**
     * Create a new class instance.
     */
    public function createRoom( array $data){
        DB::beginTransaction();
        try{
            $room = Rooms::create($data);
            DB::commit();
            return $room;
        }catch(Exception $e){
            DB::rollBack();
            throw $e;
        }
    }

    public function update(Rooms $room, array $data)
    {
        DB::beginTransaction();
        try {
         
            if (isset($data['img_url']) && $data['img_url'] instanceof \Illuminate\Http\UploadedFile) {
             
                if ($room->img_url) {
                    Storage::disk('public')->delete($room->img_url);
                }
                
               
                $data['img_url'] = $data['img_url']->store('room', 'public');
            }

            $room->update($data);
            
            DB::commit();
            return $room;
        } catch (Exception $e) {
            DB::rollBack(); 
            throw $e;
        }
    }
}
