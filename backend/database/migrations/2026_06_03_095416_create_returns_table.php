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
        Schema::create('returns', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('order_id')->index('returns_order_id_foreign');
            $table->unsignedBigInteger('user_id')->index('returns_user_id_foreign');
            $table->json('items')->comment('returned items with quantities');
            $table->text('reason')->nullable();
            $table->decimal('refund_amount', 10);
            $table->enum('refund_method', ['cash', 'mpesa', 'card', 'credit_note'])->default('cash');
            $table->string('image_path')->nullable();
            $table->timestamps();
            $table->decimal('restocking_fee', 10)->default(0);
            $table->boolean('warranty_checked')->default(false);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('returns');
    }
};
