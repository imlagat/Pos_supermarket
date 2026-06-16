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
        Schema::table('shifts', function (Blueprint $table) {
            $table->decimal('opening_mpesa_balance', 10, 2)->default(0)->after('opening_balance');
            $table->decimal('expected_mpesa', 10, 2)->nullable()->after('expected_cash');
            $table->decimal('actual_mpesa', 10, 2)->nullable()->after('actual_cash');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            $table->dropColumn(['opening_mpesa_balance', 'expected_mpesa', 'actual_mpesa']);
        });
    }
};
