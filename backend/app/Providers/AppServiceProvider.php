<?php
namespace App\Providers;
use Illuminate\Support\ServiceProvider;
use App\Models\Customer;
use App\Observers\CustomerObserver;
use Illuminate\Auth\Notifications\ResetPassword;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind('current_branch_id', function () {
            return null;
        });
    }
    public function boot(): void
    {
        Customer::observe(CustomerObserver::class);

        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            if ($notifiable->isSuperAdmin()) {
                return 'http://localhost:5173/super-admin/reset-password?token='.$token.'&email='.urlencode($notifiable->getEmailForPasswordReset());
            }
            return 'http://localhost:5173/reset-password?token='.$token.'&email='.urlencode($notifiable->getEmailForPasswordReset());
        });

        \Illuminate\Support\Facades\Event::listen(function (\Illuminate\Auth\Events\Login $event) {
            \App\Models\AuditLog::create([
                'user_id' => $event->user->id,
                'action' => 'User Logged In',
                'model_type' => 'Auth',
                'model_id' => $event->user->id,
                'ip_address' => request()->ip(),
            ]);
        });

        \Illuminate\Support\Facades\Event::listen(function (\Illuminate\Auth\Events\Failed $event) {
            \App\Models\AuditLog::create([
                'user_id' => $event->user ? $event->user->id : null,
                'action' => 'Failed Login Attempt',
                'model_type' => 'Auth',
                'old_values' => ['email' => $event->credentials['email'] ?? null],
                'ip_address' => request()->ip(),
            ]);
        });

        \Illuminate\Support\Facades\Event::listen(function (\Illuminate\Auth\Events\Logout $event) {
            \App\Models\AuditLog::create([
                'user_id' => $event->user ? $event->user->id : null,
                'action' => 'User Logged Out',
                'model_type' => 'Auth',
                'model_id' => $event->user ? $event->user->id : null,
                'ip_address' => request()->ip(),
            ]);
        });
    }
}
