<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('returned_items', function (Blueprint $table) {
            if (!Schema::hasColumn('returned_items', 'image_path')) {
                $table->string('image_path')->nullable();
            }
        });
    }
    public function down()
    {
        Schema::table('returned_items', function (Blueprint $table) {
            $table->dropColumn('image_path');
        });
    }
};
