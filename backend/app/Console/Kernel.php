<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Check low stock daily at 8 AM
        $schedule->command('inventory:check-low-stock')->dailyAt('08:00');
        $schedule->command('promotion:expiry-markdowns')->daily();
        
        // Check expiring batches daily
        $schedule->command('inventory:check-expiry')->daily();
        
        // Apply automatic markdowns for expiring products
        $schedule->command('inventory:apply-markdowns')->daily();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
