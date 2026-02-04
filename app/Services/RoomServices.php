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
     * Matches the 'supabase' disk defined in config/filesystems.php
     */
    protected $disk = 'supabase';

    public function createRoom(array $data)
    {
        DB::beginTransaction();
        try {
            if (isset($data['img_url']) && $data['img_url'] instanceof UploadedFile) {
                // Store in the root of the bucket to keep URLs clean
                $path = $data['img_url']->store('/', $this->disk);
                $data['img_url'] = Storage::disk($this->disk)->url($path);
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
               
                if ($room->img_url) {
                    $this->deletePhysicalFile($room->img_url);
                }

               
                $path = $data['img_url']->store('/', $this->disk);
                $data['img_url'] = Storage::disk($this->disk)->url($path);
            } else {
               
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
    
            if ($room->img_url) {
                $this->deletePhysicalFile($room->img_url);
            }

            $room->delete();
            DB::commit();
            return true;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Helper to extract the filename from the Supabase URL and delete it.
     */
    private function deletePhysicalFile(string $fullUrl)
    {
        // 1. Get the path after the domain
        $path = parse_url($fullUrl, PHP_URL_PATH);

      
        $bucketName = config("filesystems.disks.{$this->disk}.bucket");
        $prefix = "/storage/v1/object/public/{$bucketName}/";
        
        $cleanPath = str_replace($prefix, '', $path);

        // 3. Delete only if the file exists to avoid errors
        if (Storage::disk($this->disk)->exists($cleanPath)) {
            Storage::disk($this->disk)->delete($cleanPath);
        }
    }
}