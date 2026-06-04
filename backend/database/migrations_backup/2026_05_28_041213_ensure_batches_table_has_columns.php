
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('batches', function (Blueprint $table) {
            if (!Schema::hasColumn('batches', 'quantity')) {
                $table->integer('quantity')->default(0);
            }
            if (!Schema::hasColumn('batches', 'expiry_date')) {
                $table->date('expiry_date')->nullable();
            }
        });
    }
    public function down()
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->dropColumn(['quantity', 'expiry_date']);
        });
    }
};
