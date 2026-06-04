<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('returns', function (Blueprint $table) {
            if (!Schema::hasColumn('returns', 'restocking_fee')) {
                $table->decimal('restocking_fee', 10, 2)->default(0);
            }
            if (!Schema::hasColumn('returns', 'warranty_checked')) {
                $table->boolean('warranty_checked')->default(false);
            }
            if (!Schema::hasColumn('returns', 'status')) {
                $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            }
        });
    }
    public function down()
    {
        Schema::table('returns', function (Blueprint $table) {
            $table->dropColumn(['restocking_fee', 'warranty_checked', 'status']);
        });
    }
};
