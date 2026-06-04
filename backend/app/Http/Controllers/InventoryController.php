<?php
namespace App\Http\Controllers;
use App\Models\Product;
use App\Models\Batch;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function alerts()
    {
        try {
            $lowStock = Product::whereColumn('stock_quantity', '<=', 'min_stock_threshold')
                ->get()
                ->map(fn($p) => ['product' => $p, 'type' => 'low_stock']);
                
            $expiring = Batch::where('expiry_date', '<=', now()->addDays(7))
                ->where('quantity', '>', 0)
                ->with('product')
                ->get()
                ->map(fn($b) => ['product' => $b->product, 'type' => 'expiring', 'batch' => $b]);
                
            return response()->json($lowStock->merge($expiring));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to load alerts'], 500);
        }
    }

    public function addBatch(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'batch_number' => 'nullable|string|unique:batches,batch_number',
            'expiry_date' => 'required|date',
            'quantity' => 'required|integer|min:1'
        ]);

        // Auto-generate batch number if not provided
        $batchNumber = $request->batch_number ?? 'BATCH-' . $request->product_id . '-' . time();

        $batch = Batch::create([
            'product_id' => $request->product_id,
            'batch_number' => $batchNumber,
            'expiry_date' => $request->expiry_date,
            'quantity' => $request->quantity
        ]);

        $product = Product::find($request->product_id);
        $product->increment('stock_quantity', $request->quantity);

        return response()->json(['message' => 'Batch added successfully', 'batch' => $batch], 201);
    }
}
