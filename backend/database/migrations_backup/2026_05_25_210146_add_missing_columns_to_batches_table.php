<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('batches', function (Blueprint $table) {
            if (!Schema::hasColumn('batches', 'product_id')) {
                $table->foreignId('product_id')->constrained()->after('id');
            }
            if (!Schema::hasColumn('batches', 'batch_number')) {
                $table->string('batch_number')->after('product_id');
            }
            if (!Schema::hasColumn('batches', 'expiry_date')) {
                $table->date('expiry_date')->after('batch_number');
            }
            if (!Schema::hasColumn('batches', 'quantity')) {
                $table->integer('quantity')->default(0)->after('expiry_date');
            }
        });
    }

    public function down()
    {
        Schema::table('batches', function (Blueprint $table) {
            $columns = ['product_id', 'batch_number', 'expiry_date', 'quantity'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('batches', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
