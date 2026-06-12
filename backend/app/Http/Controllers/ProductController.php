<?php
namespace App\Http\Controllers;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index() { 
        return Product::with(['batches', 'alternativeUnits', 'branchStocks' => function($q) {
            $q->where('branch_id', app('current_branch_id') ?? 1);
        }])->get(); 
    }
    public function store(Request $request) { 
        $product = Product::create($request->except(['stock_quantity', 'alternativeUnits'])); 
        if ($request->has('stock_quantity')) {
            \App\Models\BranchStock::create([
                'branch_id' => app('current_branch_id') ?? 1,
                'product_id' => $product->id,
                'alternative_unit_id' => null,
                'quantity' => $request->stock_quantity,
                'min_stock_threshold' => $request->min_stock_threshold ?? 5
            ]);
        }
        if ($request->has('alternativeUnits')) {
            foreach ($request->alternativeUnits as $unit) {
                $product->alternativeUnits()->create([
                    'unit_name' => $unit['unit_name'],
                    'quantity_in_base_unit' => $unit['quantity_in_base_unit'],
                    'price' => $unit['price']
                ]);
            }
        }
        return $product->load('alternativeUnits', 'batches'); 
    }
    public function show(Product $product) { return $product->load('alternativeUnits', 'batches'); }
    public function update(Request $request, Product $product) { 
        $product->update($request->except(['stock_quantity', 'alternativeUnits'])); 
        if ($request->has('stock_quantity')) {
            \App\Models\BranchStock::updateOrCreate(
                ['branch_id' => app('current_branch_id') ?? 1, 'product_id' => $product->id, 'alternative_unit_id' => null],
                ['quantity' => $request->stock_quantity, 'min_stock_threshold' => $request->min_stock_threshold ?? 5]
            );
        }
        if ($request->has('alternativeUnits')) {
            $product->alternativeUnits()->delete();
            foreach ($request->alternativeUnits as $unit) {
                $product->alternativeUnits()->create([
                    'unit_name' => $unit['unit_name'],
                    'quantity_in_base_unit' => $unit['quantity_in_base_unit'],
                    'price' => $unit['price']
                ]);
            }
        }
        return $product->load('alternativeUnits', 'batches'); 
    }
    public function destroy(Product $product) { $product->delete(); return response()->noContent(); }
    public function lookup($barcode)
    {
        $product = Product::where('barcode', $barcode)->first();
        if (!$product) return response()->json(['message' => 'Product not found'], 404);
        $product->load('alternativeUnits');
        return response()->json($product);
    }

    public function unbox(Request $request, Product $product)
    {
        $request->validate([
            'alternative_unit_id' => 'required|exists:alternative_units,id',
            'quantity' => 'required|integer|min:1'
        ]);

        $branchId = app('current_branch_id') ?? 1;
        
        $unitStock = \App\Models\BranchStock::where('branch_id', $branchId)
            ->where('product_id', $product->id)
            ->where('alternative_unit_id', $request->alternative_unit_id)
            ->first();

        if (!$unitStock || $unitStock->quantity < $request->quantity) {
            return response()->json(['message' => 'Insufficient unit stock to unbox'], 400);
        }

        $unit = \App\Models\AlternativeUnit::find($request->alternative_unit_id);
        if (!$unit || $unit->product_id !== $product->id) {
            return response()->json(['message' => 'Invalid alternative unit'], 400);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($unitStock, $unit, $request, $product, $branchId) {
            $unitStock->decrement('quantity', $request->quantity);
            
            $baseStock = \App\Models\BranchStock::firstOrCreate(
                ['branch_id' => $branchId, 'product_id' => $product->id, 'alternative_unit_id' => null],
                ['quantity' => 0]
            );
            $baseStock->increment('quantity', $request->quantity * $unit->quantity_in_base_unit);
        });

        return response()->json(['message' => 'Unboxed successfully', 'product' => $product->load('alternativeUnits', 'branchStocks')]);
    }
}
