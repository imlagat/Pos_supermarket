<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'reference')) {
                $table->string('reference')->nullable();
            }
            if (!Schema::hasColumn('payments', 'checkout_request_id')) {
                $table->string('checkout_request_id')->nullable();
            }
        });
    }
    public function down()
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['reference', 'checkout_request_id']);
        });
    }
};
