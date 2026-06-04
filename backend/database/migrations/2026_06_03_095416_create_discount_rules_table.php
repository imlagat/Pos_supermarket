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
        Schema::create('discount_rules', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->enum('type', ['bogo', 'percentage', 'fixed', 'expiry_markdown', 'seasonal', 'member_tier']);
            $table->decimal('value', 10)->nullable();
            $table->json('conditions')->nullable();
            $table->dateTime('starts_at')->nullable();
            $table->dateTime('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unsignedBigInteger('product_id')->nullable()->index('discount_rules_product_id_foreign');
            $table->string('category')->nullable();
            $table->integer('min_quantity')->default(1);
            $table->integer('free_quantity')->default(0);
            $table->decimal('discount_percentage', 5)->nullable();
            $table->enum('tier', ['bronze', 'silver', 'gold'])->nullable();
            $table->integer('days_left_min')->nullable();
            $table->integer('days_left_max')->nullable();
            $table->enum('discount_type', ['percentage', 'fixed'])->default('percentage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discount_rules');
    }
};
