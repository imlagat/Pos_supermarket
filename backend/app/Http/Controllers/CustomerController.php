<?php
namespace App\Http\Controllers;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query();
        if ($request->has('tier') && in_array($request->tier, ['bronze', 'silver', 'gold'])) {
            $query->where('tier', $request->tier);
        }
        return $query->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => [
                'required',
                'string',
                'regex:/^(07|01|2547)\d{8}$/',
                Rule::unique('customers')
            ],
            'email' => 'nullable|email|max:255|unique:customers',
            'points_balance' => 'nullable|integer|min:0',
            'tier' => 'nullable|in:bronze,silver,gold'
        ]);
        $customer = Customer::create($validated);
        return response()->json($customer, 201);
    }

    public function show(Customer $customer)
    {
        return $customer;
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => [
                'sometimes',
                'string',
                'regex:/^(07|01|2547)\d{8}$/',
                Rule::unique('customers')->ignore($customer->id)
            ],
            'email' => 'nullable|email|max:255|unique:customers,email,' . $customer->id,
            'points_balance' => 'nullable|integer|min:0',
            'tier' => 'nullable|in:bronze,silver,gold'
        ]);
        $customer->update($validated);
        return $customer;
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();
        return response()->noContent();
    }

    public function redeemPoints(Request $request, Customer $customer)
    {
        $points = $request->points;
        if ($customer->points_balance >= $points) {
            $customer->decrement('points_balance', $points);
            return response()->json(['message' => 'Points redeemed', 'new_balance' => $customer->points_balance]);
        }
        return response()->json(['message' => 'Insufficient points'], 400);
    }

    public function export(Request $request)
    {
        $query = Customer::query();
        if ($request->has('tier') && in_array($request->tier, ['bronze', 'silver', 'gold'])) {
            $query->where('tier', $request->tier);
        }
        $customers = $query->get();

        $filename = 'customers_' . date('Y-m-d_His') . '.csv';
        $handle = fopen('php://temp', 'w+');
        fputcsv($handle, ['Name', 'Phone', 'Email', 'Tier', 'Points Balance']);
        foreach ($customers as $c) {
            fputcsv($handle, [$c->name, $c->phone, $c->email, $c->tier, $c->points_balance]);
        }
        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);

        return response($content, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ]);
    }
}
