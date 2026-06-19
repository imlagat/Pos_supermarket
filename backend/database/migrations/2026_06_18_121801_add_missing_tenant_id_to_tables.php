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
        $tables = [
            'order_items',
            'payments',
            'purchase_order_items',
            'returns',
            'returned_items',
            'settings',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $tableBlueprint) use ($table) {
                if (!Schema::hasColumn($table, 'tenant_id')) {
                    $tableBlueprint->foreignId('tenant_id')->nullable()->constrained('tenants')->onDelete('cascade');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'order_items',
            'payments',
            'purchase_order_items',
            'returns',
            'returned_items',
            'settings',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $tableBlueprint) {
                $tableBlueprint->dropForeign(['tenant_id']);
                $tableBlueprint->dropColumn('tenant_id');
            });
        }
    }
};
