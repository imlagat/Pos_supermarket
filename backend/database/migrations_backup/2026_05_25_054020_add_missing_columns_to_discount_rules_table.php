<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('discount_rules', function (Blueprint $table) {
            if (!Schema::hasColumn('discount_rules', 'name')) {
                $table->string('name')->after('id');
            }
            if (!Schema::hasColumn('discount_rules', 'type')) {
                $table->enum('type', ['bogo', 'percentage', 'fixed'])->after('name');
            }
            if (!Schema::hasColumn('discount_rules', 'value')) {
                $table->decimal('value', 10, 2)->after('type');
            }
            if (!Schema::hasColumn('discount_rules', 'conditions')) {
                $table->json('conditions')->nullable()->after('value');
            }
            if (!Schema::hasColumn('discount_rules', 'starts_at')) {
                $table->dateTime('starts_at')->nullable()->after('conditions');
            }
            if (!Schema::hasColumn('discount_rules', 'ends_at')) {
                $table->dateTime('ends_at')->nullable()->after('starts_at');
            }
            if (!Schema::hasColumn('discount_rules', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('ends_at');
            }
        });
    }

    public function down()
    {
        Schema::table('discount_rules', function (Blueprint $table) {
            $columns = ['name', 'type', 'value', 'conditions', 'starts_at', 'ends_at', 'is_active'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('discount_rules', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
