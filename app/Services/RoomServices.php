<?php

namespace App\Services;

use App\Models\Rooms;
use Exception;
use Illuminate\Support\Facades\DB;

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
}
