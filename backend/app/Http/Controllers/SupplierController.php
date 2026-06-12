<?php
namespace App\Http\Controllers;
use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index() { return Supplier::all(); }
    public function store(Request $request) { return Supplier::create($request->validate(['name'=>'required','phone'=>'nullable','email'=>'nullable','address'=>'nullable','contact_person'=>'nullable'])); }
    public function show(Supplier $supplier) { return $supplier; }
    public function update(Request $request, Supplier $supplier) { $supplier->update($request->all()); return $supplier; }
    public function destroy(Supplier $supplier) { $supplier->delete(); return response()->noContent(); }
    public function purchaseOrders(Supplier $supplier) {
        $orders = $supplier->purchaseOrders()->with('items.product')->orderBy('created_at', 'desc')->get();
        return response()->json($orders);
    }
}
