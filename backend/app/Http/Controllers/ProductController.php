<?php
namespace App\Http\Controllers;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request) { 
        $user = auth()->user();
        $query = Product::with(['batches', 'branchStocks' => function($q) {
            $q->where('branch_id', app('current_branch_id') ?? 1);
        }]);

        if ($user) {
            if (!$user->isSuperAdmin()) {
                $query->where('tenant_id', $user->tenant_id);
            } elseif ($request->hasHeader('X-Tenant-ID')) {
                $query->where('tenant_id', $request->header('X-Tenant-ID'));
            }
        }

        return $query->get(); 
    }
    public function store(Request $request) { 
        $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100',
            'barcode' => 'nullable|string|max:30',
            'base_price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'nullable|numeric|min:0',
            'min_stock_threshold' => 'nullable|numeric|min:0',
        ], [
            'barcode.max' => 'Barcode length cannot exceed 30 characters.'
        ]);

        $data = $request->except(['stock_quantity', 'expiry_date']);
        if (auth()->check() && auth()->user()->tenant_id) {
            $data['tenant_id'] = auth()->user()->tenant_id;
        }

        $product = Product::create($data); 
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
            } else if ($request->boolean('no_expiry')) {
                \App\Models\Batch::create([
                    'product_id' => $product->id,
                    'branch_id' => app('current_branch_id') ?? 1,
                    'batch_number' => 'B-' . strtoupper(\Illuminate\Support\Str::random(6)),
                    'quantity' => $request->stock_quantity,
                    'expiry_date' => null
                ]);
            }
        }
        return $product->load('batches'); 
    }
    public function show(Product $product) { return $product->load('batches'); }
    public function update(Request $request, Product $product) { 
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'sku' => 'sometimes|required|string|max:100',
            'barcode' => 'nullable|string|max:30',
            'base_price' => 'sometimes|required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'nullable|numeric|min:0',
            'min_stock_threshold' => 'nullable|numeric|min:0',
        ], [
            'barcode.max' => 'Barcode length cannot exceed 30 characters.'
        ]);

        $product->update($request->except(['stock_quantity', 'expiry_date'])); 
        if ($request->has('stock_quantity')) {
            \App\Models\BranchStock::updateOrCreate(
                ['branch_id' => app('current_branch_id') ?? 1, 'product_id' => $product->id],
                ['quantity' => $request->stock_quantity, 'min_stock_threshold' => $request->min_stock_threshold ?? 5]
            );

            if ($request->filled('expiry_date') || $request->boolean('no_expiry')) {
                $batch = \App\Models\Batch::where('product_id', $product->id)->first();
                $newExpiry = $request->boolean('no_expiry') ? null : $request->expiry_date;
                if ($batch) {
                    $batch->update(['expiry_date' => $newExpiry, 'quantity' => $request->stock_quantity]);
                } else {
                    \App\Models\Batch::create([
                        'product_id' => $product->id,
                        'branch_id' => app('current_branch_id') ?? 1,
                        'batch_number' => 'B-' . strtoupper(\Illuminate\Support\Str::random(6)),
                        'quantity' => $request->stock_quantity,
                        'expiry_date' => $newExpiry
                    ]);
                }
            }
        }
        return $product->load('batches'); 
    }
    public function destroy(Product $product)
    {
        try {
            \Illuminate\Support\Facades\DB::transaction(function () use ($product) {
                \App\Models\Batch::where('product_id', $product->id)->delete();
                \App\Models\BranchStock::where('product_id', $product->id)->delete();
                \App\Models\DiscountRule::where('product_id', $product->id)->delete();
                $product->delete();
            });

            return response()->json(['message' => 'Product deleted successfully']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to delete product ID {$product->id}: " . $e->getMessage());
            return response()->json([
                'message' => 'Cannot delete product because it is linked to past sales or transaction records.'
            ], 422);
        }
    }
    public function lookup($barcode)
    {
        $product = Product::where('barcode', $barcode)->first();
        if (!$product) return response()->json(['message' => 'Product not found'], 404);
        return response()->json($product);
    }
}
