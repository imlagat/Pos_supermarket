<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

use App\Traits\Auditable;

class Product extends Model
{
    use \App\Traits\Tenantable;

    use Auditable;
    protected $fillable = [
        'name', 'sku', 'barcode', 'category', 'base_price', 'cost_price',
        'selling_by_weight', 'weight_in_grams', 'unit', 'min_stock_threshold', 'no_expiry'
    ];

    protected $casts = [
        'no_expiry' => 'boolean',
    ];

    protected $appends = ['stock_quantity'];

    public function getStockQuantityAttribute()
    {
        $branchId = app('current_branch_id') ?? 1;
        $stock = \App\Models\BranchStock::where('product_id', $this->id)
                    ->where('branch_id', $branchId)
                    ->first();
        return $stock ? $stock->quantity : 0;
    }

    public function batches() { return $this->hasMany(Batch::class); }
    public function branchStocks() { return $this->hasMany(BranchStock::class); }

    public function getCurrentStockAttribute() {
        return $this->batches()->sum('quantity');
    }

    public static function findByBarcode($barcode) {
        return Cache::remember('product_barcode_'.$barcode, 3600, function() use ($barcode) {
            return self::where('barcode', $barcode)->first();
        });
    }

    public function deductBaseStock($quantity)
    {
        $branchId = app('current_branch_id') ?? 1;
        $baseStockRecord = \App\Models\BranchStock::firstOrCreate(
            ['branch_id' => $branchId, 'product_id' => $this->id],
            ['quantity' => 0]
        );

        if ($baseStockRecord->quantity >= $quantity) {
            $baseStockRecord->decrement('quantity', $quantity);

            // FIFO Batch Deduction based on arrival (created_at)
            $remainingToDeduct = $quantity;
            $batches = \App\Models\Batch::where('product_id', $this->id)
                ->where('branch_id', $branchId)
                ->where('quantity', '>', 0)
                ->orderBy('created_at', 'asc') // First In First Out based on arrival
                ->get();

            foreach ($batches as $batch) {
                if ($remainingToDeduct <= 0) break;

                if ($batch->quantity >= $remainingToDeduct) {
                    $batch->decrement('quantity', $remainingToDeduct);
                    $remainingToDeduct = 0;
                } else {
                    $remainingToDeduct -= $batch->quantity;
                    $batch->update(['quantity' => 0]);
                }
            }

            return true;
        }

        return false;
    }

    public function deductAlternativeUnit($unitId, $quantity)
    {
        // TODO: Implement proper unit conversion if applicable
        // Fallback to base stock deduction using FIFO to avoid fatal error
        return $this->deductBaseStock($quantity);
    }
}
