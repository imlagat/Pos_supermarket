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
        Schema::table('customers', function (Blueprint $table) {
            // Drop global unique constraint on phone
            $table->dropUnique('customers_phone_unique');
            
            // Add tenant-scoped unique constraints
            $table->unique(['tenant_id', 'phone'], 'customers_tenant_phone_unique');
            $table->unique(['tenant_id', 'email'], 'customers_tenant_email_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropUnique('customers_tenant_phone_unique');
            $table->dropUnique('customers_tenant_email_unique');
            
            // Restore global unique constraint on phone
            $table->unique('phone');
        });
    }
};
