<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

use App\Traits\Auditable;

class Product extends Model
{
    use Auditable;
    protected $fillable = [
        'name', 'sku', 'barcode', 'category', 'base_price',
        'selling_by_weight', 'weight_in_grams', 'unit'
    ];

    protected $appends = ['stock_quantity'];

    public function getStockQuantityAttribute()
    {
        $branchId = app('current_branch_id') ?? 1;
        $stock = \App\Models\BranchStock::where('product_id', $this->id)
                    ->where('branch_id', $branchId)
                    ->whereNull('alternative_unit_id')
                    ->first();
        return $stock ? $stock->quantity : 0;
    }

    public function batches() { return $this->hasMany(Batch::class); }
    public function alternativeUnits() { return $this->hasMany(AlternativeUnit::class); }
    public function branchStocks() { return $this->hasMany(BranchStock::class); }

    public function getCurrentStockAttribute() {
        return $this->batches()->sum('quantity');
    }

    public static function findByBarcode($barcode) {
        return Cache::remember('product_barcode_'.$barcode, 3600, function() use ($barcode) {
            return self::where('barcode', $barcode)->first();
        });
    }

    // Multi-unit methods
    public function getTotalBaseStock()
    {
        $branchId = app('current_branch_id') ?? 1;
        $baseStock = $this->stock_quantity;
        $branchUnitStocks = \App\Models\BranchStock::where('product_id', $this->id)
            ->where('branch_id', $branchId)
            ->whereNotNull('alternative_unit_id')
            ->get();
        
        foreach ($branchUnitStocks as $unitStock) {
            $unit = $this->alternativeUnits->firstWhere('id', $unitStock->alternative_unit_id);
            if ($unit) {
                $baseStock += $unitStock->quantity * $unit->quantity_in_base_unit;
            }
        }
        return $baseStock;
    }

    public function deductBaseStock($quantity)
    {
        $branchId = app('current_branch_id') ?? 1;
        $baseStockRecord = \App\Models\BranchStock::firstOrCreate(
            ['branch_id' => $branchId, 'product_id' => $this->id, 'alternative_unit_id' => null],
            ['quantity' => 0]
        );

        $remaining = $quantity;
        // First use base stock
        $deductFromBase = min($baseStockRecord->quantity, $remaining);
        if ($deductFromBase > 0) {
            $baseStockRecord->decrement('quantity', $deductFromBase);
            $remaining -= $deductFromBase;
        }

        if ($remaining > 0) {
            // Auto-unbox alternative units
            $branchUnitStocks = \App\Models\BranchStock::where('product_id', $this->id)
                ->where('branch_id', $branchId)
                ->whereNotNull('alternative_unit_id')
                ->where('quantity', '>', 0)
                ->orderBy('quantity', 'desc') // You might want to order by smallest unit first, but we just pick any available
                ->get();
            
            foreach ($branchUnitStocks as $unitStock) {
                if ($remaining <= 0) break;
                $unit = $this->alternativeUnits->firstWhere('id', $unitStock->alternative_unit_id);
                if (!$unit) continue;

                $piecesPerUnit = $unit->quantity_in_base_unit;
                $unitsNeeded = ceil($remaining / $piecesPerUnit);
                $unitsToConvert = min($unitStock->quantity, $unitsNeeded);
                $piecesObtained = $unitsToConvert * $piecesPerUnit;
                
                // Deduct from unit stock, add to base stock
                $unitStock->decrement('quantity', $unitsToConvert);
                $baseStockRecord->increment('quantity', $piecesObtained);
                
                $deductNow = min($remaining, $piecesObtained);
                $baseStockRecord->decrement('quantity', $deductNow);
                $remaining -= $deductNow;
            }
        }
        return $remaining == 0;
    }

    public function deductAlternativeUnit($alternativeUnitId, $quantity)
    {
        $branchId = app('current_branch_id') ?? 1;
        $unitStock = \App\Models\BranchStock::where('product_id', $this->id)
            ->where('branch_id', $branchId)
            ->where('alternative_unit_id', $alternativeUnitId)
            ->first();
            
        if ($unitStock && $unitStock->quantity >= $quantity) {
            $unitStock->decrement('quantity', $quantity);
            return true;
        }
        return false;
    }
}
