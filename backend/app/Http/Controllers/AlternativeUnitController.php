<?php
namespace App\Http\Controllers;
use App\Models\AlternativeUnit;
use Illuminate\Http\Request;

class AlternativeUnitController extends Controller
{
    public function index($productId)
    {
        return AlternativeUnit::where('product_id', $productId)->get();
    }
}
