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
        Schema::create('payments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamps();
            $table->unsignedBigInteger('order_id')->index('payments_order_id_foreign');
            $table->decimal('amount', 10);
            $table->enum('method', ['cash', 'card', 'mpesa']);
            $table->enum('status', ['pending', 'completed', 'failed'])->default('pending');
            $table->string('reference')->nullable();
            $table->string('checkout_request_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
