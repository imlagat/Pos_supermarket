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
        Schema::create('returned_items', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('return_id')->index('returned_items_return_id_foreign');
            $table->unsignedBigInteger('product_id')->index('returned_items_product_id_foreign');
            $table->integer('quantity');
            $table->enum('condition', ['defective', 'open_box', 'expired', 'other'])->default('other');
            $table->text('disposal_reason')->nullable();
            $table->decimal('open_box_price', 10)->nullable();
            $table->enum('status', ['pending', 'open_box', 'disposed', 'sold'])->default('pending');
            $table->timestamps();
            $table->string('image_path')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('returned_items');
    }
};
