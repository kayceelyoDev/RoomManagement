<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_categories_id')->constrained('room_categories')->cascadeOnDelete();
            $table->string('room_name');
            $table->string('room_description');
            $table->text('img_url');
            $table->integer('max_extra_person');
            $table->string('room_amenities');
            $table->string('type_of_bed');
            $table->enum('status',['available', 'booked', 'occupied', 'unvailable']);
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
