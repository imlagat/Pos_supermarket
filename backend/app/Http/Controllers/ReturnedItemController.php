<?php
namespace App\Http\Controllers;
use App\Models\ReturnedItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReturnedItemController extends Controller
{
    public function index()
    {
        return ReturnedItem::with('product')->orderBy('created_at', 'desc')->get();
    }

    public function markOpenBox(Request $request, ReturnedItem $returnedItem)
    {
        $request->validate([
            'open_box_price' => 'required|numeric|min:0',
        ]);
        $returnedItem->update([
            'status' => 'open_box',
            'open_box_price' => $request->open_box_price,
            'condition' => 'open_box',
        ]);
        return response()->json(['message' => 'Item marked as open box', 'item' => $returnedItem]);
    }

    public function dispose(Request $request, ReturnedItem $returnedItem)
    {
        $request->validate([
            'disposal_reason' => 'required|string',
        ]);
        $returnedItem->update([
            'status' => 'disposed',
            'disposal_reason' => $request->disposal_reason,
        ]);
        return response()->json(['message' => 'Item disposed', 'item' => $returnedItem]);
    }

    public function uploadImage(Request $request, ReturnedItem $returnedItem)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
        $path = $request->file('image')->store('returns', 'public');
        $returnedItem->update(['image_path' => $path]);
        return response()->json(['message' => 'Image uploaded', 'path' => Storage::url($path)]);
    }
}
