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
            $branchId = app('current_branch_id') ?? 1;
            $lowStock = \App\Models\BranchStock::whereColumn('quantity', '<=', 'min_stock_threshold')
                ->where('branch_id', $branchId)
                ->with('product')
                ->get()
                ->map(fn($s) => ['product' => $s->product, 'type' => 'low_stock', 'stock' => $s->quantity]);
                
            $expiring = Batch::where('expiry_date', '<=', now()->addDays(7))
                ->where('quantity', '>', 0)
                ->with('product')
                ->get()
                ->map(fn($b) => ['product' => $b->product, 'type' => 'expiring', 'batch' => $b]);
                
            return response()->json(array_merge($lowStock->toArray(), $expiring->toArray()));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Inventory alerts error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load alerts: ' . $e->getMessage()], 500);
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

        $branchId = app('current_branch_id') ?? 1;

        $batch = Batch::create([
            'branch_id' => $branchId,
            'product_id' => $request->product_id,
            'batch_number' => $batchNumber,
            'expiry_date' => $request->expiry_date,
            'quantity' => $request->quantity
        ]);

        $branchId = app('current_branch_id') ?? 1;
        $stockRecord = \App\Models\BranchStock::firstOrCreate(
            ['branch_id' => $branchId, 'product_id' => $request->product_id],
            ['quantity' => 0, 'min_stock_threshold' => 5]
        );
        $stockRecord->increment('quantity', $request->quantity);

        return response()->json(['message' => 'Batch added successfully', 'batch' => $batch], 201);
    }

    public function getBatches()
    {
        $batches = Batch::with('product')->orderBy('created_at', 'desc')->get();
        return response()->json($batches);
    }

    public function updateBatch(Request $request, Batch $batch)
    {
        $request->validate([
            'expiry_date' => 'nullable|date',
            'created_at' => 'nullable|date'
        ]);

        $batch->update([
            'expiry_date' => $request->expiry_date,
            'created_at' => $request->created_at ? \Carbon\Carbon::parse($request->created_at) : $batch->created_at,
        ]);

        return response()->json(['message' => 'Batch updated successfully', 'batch' => $batch]);
    }
}
