<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('discount_rules', function (Blueprint $table) {
            $table->enum('type', [
                'bogo',
                'percentage',
                'fixed',
                'expiry_markdown',
                'seasonal',
                'member_tier'
            ])->change();
        });
    }

    public function down()
    {
        // Revert to original allowed values
        Schema::table('discount_rules', function (Blueprint $table) {
            $table->enum('type', ['bogo', 'percentage', 'fixed'])->change();
        });
    }
};
