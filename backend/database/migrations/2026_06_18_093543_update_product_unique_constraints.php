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
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_sku_unique');
            $table->dropUnique('products_barcode_unique');
            
            $table->unique(['tenant_id', 'sku'], 'tenant_sku_unique');
            $table->unique(['tenant_id', 'barcode'], 'tenant_barcode_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('tenant_sku_unique');
            $table->dropUnique('tenant_barcode_unique');

            $table->unique('sku', 'products_sku_unique');
            $table->unique('barcode', 'products_barcode_unique');
        });
    }
};
