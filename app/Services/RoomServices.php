<?php

namespace App\Services;

use App\Models\Rooms;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

class RoomServices
{
    /**
     * Create a new room and handle file upload.
     */
    public function createRoom(array $data)
    {
        DB::beginTransaction();
        try {
           
            if (isset($data['img_url']) && $data['img_url'] instanceof UploadedFile) {
               
                $data['img_url'] = $data['img_url']->store('room', 'public');
            }

            $room = Rooms::create($data);
            
            DB::commit();
            return $room;
            
        } catch (Exception $e) {
            DB::rollBack();
          
            throw $e;
        }
    }

    
    public function update(Rooms $room, array $data)
    {
        DB::beginTransaction();
       try {
            if (isset($data['img_url']) && $data['img_url'] instanceof UploadedFile) {
                 // ... (upload logic stays the same) ...
                 $newPath = $data['img_url']->store('room', 'public');
                 if ($room->img_url) {
                    Storage::disk('public')->delete($room->img_url);
                 }
                 $data['img_url'] = $newPath;
            } 
            // ADD THIS ELSE BLOCK FOR EXTRA SAFETY
            else {
                // If it's not a file (e.g. null or string), remove it so we don't wipe the DB column
                unset($data['img_url']);
            }

            $room->update($data);

            DB::commit();
            return $room;
            
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function deleteRoom(Rooms $room)
    {
        DB::beginTransaction();
        try {
            // 1. Delete the image file if it exists
            if ($room->img_url) {
                Storage::disk('public')->delete($room->img_url);
            }

            // 2. Delete the database record
            $room->delete();

            DB::commit();
            return true;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}