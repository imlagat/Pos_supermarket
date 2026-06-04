<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up() {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'order_number')) $table->string('order_number')->unique();
            if (!Schema::hasColumn('orders', 'customer_id')) $table->foreignId('customer_id')->nullable()->constrained();
            if (!Schema::hasColumn('orders', 'user_id')) $table->foreignId('user_id')->constrained();
            if (!Schema::hasColumn('orders', 'total_amount')) $table->decimal('total_amount', 10, 2);
            if (!Schema::hasColumn('orders', 'status')) $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending');
        });
    }
    public function down() {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['order_number', 'customer_id', 'user_id', 'total_amount', 'status']);
        });
    }
};
