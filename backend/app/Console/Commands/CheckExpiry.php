<?php
namespace App\Console\Commands;
use App\Models\Batch;
use App\Models\StockAlert;
use Illuminate\Console\Command;

class CheckExpiry extends Command
{
    protected $signature = 'inventory:check-expiry';
    protected $description = 'Check batches expiring within 7 days';
    public function handle()
    {
        $batches = Batch::where('expiry_date', '<=', now()->addDays(7))
            ->where('quantity', '>', 0)
            ->with('product')
            ->get();
        foreach ($batches as $batch) {
            StockAlert::updateOrCreate(
                ['product_id' => $batch->product_id, 'type' => 'expiring'],
                ['notified_at' => now()]
            );
            $this->info("Expiry alert for {$batch->product->name} (batch {$batch->batch_number})");
        }
    }
}
