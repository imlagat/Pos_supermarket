<?php
namespace App\Jobs;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use App\Models\Batch;

class ProcessStockDeduction implements ShouldQueue
{
    use Dispatchable;
    protected $order;
    public function __construct($order) { $this->order = $order; }
    public function handle()
    {
        foreach ($this->order->items as $item) {
            $remaining = $item->quantity;
            $batches = Batch::where('product_id', $item->product_id)
                ->where('quantity', '>', 0)
                ->orderBy('expiry_date')
                ->get();
            foreach ($batches as $batch) {
                if ($remaining <= 0) break;
                $deduct = min($batch->quantity, $remaining);
                $batch->decrement('quantity', $deduct);
                $remaining -= $deduct;
            }
        }
    }
}
