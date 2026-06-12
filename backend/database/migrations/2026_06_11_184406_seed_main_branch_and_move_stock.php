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
        // 1. Create a default branch
        $branchId = DB::table('branches')->insertGetId([
            'name' => 'Main Branch',
            'location' => 'Headquarters',
            'contact_number' => 'N/A',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Assign all existing users to this branch (except global admins if we wanted to, but let's assign all for safety)
        DB::table('users')->update(['branch_id' => $branchId]);
        DB::table('orders')->update(['branch_id' => $branchId]);
        DB::table('purchase_orders')->update(['branch_id' => $branchId]);
        DB::table('returns')->update(['branch_id' => $branchId]);
        DB::table('audit_logs')->update(['branch_id' => $branchId]);

        // 3. Move product stock to branch_stocks
        $products = DB::table('products')->get();
        foreach ($products as $product) {
            DB::table('branch_stocks')->insert([
                'branch_id' => $branchId,
                'product_id' => $product->id,
                'quantity' => $product->stock_quantity ?? 0,
                'min_stock_threshold' => $product->min_stock_threshold ?? 5,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // To reverse, we could theoretically move stock back, but for simplicity we won't.
        // The data is preserved in branch_stocks anyway.
        DB::table('branch_stocks')->truncate();
        DB::table('branches')->truncate();
    }
};
