<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('returns', function (Blueprint $table) {
            if (!Schema::hasColumn('returns', 'order_id')) {
                $table->foreignId('order_id')->constrained();
            }
            if (!Schema::hasColumn('returns', 'user_id')) {
                $table->foreignId('user_id')->constrained();
            }
            if (!Schema::hasColumn('returns', 'items')) {
                $table->json('items');
            }
            if (!Schema::hasColumn('returns', 'reason')) {
                $table->text('reason')->nullable();
            }
            if (!Schema::hasColumn('returns', 'refund_amount')) {
                $table->decimal('refund_amount', 10, 2);
            }
            if (!Schema::hasColumn('returns', 'refund_method')) {
                $table->enum('refund_method', ['cash', 'mpesa', 'card', 'credit_note'])->default('cash');
            }
        });
    }
    public function down()
    {
        Schema::table('returns', function (Blueprint $table) {
            $table->dropColumn(['order_id', 'user_id', 'items', 'reason', 'refund_amount', 'refund_method']);
        });
    }
};
