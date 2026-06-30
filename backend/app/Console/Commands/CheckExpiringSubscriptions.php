<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use Illuminate\Support\Facades\Mail;
use App\Mail\TrialExpiringMail;
use App\Mail\SubscriptionExpiringMail;
use Carbon\Carbon;

class CheckExpiringSubscriptions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:check-expiry';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Checks for expiring trials and subscriptions to send warning emails';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting subscription expiry check...');
        $today = Carbon::now()->startOfDay();

        // 1. Check Expiring Free Trials
        $this->info('Checking free trials...');
        $trialTenants = Tenant::where('billing_status', 'trialing')
            ->whereNotNull('trial_ends_at')
            ->where('is_active', true)
            ->get();

        foreach ($trialTenants as $tenant) {
            $trialEnds = Carbon::parse($tenant->trial_ends_at)->startOfDay();
            $daysLeft = $today->diffInDays($trialEnds, false);

            if ($daysLeft === 3 || $daysLeft === 1) {
                $this->sendEmailToAdmins($tenant, new TrialExpiringMail($tenant, (int)$daysLeft));
                $this->info("Sent trial expiry email to {$tenant->name} ({$daysLeft} days left)");
            }
        }

        // 2. Check Expiring Subscriptions (Active users)
        $this->info('Checking active subscriptions...');
        $subTenants = Tenant::where('billing_status', 'active')
            ->whereNotNull('next_billing_date')
            ->where('is_active', true)
            ->get();

        foreach ($subTenants as $tenant) {
            $subEnds = Carbon::parse($tenant->next_billing_date)->startOfDay();
            $daysLeft = $today->diffInDays($subEnds, false);

            if ($daysLeft >= 0 && $daysLeft <= 5) {
                $this->sendEmailToAdmins($tenant, new SubscriptionExpiringMail($tenant, (int)$daysLeft));
                $this->info("Sent subscription expiry email to {$tenant->name} ({$daysLeft} days left)");
            }
        }

        $this->info('Finished subscription expiry check.');
    }

    private function sendEmailToAdmins(Tenant $tenant, $mailable)
    {
        $admins = $tenant->users()->where('role', 'admin')->get();
        foreach ($admins as $admin) {
            if ($admin->email) {
                Mail::to($admin->email)->send($mailable);
            }
        }
    }
}
