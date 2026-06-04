<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('loyalty_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('loyalty_transactions', 'points')) {
                $table->integer('points')->after('customer_id');
            }
        });
    }
    public function down()
    {
        Schema::table('loyalty_transactions', function (Blueprint $table) {
            $table->dropColumn('points');
        });
    }
};
