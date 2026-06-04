<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('discount_rules', function (Blueprint $table) {
            $table->decimal('value', 10, 2)->nullable()->change();
        });
    }
    public function down()
    {
        Schema::table('discount_rules', function (Blueprint $table) {
            $table->decimal('value', 10, 2)->nullable(false)->change();
        });
    }
};
