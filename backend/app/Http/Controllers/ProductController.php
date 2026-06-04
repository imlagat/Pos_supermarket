<?php
namespace App\Http\Controllers;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index() { return Product::all(); }
    public function store(Request $request) { return Product::create($request->all()); }
    public function show(Product $product) { return $product->load('alternativeUnits', 'batches'); }
    public function update(Request $request, Product $product) { $product->update($request->all()); return $product; }
    public function destroy(Product $product) { $product->delete(); return response()->noContent(); }
    public function lookup($barcode)
    {
        $product = Product::where('barcode', $barcode)->first();
        if (!$product) return response()->json(['message' => 'Product not found'], 404);
        $product->load('alternativeUnits');
        return response()->json($product);
    }
}
