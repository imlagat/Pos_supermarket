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
            'users', 'branches', 'products', 'customers', 'suppliers', 
            'orders', 'purchase_orders', 'returns', 'drawer_movements', 
            'loyalty_transactions', 'stock_alerts', 'batches', 'branch_stocks', 
            'discount_rules', 'shifts', 'audit_logs'
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        $tables = [
            'users', 'branches', 'products', 'customers', 'suppliers', 
            'orders', 'purchase_orders', 'returns', 'drawer_movements', 
            'loyalty_transactions', 'stock_alerts', 'batches', 'branch_stocks', 
            'discount_rules', 'shifts', 'audit_logs'
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropForeign(['tenant_id']);
                $t->dropColumn('tenant_id');
            });
        }
    }
};
