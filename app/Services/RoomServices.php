<?php

namespace App\Services;

use App\Models\Rooms;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
        $uploadedPath = null;

        DB::beginTransaction();
        try {
            // 1. Handle File Upload BEFORE DB Transaction
            // We store the path so we can delete it if the DB fails
            if (isset($data['img_url']) && $data['img_url'] instanceof UploadedFile) {
                // Store in the root of the bucket
                $uploadedPath = $data['img_url']->store('/', $this->disk);
                
                // Convert path to Full URL for the Database
                $data['img_url'] = Storage::disk($this->disk)->url($uploadedPath);
            }

            // 2. Create Record
            $room = Rooms::create($data);

            DB::commit();
            
            Log::info("Room Created: {$room->room_name} (ID: {$room->id})");
            
            return $room;

        } catch (Exception $e) {
            DB::rollBack();

            // 3. Cleanup: If DB failed, delete the file we just uploaded
            // so we don't fill the bucket with orphaned files.
            if ($uploadedPath) {
                $this->quietlyDeleteFile($uploadedPath);
            }

            Log::error("Failed to create room: " . $e->getMessage());
            throw $e;
        }
    }

    public function update(Rooms $room, array $data)
    {
        $newUploadedPath = null;
        $oldImageUrl = $room->img_url; // Keep reference to old image

        DB::beginTransaction();
        try {
            // 1. Handle New File Upload
            if (isset($data['img_url']) && $data['img_url'] instanceof UploadedFile) {
                $newUploadedPath = $data['img_url']->store('/', $this->disk);
                $data['img_url'] = Storage::disk($this->disk)->url($newUploadedPath);
            } else {
                // If no new file, remove the key so we don't overwrite the existing URL with null
                unset($data['img_url']);
            }

            // 2. Update DB
            $room->update($data);
            
            DB::commit();

            // 3. Cleanup Old File (Only if DB success AND new file was uploaded)
            if ($newUploadedPath && $oldImageUrl) {
                $this->deletePhysicalFile($oldImageUrl);
            }

            Log::info("Room Updated: {$room->room_name} (ID: {$room->id})");
            
            return $room;

        } catch (Exception $e) {
            DB::rollBack();

            // Cleanup: If DB failed, delete the NEW file we just uploaded
            if ($newUploadedPath) {
                $this->quietlyDeleteFile($newUploadedPath);
            }

            Log::error("Failed to update room #{$room->id}: " . $e->getMessage());
            throw $e;
        }
    }

    public function deleteRoom(Rooms $room)
    {
        $imageUrlToDelete = $room->img_url;

        DB::beginTransaction();
        try {
            // 1. Delete DB Record First
            $room->delete();
            
            DB::commit();

            // 2. Delete File (Non-blocking)
            // We do this AFTER commit. If file deletion fails, it's better to have 
            // an orphaned file than a broken app state where the room still exists.
            if ($imageUrlToDelete) {
                $this->deletePhysicalFile($imageUrlToDelete);
            }

            Log::info("Room Deleted: ID {$room->id}");
            return true;

        } catch (Exception $e) {
            DB::rollBack();
            Log::error("Failed to delete room #{$room->id}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Helper to extract the filename from the Supabase URL and delete it.
     * Wrapped in try-catch to prevent storage errors from breaking the app.
     */
    private function deletePhysicalFile(string $fullUrl)
    {
        try {
            // 1. Parse URL to get path
            $path = parse_url($fullUrl, PHP_URL_PATH);
            
            // 2. Clean the path to get the storage key
            // This logic depends on your Supabase URL structure.
            // Adjust the prefix replacement if your URLs look different.
            $bucketName = config("filesystems.disks.{$this->disk}.bucket");
            
            // Typical Supabase Structure: /storage/v1/object/public/{bucket}/{filename}
            $prefix = "/storage/v1/object/public/{$bucketName}/";
            $cleanPath = str_replace($prefix, '', $path);

            // 3. Delete
            if (Storage::disk($this->disk)->exists($cleanPath)) {
                Storage::disk($this->disk)->delete($cleanPath);
                Log::info("Deleted file: {$cleanPath}");
            }
        } catch (\Throwable $e) {
            // Log but don't throw. We don't want to stop the user request 
            // just because an old image couldn't be deleted.
            Log::warning("Could not delete file '{$fullUrl}': " . $e->getMessage());
        }
    }

    /**
     * Simple wrapper to delete a file by direct path (not URL) without throwing errors.
     */
    private function quietlyDeleteFile($path)
    {
        try {
            Storage::disk($this->disk)->delete($path);
        } catch (\Throwable $e) {
            Log::warning("Failed to cleanup orphaned file '{$path}': " . $e->getMessage());
        }
    }
}