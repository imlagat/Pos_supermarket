<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class UpdateProductSkus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'products:update-skus';

    protected $description = 'Update all existing product SKUs to the new [3-digit-random]-[NAME]-[CAT] format';

    public function handle()
    {
        $products = \App\Models\Product::all();
        $this->info("Found {$products->count()} products. Updating SKUs...");

        foreach ($products as $product) {
            $nameStr = preg_replace('/[^a-zA-Z0-9]/', '', $product->name);
            $catStr = preg_replace('/[^a-zA-Z0-9]/', '', $product->category);

            $namePart = strlen(trim($nameStr)) > 0 ? strtoupper(substr($nameStr, 0, 3)) : 'PRD';
            $catPart = strlen(trim($catStr)) > 0 ? strtoupper(substr($catStr, 0, 3)) : 'GEN';
            $randomPrefix = rand(100, 999);

            $newSku = "{$randomPrefix}-{$namePart}-{$catPart}";

            $product->update(['sku' => $newSku]);
            $this->line("Updated: {$product->name} -> {$newSku}");
        }

        $this->info("All products updated successfully!");
    }
}
