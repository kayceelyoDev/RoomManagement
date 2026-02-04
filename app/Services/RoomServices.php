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
     * This matches the 'rooms_storage' disk we defined in config/filesystems.php
     * which uses the AWS/S3 driver for Laravel Cloud.
     */
    protected $disk = 'rooms_storage'; 

    /**
     * Create a new room and handle cloud bucket upload.
     */
    public function createRoom(array $data)
    {
        DB::beginTransaction();
        try {
            if (isset($data['img_url']) && $data['img_url'] instanceof UploadedFile) {
                // 1. Store file in the 'rooms' folder on the Cloud Disk
                $path = $data['img_url']->store('rooms', $this->disk);
                
                // 2. Generate the FULL URL (https://...) provided by the Cloud Bucket
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
                // 1. Delete old image from Cloud Bucket if it exists
                if ($room->img_url) {
                    $this->deletePhysicalFile($room->img_url);
                }

                // 2. Upload new image and get the new URL
                $path = $data['img_url']->store('rooms', $this->disk);
                $data['img_url'] = Storage::disk($this->disk)->url($path);
            } else {
                // Important: If no new file, don't let the update wipe the existing URL
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
            // Delete the cloud file first
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
     * Helper to clean the URL and delete the file from the cloud bucket.
     */
    private function deletePhysicalFile(string $fullUrl)
    {
        // Extract the path (e.g., /rooms/photo.jpg) from the full https URL
        $path = parse_url($fullUrl, PHP_URL_PATH);
        
        // Remove the leading slash so it becomes 'rooms/photo.jpg'
        $cleanPath = ltrim($path, '/');

        // If your bucket name is included in the URL path, you might need to strip it.
        // For Laravel Cloud / R2, ltrim usually suffices.
        Storage::disk($this->disk)->delete($cleanPath);
    }
}