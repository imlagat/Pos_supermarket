<?php
namespace App\Console\Commands;
use App\Models\Product;
use App\Models\StockAlert;
use Illuminate\Console\Command;

class CheckLowStock extends Command
{
    protected $signature = 'inventory:check-low-stock';
    protected $description = 'Check products below minimum stock threshold';
    public function handle()
    {
        $products = Product::whereColumn('stock_quantity', '<=', 'min_stock_threshold')->get();
        foreach ($products as $product) {
            StockAlert::updateOrCreate(
                ['product_id' => $product->id, 'type' => 'low_stock'],
                ['notified_at' => now()]
            );
            $this->info("Low stock alert for {$product->name}");
        }
    }
}
