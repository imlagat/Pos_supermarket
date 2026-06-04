<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('returns', function (Blueprint $table) {
            if (!Schema::hasColumn('returns', 'image_path')) {
                $table->string('image_path')->nullable()->after('refund_method');
            }
        });
    }
    public function down()
    {
        Schema::table('returns', function (Blueprint $table) {
            $table->dropColumn('image_path');
        });
    }
};
