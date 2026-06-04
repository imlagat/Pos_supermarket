<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('loyalty_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('loyalty_transactions', 'customer_id')) {
                $table->foreignId('customer_id')->constrained()->after('id');
            }
        });
    }
    public function down()
    {
        Schema::table('loyalty_transactions', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropColumn('customer_id');
        });
    }
};
