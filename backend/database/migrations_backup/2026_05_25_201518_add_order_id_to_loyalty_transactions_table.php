<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('loyalty_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('loyalty_transactions', 'order_id')) {
                $table->foreignId('order_id')->nullable()->constrained()->after('type');
            }
        });
    }
    public function down()
    {
        Schema::table('loyalty_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('loyalty_transactions', 'order_id')) {
                $table->dropForeign(['order_id']);
                $table->dropColumn('order_id');
            }
        });
    }
};
