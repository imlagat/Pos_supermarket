<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SendDailySummaries extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-daily-summaries';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send daily sales summaries to all active tenants';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tenants = \App\Models\Tenant::where('is_active', true)->get();

        foreach ($tenants as $tenant) {
            $totalSales = \App\Models\Order::where('tenant_id', $tenant->id)
                ->whereDate('created_at', \Carbon\Carbon::today())
                ->sum('total_amount');

            $admin = \App\Models\User::where('tenant_id', $tenant->id)->where('role', 'admin')->first();

            if ($admin && $totalSales > 0) {
                try {
                    \Illuminate\Support\Facades\Mail::to($admin->email)->send(new \App\Mail\DailySummaryMail($tenant, $totalSales));
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to send daily summary for tenant {$tenant->id}: " . $e->getMessage());
                }
            }
        }
    }
}
