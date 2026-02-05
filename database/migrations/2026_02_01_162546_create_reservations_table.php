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
        Schema::create('reservations', function (Blueprint $table) {
        $table->ulid('id')->primary();
        $table->string('guest_name');
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->foreignId('room_id')->constrained()->cascadeOnDelete();
        $table->string('contact_number'); 
        $table->integer('total_guest');
        $table->integer('extra_person')->default(0);
        $table->dateTime('check_in_date');
        $table->dateTime('check_out_date');
        $table->decimal('reservation_amount', 10, 2); // Best practice for money
        $table->enum('status',['pending', 'confirmed','cancelled','checked_in','checked_out'])->default('pending');
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
