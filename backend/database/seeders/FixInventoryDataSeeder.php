<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Batch;
use Carbon\Carbon;

class FixInventoryDataSeeder extends Seeder
{
    public function run()
    {
        $products = Product::all();
        foreach ($products as $product) {
            // Add min threshold if it's 0 or null
            if (!$product->min_stock_threshold) {
                $product->min_stock_threshold = rand(5, 20);
                $product->save();
            }

            // Create a realistic batch if none exists, or just add one to have data
            if ($product->batches()->count() < 2) {
                Batch::create([
                    'product_id' => $product->id,
                    'batch_number' => 'B-' . strtoupper(substr(md5(rand()), 0, 6)),
                    'expiry_date' => Carbon::now()->addDays(rand(10, 180))->toDateString(),
                    'quantity' => rand(10, 50),
                    'branch_id' => 1
                ]);
            }
        }
    }
}
