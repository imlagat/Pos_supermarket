<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Product;

class DemoProductsSeeder extends Seeder
{
    public function run()
    {
        $products = [
            ['name' => 'Coca-Cola 500ml', 'sku' => 'BEV001', 'barcode' => '1234567890', 'category' => 'Beverages', 'base_price' => 70, 'stock_quantity' => 150, 'min_stock_threshold' => 20],
            ['name' => 'Pepsi 500ml', 'sku' => 'BEV002', 'barcode' => '1234567891', 'category' => 'Beverages', 'base_price' => 70, 'stock_quantity' => 120, 'min_stock_threshold' => 20],
            ['name' => 'Fanta Orange 500ml', 'sku' => 'BEV003', 'barcode' => '1234567892', 'category' => 'Beverages', 'base_price' => 70, 'stock_quantity' => 100, 'min_stock_threshold' => 20],
            ['name' => 'Sprite 500ml', 'sku' => 'BEV004', 'barcode' => '1234567893', 'category' => 'Beverages', 'base_price' => 70, 'stock_quantity' => 130, 'min_stock_threshold' => 20],
            ['name' => 'Milk Fresh 1L', 'sku' => 'DAI001', 'barcode' => '2234567890', 'category' => 'Dairy', 'base_price' => 120, 'stock_quantity' => 80, 'min_stock_threshold' => 15],
            ['name' => 'Yogurt 200g', 'sku' => 'DAI002', 'barcode' => '2234567891', 'category' => 'Dairy', 'base_price' => 45, 'stock_quantity' => 200, 'min_stock_threshold' => 30],
            ['name' => 'Cheese Slices 250g', 'sku' => 'DAI003', 'barcode' => '2234567892', 'category' => 'Dairy', 'base_price' => 250, 'stock_quantity' => 60, 'min_stock_threshold' => 10],
            ['name' => 'Bread White Loaf', 'sku' => 'BAK001', 'barcode' => '3234567890', 'category' => 'Bakery', 'base_price' => 60, 'stock_quantity' => 90, 'min_stock_threshold' => 15],
            ['name' => 'Croissant 6pcs', 'sku' => 'BAK002', 'barcode' => '3234567891', 'category' => 'Bakery', 'base_price' => 180, 'stock_quantity' => 40, 'min_stock_threshold' => 8],
            ['name' => 'Tomatoes 1kg', 'sku' => 'VEG001', 'barcode' => '4234567890', 'category' => 'Vegetables', 'base_price' => 120, 'stock_quantity' => 70, 'min_stock_threshold' => 10, 'selling_by_weight' => true, 'weight_in_grams' => 1000],
            ['name' => 'Onions 1kg', 'sku' => 'VEG002', 'barcode' => '4234567891', 'category' => 'Vegetables', 'base_price' => 90, 'stock_quantity' => 100, 'min_stock_threshold' => 15, 'selling_by_weight' => true, 'weight_in_grams' => 1000],
            ['name' => 'Potatoes 1kg', 'sku' => 'VEG003', 'barcode' => '4234567892', 'category' => 'Vegetables', 'base_price' => 80, 'stock_quantity' => 120, 'min_stock_threshold' => 20, 'selling_by_weight' => true, 'weight_in_grams' => 1000],
            ['name' => 'Apples 1kg', 'sku' => 'FRU001', 'barcode' => '5234567890', 'category' => 'Fruits', 'base_price' => 250, 'stock_quantity' => 50, 'min_stock_threshold' => 8, 'selling_by_weight' => true, 'weight_in_grams' => 1000],
            ['name' => 'Bananas 1kg', 'sku' => 'FRU002', 'barcode' => '5234567891', 'category' => 'Fruits', 'base_price' => 140, 'stock_quantity' => 90, 'min_stock_threshold' => 12, 'selling_by_weight' => true, 'weight_in_grams' => 1000],
            ['name' => 'Oranges 1kg', 'sku' => 'FRU003', 'barcode' => '5234567892', 'category' => 'Fruits', 'base_price' => 200, 'stock_quantity' => 65, 'min_stock_threshold' => 10, 'selling_by_weight' => true, 'weight_in_grams' => 1000],
            ['name' => 'Beef Mince 500g', 'sku' => 'MET001', 'barcode' => '6234567890', 'category' => 'Meat', 'base_price' => 350, 'stock_quantity' => 40, 'min_stock_threshold' => 8],
            ['name' => 'Chicken Breast 500g', 'sku' => 'MET002', 'barcode' => '6234567891', 'category' => 'Meat', 'base_price' => 320, 'stock_quantity' => 45, 'min_stock_threshold' => 8],
            ['name' => 'Cooking Oil 2L', 'sku' => 'PAN001', 'barcode' => '7234567890', 'category' => 'Pantry', 'base_price' => 420, 'stock_quantity' => 60, 'min_stock_threshold' => 10],
            ['name' => 'Rice 5kg', 'sku' => 'PAN002', 'barcode' => '7234567891', 'category' => 'Pantry', 'base_price' => 550, 'stock_quantity' => 80, 'min_stock_threshold' => 15],
            ['name' => 'Sugar 2kg', 'sku' => 'PAN003', 'barcode' => '7234567892', 'category' => 'Pantry', 'base_price' => 220, 'stock_quantity' => 110, 'min_stock_threshold' => 20],
        ];

        foreach ($products as $product) {
            Product::updateOrCreate(
                ['sku' => $product['sku']],
                $product
            );
        }

        $this->command->info('20 demo products added successfully!');
    }
}
