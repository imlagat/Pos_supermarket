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
        Schema::table('branch_stocks', function (Blueprint $table) {
            // alternative_unit_id is null for base pieces, and not null for crates/boxes.
            $table->foreignId('alternative_unit_id')->nullable()->constrained()->onDelete('cascade');
            
            // Add a standalone index for branch_id so we can safely drop the composite unique index
            $table->index('branch_id');
        });

        Schema::table('branch_stocks', function (Blueprint $table) {
            $table->dropUnique('branch_stocks_branch_id_product_id_unique');
            $table->unique(['branch_id', 'product_id', 'alternative_unit_id'], 'branch_product_unit_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branch_stocks', function (Blueprint $table) {
            $table->dropUnique('branch_product_unit_unique');
            $table->unique(['branch_id', 'product_id']);
            $table->dropForeign(['alternative_unit_id']);
            $table->dropColumn('alternative_unit_id');
        });
    }
};
