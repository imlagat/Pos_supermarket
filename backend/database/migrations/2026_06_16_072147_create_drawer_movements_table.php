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
        Schema::create('drawer_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shift_id')->constrained()->onDelete('cascade');
            $table->string('type'); // deposit, payout
            $table->decimal('amount', 10, 2);
            $table->string('method')->default('cash'); // cash or mpesa
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('drawer_movements');
    }
};
