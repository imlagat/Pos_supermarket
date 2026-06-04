<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('alternative_units', function (Blueprint $table) {
            if (!Schema::hasColumn('alternative_units', 'stock')) {
                $table->integer('stock')->default(0);
            }
        });
    }
    public function down()
    {
        Schema::table('alternative_units', function (Blueprint $table) {
            $table->dropColumn('stock');
        });
    }
};
