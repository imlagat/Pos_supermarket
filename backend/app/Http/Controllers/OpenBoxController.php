<?php
namespace App\Http\Controllers;
use App\Models\ReturnedItem;
use Illuminate\Http\Request;

class OpenBoxController extends Controller
{
    public function index()
    {
        $items = ReturnedItem::with('product')
            ->where('status', 'open_box')
            ->where('quantity', '>', 0)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'returned_item_id' => $item->id,
                    'name' => $item->product->name . ' (Open Box)',
                    'price' => (float) $item->open_box_price,
                    'original_price' => (float) $item->product->base_price,
                    'quantity' => $item->quantity,
                ];
            });
        return response()->json($items);
    }
}
