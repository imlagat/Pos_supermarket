<?php
namespace App\Http\Controllers;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductImportController extends Controller
{
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        $header = fgetcsv($handle); // first row as header

        $expectedHeaders = ['name', 'sku', 'barcode', 'category', 'base_price', 'stock_quantity', 'min_stock_threshold'];
        if (!$header || array_diff($expectedHeaders, array_map('strtolower', $header))) {
            fclose($handle);
            return response()->json(['message' => 'Invalid CSV headers. Expected: ' . implode(',', $expectedHeaders)], 422);
        }

        $products = [];
        $errors = [];
        $rowNumber = 1;
        while (($data = fgetcsv($handle)) !== false) {
            $rowNumber++;
            $row = array_combine($header, $data);
            if (!$row) continue;

            $validator = Validator::make($row, [
                'name' => 'required|string',
                'sku' => 'required|string|unique:products',
                'barcode' => 'nullable|string|unique:products',
                'category' => 'nullable|string',
                'base_price' => 'required|numeric|min:0',
                'stock_quantity' => 'required|integer|min:0',
                'min_stock_threshold' => 'required|integer|min:0',
            ]);

            if ($validator->fails()) {
                $errors[] = "Row $rowNumber: " . implode(', ', $validator->errors()->all());
                continue;
            }

            $products[] = [
                'name' => $row['name'],
                'sku' => $row['sku'],
                'barcode' => $row['barcode'] ?? null,
                'category' => $row['category'] ?? null,
                'base_price' => $row['base_price'],
                'stock_quantity' => $row['stock_quantity'],
                'min_stock_threshold' => $row['min_stock_threshold'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        fclose($handle);

        if (!empty($products)) {
            Product::insert($products);
        }

        return response()->json([
            'message' => 'Import completed',
            'imported' => count($products),
            'errors' => $errors,
        ]);
    }
}
