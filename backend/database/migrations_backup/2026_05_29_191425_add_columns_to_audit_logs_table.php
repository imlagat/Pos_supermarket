<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('audit_logs', 'user_id')) {
                $table->foreignId('user_id')->nullable()->constrained();
            }
            if (!Schema::hasColumn('audit_logs', 'action')) {
                $table->string('action');
            }
            if (!Schema::hasColumn('audit_logs', 'model_type')) {
                $table->string('model_type')->nullable();
            }
            if (!Schema::hasColumn('audit_logs', 'model_id')) {
                $table->unsignedBigInteger('model_id')->nullable();
            }
            if (!Schema::hasColumn('audit_logs', 'old_values')) {
                $table->json('old_values')->nullable();
            }
            if (!Schema::hasColumn('audit_logs', 'new_values')) {
                $table->json('new_values')->nullable();
            }
            if (!Schema::hasColumn('audit_logs', 'ip_address')) {
                $table->ipAddress('ip_address')->nullable();
            }
        });
    }
    public function down()
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropColumn(['user_id', 'action', 'model_type', 'model_id', 'old_values', 'new_values', 'ip_address']);
        });
    }
};
