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
        // 1. Drop foreign keys and columns from branch_stocks
        if (Schema::hasTable('branch_stocks') && Schema::hasColumn('branch_stocks', 'alternative_unit_id')) {
            Schema::table('branch_stocks', function (Blueprint $table) {
                // Drop the unique constraint first
                $table->dropUnique('branch_product_unit_unique');
                $table->dropForeign(['alternative_unit_id']);
                $table->dropColumn('alternative_unit_id');
                // Re-add a simple unique constraint for branch and product
                $table->unique(['branch_id', 'product_id'], 'branch_product_unique');
            });
        }

        // 2. Drop foreign key and column from purchase_order_items
        if (Schema::hasTable('purchase_order_items') && Schema::hasColumn('purchase_order_items', 'alternative_unit_id')) {
            Schema::table('purchase_order_items', function (Blueprint $table) {
                $table->dropForeign(['alternative_unit_id']);
                $table->dropColumn('alternative_unit_id');
            });
        }

        // 3. Drop alternative_units table
        Schema::dropIfExists('alternative_units');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverting this is complex; we would need to recreate the table and columns.
        // For simplicity, we just leave it blank or throw an exception.
    }
};
