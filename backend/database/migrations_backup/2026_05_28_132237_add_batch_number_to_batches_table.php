<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up() {
        Schema::table('batches', function (Blueprint $table) {
            if (!Schema::hasColumn('batches', 'batch_number')) {
                $table->string('batch_number')->unique();
            }
        });
    }
    public function down() {
        Schema::table('batches', function (Blueprint $table) {
            $table->dropColumn('batch_number');
        });
    }
};
