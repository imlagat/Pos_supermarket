<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'sku')) {
                $table->string('sku')->unique()->after('id');
            }
            if (!Schema::hasColumn('products', 'barcode')) {
                $table->string('barcode')->nullable()->unique()->after('sku');
            }
            if (!Schema::hasColumn('products', 'category')) {
                $table->string('category')->nullable()->after('barcode');
            }
            if (!Schema::hasColumn('products', 'base_price')) {
                $table->decimal('base_price', 10, 2)->after('category');
            }
            if (!Schema::hasColumn('products', 'stock_quantity')) {
                $table->integer('stock_quantity')->default(0)->after('base_price');
            }
            if (!Schema::hasColumn('products', 'min_stock_threshold')) {
                $table->integer('min_stock_threshold')->default(5)->after('stock_quantity');
            }
            if (!Schema::hasColumn('products', 'selling_by_weight')) {
                $table->boolean('selling_by_weight')->default(false)->after('min_stock_threshold');
            }
            if (!Schema::hasColumn('products', 'weight_in_grams')) {
                $table->integer('weight_in_grams')->nullable()->after('selling_by_weight');
            }
            if (!Schema::hasColumn('products', 'unit')) {
                $table->string('unit')->default('piece')->after('weight_in_grams');
            }
        });
    }

    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['sku', 'barcode', 'category', 'base_price', 'stock_quantity', 'min_stock_threshold', 'selling_by_weight', 'weight_in_grams', 'unit']);
        });
    }
};
