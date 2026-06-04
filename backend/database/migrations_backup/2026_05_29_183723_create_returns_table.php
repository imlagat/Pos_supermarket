<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained();
            $table->foreignId('user_id')->constrained(); // cashier who processed return
            $table->json('items')->comment('returned items with quantities');
            $table->text('reason')->nullable();
            $table->decimal('refund_amount', 10, 2);
            $table->enum('refund_method', ['cash', 'mpesa', 'card', 'credit_note'])->default('cash');
            $table->timestamps();
        });
    }
    public function down()
    {
        Schema::dropIfExists('returns');
    }
};
