<?php
namespace App\Http\Controllers;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index(Request $request)
    {
        $settings = Setting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        if ($user && $user->tenant) {
            $user->tenant->update($request->only('store_name', 'store_phone', 'store_email', 'store_address', 'currency_symbol', 'tax_rate', 'receipt_footer'));
        }

        $submittedSettings = $request->all();
        foreach ($submittedSettings as $key => $value) {
            if ($value !== null) {
                Setting::updateOrCreate(
                    ['key' => $key],
                    ['value' => $value]
                );
            }
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }

    public function completeOnboarding(Request $request)
    {
        $tenant = $request->user()->tenant;
        if ($tenant) {
            $tenant->update(['has_completed_onboarding' => true]);
        }
        return response()->json(['message' => 'Onboarding complete']);
    }
}
