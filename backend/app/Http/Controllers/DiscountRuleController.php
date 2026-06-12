<?php
namespace App\Http\Controllers;
use App\Models\DiscountRule;
use Illuminate\Http\Request;

class DiscountRuleController extends Controller
{
    public function index()
    {
        return DiscountRule::all();
    }

    public function active()
    {
        $now = now();
        return DiscountRule::where('is_active', true)
            ->where(function($q) use ($now) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->where(function($q) use ($now) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
            })
            ->get();
    }

    public function store(Request $request)
    {
        $rules = [
            'name' => 'required|string',
            'type' => 'required|in:bogo,percentage,fixed,expiry_markdown,seasonal,member_tier',
            'is_active' => 'boolean',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date',
        ];

        if ($request->type === 'bogo') {
            $rules['product_id'] = 'required|exists:products,id';
            $rules['min_quantity'] = 'nullable|integer|min:1';
            $rules['free_quantity'] = 'nullable|integer|min:1';
            $rules['discount_percentage'] = 'nullable|numeric|min:0|max:100';
            $data = $request->only(['name', 'type', 'is_active', 'starts_at', 'ends_at', 'product_id', 'min_quantity', 'free_quantity', 'discount_percentage']);
            $data['value'] = 0; // Set default value to avoid DB error
        } elseif ($request->type === 'percentage' || $request->type === 'fixed') {
            $rules['value'] = 'required|numeric|min:0';
            $data = $request->only(['name', 'type', 'value', 'is_active', 'starts_at', 'ends_at']);
            if ($request->product_id) {
                $rules['product_id'] = 'exists:products,id';
                $data['product_id'] = $request->product_id;
            }
            if ($request->category) {
                $data['category'] = $request->category;
            }
        } elseif ($request->type === 'expiry_markdown') {
            $rules['discount_percentage'] = 'required|numeric|min:0|max:100';
            $rules['days_left_min'] = 'nullable|integer|min:0';
            $rules['days_left_max'] = 'nullable|integer|min:1';
            $data = $request->only(['name', 'type', 'is_active', 'starts_at', 'ends_at', 'discount_percentage', 'days_left_min', 'days_left_max']);
            $data['value'] = 0;
        } elseif ($request->type === 'seasonal') {
            $rules['discount_percentage'] = 'required|numeric|min:0|max:100';
            $data = $request->only(['name', 'type', 'is_active', 'starts_at', 'ends_at', 'discount_percentage']);
            if ($request->product_id) {
                $rules['product_id'] = 'exists:products,id';
                $data['product_id'] = $request->product_id;
            }
            if ($request->category) {
                $data['category'] = $request->category;
            }
            $data['value'] = 0;
        } elseif ($request->type === 'member_tier') {
            $rules['tier'] = 'required|in:bronze,silver,gold';
            $rules['discount_percentage'] = 'required|numeric|min:0|max:100';
            $data = $request->only(['name', 'type', 'is_active', 'tier', 'discount_percentage']);
            $data['value'] = 0;
        } else {
            $data = $request->all();
        }

        $request->validate($rules);
        $discountRule = DiscountRule::create($data);
        return response()->json($discountRule, 201);
    }

    public function show(DiscountRule $discountRule)
    {
        return $discountRule;
    }

    public function update(Request $request, DiscountRule $discountRule)
    {
        // Simplified update for brevity – you can expand similarly
        $discountRule->update($request->all());
        return $discountRule;
    }

    public function destroy(DiscountRule $discountRule)
    {
        $discountRule->delete();
        return response()->noContent();
    }
}
