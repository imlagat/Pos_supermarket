<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'order_id')) {
                $table->foreignId('order_id')->constrained()->after('id');
            }
            if (!Schema::hasColumn('payments', 'amount')) {
                $table->decimal('amount', 10, 2)->after('order_id');
            }
            if (!Schema::hasColumn('payments', 'method')) {
                $table->enum('method', ['cash', 'card', 'mpesa'])->after('amount');
            }
            if (!Schema::hasColumn('payments', 'status')) {
                $table->enum('status', ['pending', 'completed', 'failed'])->default('pending')->after('method');
            }
        });
    }

    public function down()
    {
        Schema::table('payments', function (Blueprint $table) {
            $columns = ['order_id', 'amount', 'method', 'status'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('payments', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
