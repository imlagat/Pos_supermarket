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
        Schema::create('products', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('sku')->unique();
            $table->string('barcode')->nullable()->unique();
            $table->string('category')->nullable();
            $table->decimal('base_price', 10);
            $table->integer('stock_quantity')->default(0);
            $table->integer('min_stock_threshold')->default(5);
            $table->boolean('selling_by_weight')->default(false);
            $table->integer('weight_in_grams')->nullable();
            $table->string('unit')->default('piece');
            $table->timestamps();
            $table->decimal('cost_price', 10)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
