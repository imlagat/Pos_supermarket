<?php
namespace App\Http\Controllers;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index() { 
        return Product::with(['batches', 'branchStocks' => function($q) {
            $q->where('branch_id', app('current_branch_id') ?? 1);
        }])->get(); 
    }
    public function store(Request $request) { 
        $product = Product::create($request->except(['stock_quantity', 'expiry_date'])); 
        if ($request->has('stock_quantity')) {
            \App\Models\BranchStock::create([
                'branch_id' => app('current_branch_id') ?? 1,
                'product_id' => $product->id,
                'quantity' => $request->stock_quantity,
                'min_stock_threshold' => $request->min_stock_threshold ?? 5
            ]);

            if ($request->filled('expiry_date')) {
                \App\Models\Batch::create([
                    'product_id' => $product->id,
                    'branch_id' => app('current_branch_id') ?? 1,
                    'batch_number' => 'B-' . strtoupper(\Illuminate\Support\Str::random(6)),
                    'quantity' => $request->stock_quantity,
                    'expiry_date' => $request->expiry_date
                ]);
            }
        }
        return $product->load('batches'); 
    }
    public function show(Product $product) { return $product->load('batches'); }
    public function update(Request $request, Product $product) { 
        $product->update($request->except(['stock_quantity', 'expiry_date'])); 
        if ($request->has('stock_quantity')) {
            \App\Models\BranchStock::updateOrCreate(
                ['branch_id' => app('current_branch_id') ?? 1, 'product_id' => $product->id],
                ['quantity' => $request->stock_quantity, 'min_stock_threshold' => $request->min_stock_threshold ?? 5]
            );

            if ($request->filled('expiry_date')) {
                $batch = \App\Models\Batch::where('product_id', $product->id)->first();
                if ($batch) {
                    $batch->update(['expiry_date' => $request->expiry_date, 'quantity' => $request->stock_quantity]);
                } else {
                    \App\Models\Batch::create([
                        'product_id' => $product->id,
                        'branch_id' => app('current_branch_id') ?? 1,
                        'batch_number' => 'B-' . strtoupper(\Illuminate\Support\Str::random(6)),
                        'quantity' => $request->stock_quantity,
                        'expiry_date' => $request->expiry_date
                    ]);
                }
            }
        }
        return $product->load('batches'); 
    }
    public function destroy(Product $product) { $product->delete(); return response()->noContent(); }
    public function lookup($barcode)
    {
        $product = Product::where('barcode', $barcode)->first();
        if (!$product) return response()->json(['message' => 'Product not found'], 404);
        return response()->json($product);
    }
}
