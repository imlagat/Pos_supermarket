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
        });
    }

    public function down()
    {
        Schema::table('discount_rules', function (Blueprint $table) {
            if (Schema::hasColumn('discount_rules', 'name')) {
                $table->dropColumn('name');
            }
        });
    }
};
