<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('returned_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('return_id')->constrained('returns');
            $table->foreignId('product_id')->constrained();
            $table->integer('quantity');
            $table->enum('condition', ['defective', 'open_box', 'expired', 'other'])->default('other');
            $table->text('disposal_reason')->nullable();
            $table->decimal('open_box_price', 10, 2)->nullable();
            $table->enum('status', ['pending', 'open_box', 'disposed', 'sold'])->default('pending');
            $table->timestamps();
        });
    }
    public function down()
    {
        Schema::dropIfExists('returned_items');
    }
};
