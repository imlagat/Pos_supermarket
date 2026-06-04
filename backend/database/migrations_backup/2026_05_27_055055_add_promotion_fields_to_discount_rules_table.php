<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('discount_rules', function (Blueprint $table) {
            if (!Schema::hasColumn('discount_rules', 'product_id')) {
                $table->foreignId('product_id')->nullable()->constrained()->after('value');
            }
            if (!Schema::hasColumn('discount_rules', 'category')) {
                $table->string('category')->nullable()->after('product_id');
            }
            if (!Schema::hasColumn('discount_rules', 'min_quantity')) {
                $table->integer('min_quantity')->default(1)->after('category');
            }
            if (!Schema::hasColumn('discount_rules', 'free_quantity')) {
                $table->integer('free_quantity')->default(0)->after('min_quantity');
            }
            if (!Schema::hasColumn('discount_rules', 'discount_percentage')) {
                $table->decimal('discount_percentage', 5, 2)->nullable()->after('free_quantity');
            }
            if (!Schema::hasColumn('discount_rules', 'tier')) {
                $table->enum('tier', ['bronze', 'silver', 'gold'])->nullable()->after('discount_percentage');
            }
            if (!Schema::hasColumn('discount_rules', 'days_left_min')) {
                $table->integer('days_left_min')->nullable()->after('tier');
            }
            if (!Schema::hasColumn('discount_rules', 'days_left_max')) {
                $table->integer('days_left_max')->nullable()->after('days_left_min');
            }
            if (!Schema::hasColumn('discount_rules', 'discount_type')) {
                $table->enum('discount_type', ['percentage', 'fixed'])->default('percentage')->after('days_left_max');
            }
        });
    }

    public function down()
    {
        Schema::table('discount_rules', function (Blueprint $table) {
            $columns = ['product_id', 'category', 'min_quantity', 'free_quantity', 'discount_percentage', 'tier', 'days_left_min', 'days_left_max', 'discount_type'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('discount_rules', $col)) $table->dropColumn($col);
            }
        });
    }
};
