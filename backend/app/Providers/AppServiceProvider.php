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
        //
    }
    public function boot(): void
    {
        Customer::observe(CustomerObserver::class);

        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return 'http://localhost:5173/reset-password?token='.$token.'&email='.urlencode($notifiable->getEmailForPasswordReset());
        });
    }
}
