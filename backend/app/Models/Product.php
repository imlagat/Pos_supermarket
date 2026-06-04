<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Product extends Model
{
    protected $fillable = [
        'name', 'sku', 'barcode', 'category', 'base_price',
        'stock_quantity', 'min_stock_threshold', 'selling_by_weight',
        'weight_in_grams', 'unit'
    ];

    public function batches() { return $this->hasMany(Batch::class); }
    public function alternativeUnits() { return $this->hasMany(AlternativeUnit::class); }

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
        $baseStock = $this->stock_quantity;
        foreach ($this->alternativeUnits as $unit) {
            $baseStock += $unit->stock * $unit->quantity_in_base_unit;
        }
        return $baseStock;
    }

    public function deductBaseStock($quantity)
    {
        $remaining = $quantity;
        // First use base stock
        $deductFromBase = min($this->stock_quantity, $remaining);
        $this->decrement('stock_quantity', $deductFromBase);
        $remaining -= $deductFromBase;

        if ($remaining > 0) {
            $alternatives = $this->alternativeUnits()->where('stock', '>', 0)->orderBy('price')->get();
            foreach ($alternatives as $unit) {
                if ($remaining <= 0) break;
                $piecesPerUnit = $unit->quantity_in_base_unit;
                $unitsNeeded = ceil($remaining / $piecesPerUnit);
                $unitsToConvert = min($unit->stock, $unitsNeeded);
                $piecesObtained = $unitsToConvert * $piecesPerUnit;
                $unit->decrement('stock', $unitsToConvert);
                $this->increment('stock_quantity', $piecesObtained);
                $deductNow = min($remaining, $piecesObtained);
                $this->decrement('stock_quantity', $deductNow);
                $remaining -= $deductNow;
            }
        }
        return $remaining == 0;
    }

    public function deductAlternativeUnit($alternativeUnitId, $quantity)
    {
        $unit = $this->alternativeUnits()->find($alternativeUnitId);
        if ($unit && $unit->stock >= $quantity) {
            $unit->decrement('stock', $quantity);
            return true;
        }
        return false;
    }
}
