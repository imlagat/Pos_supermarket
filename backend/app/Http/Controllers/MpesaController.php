<?php
namespace App\Http\Controllers;
use App\Services\MpesaService;
use App\Models\Payment;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class MpesaController extends Controller
{
    public function stkPush(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'phone' => [
                'required',
                'string',
                'regex:/^(07|01|2547)\d{8}$/'
            ],
            'order_id' => 'required|string'
        ]);

        $tenantId = $request->user()->tenant_id;
        
        // Fetch M-Pesa credentials for this tenant
        $settings = Setting::where('tenant_id', $tenantId)
            ->whereIn('key', [
                'mpesa_consumer_key', 
                'mpesa_consumer_secret', 
                'mpesa_shortcode', 
                'mpesa_passkey', 
                'mpesa_environment'
            ])
            ->pluck('value', 'key');
            
        if (!isset($settings['mpesa_consumer_key']) || !isset($settings['mpesa_consumer_secret']) || !isset($settings['mpesa_shortcode']) || !isset($settings['mpesa_passkey'])) {
            return response()->json(['error' => 'M-Pesa API credentials are not configured. Please configure them in Settings.'], 400);
        }

        $credentials = [
            'consumer_key' => $settings['mpesa_consumer_key'],
            'consumer_secret' => $settings['mpesa_consumer_secret'],
            'shortcode' => $settings['mpesa_shortcode'],
            'passkey' => $settings['mpesa_passkey'],
            'environment' => $settings['mpesa_environment'] ?? 'sandbox',
            'callback_url' => url('/api/mpesa/callback/' . $tenantId)
        ];

        $mpesa = new MpesaService($credentials);

        // Normalize phone number
        $phone = preg_replace('/[^0-9]/', '', $request->phone);
        if (substr($phone, 0, 1) === '0') {
            $phone = '254' . substr($phone, 1);
        } elseif (substr($phone, 0, 3) !== '254') {
            $phone = '254' . $phone;
        }

        $response = $mpesa->stkPush($request->amount, $phone, $request->order_id);

        if (isset($response['error'])) {
            return response()->json(['error' => $response['error']], 400);
        }

        if (isset($response['ResponseCode']) && $response['ResponseCode'] == '0') {
            Cache::put('mpesa_' . $tenantId . '_' . $response['CheckoutRequestID'], 'pending', now()->addMinutes(5));
            return response()->json(['message' => 'STK push sent', 'checkout_id' => $response['CheckoutRequestID']]);
        }

        return response()->json(['error' => 'STK push failed', 'details' => $response], 500);
    }


    public function callback(Request $request, $tenant_id)
    {
        Log::info('M-Pesa callback received for tenant ' . $tenant_id, $request->all());

        $body = $request->input('Body.stkCallback');
        if (!$body) return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Success']);

        $checkoutId = $body['CheckoutRequestID'];
        $resultCode  = $body['ResultCode'];

        $mpesaCode = null;
        if ($resultCode === 0) {
            $items = $body['CallbackMetadata']['Item'] ?? [];
            foreach ($items as $item) {
                if ($item['Name'] === 'MpesaReceiptNumber') {
                    $mpesaCode = $item['Value'];
                    break;
                }
            }
        }

        $status = $resultCode === 0 ? 'completed' : 'failed';
        Cache::put('mpesa_' . $tenant_id . '_' . $checkoutId, $status, now()->addMinutes(10));

        if ($mpesaCode) {
            Cache::put('mpesa_ref_' . $tenant_id . '_' . $checkoutId, $mpesaCode, now()->addMinutes(10));
        }

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Success']);
    }

    public function checkStatus(Request $request, string $checkoutId)
    {
        $tenantId = $request->user()->tenant_id;
        $status = Cache::get('mpesa_' . $tenantId . '_' . $checkoutId, 'pending');
        $ref = Cache::get('mpesa_ref_' . $tenantId . '_' . $checkoutId, null);

        return response()->json([
            'status'     => $status,
            'mpesa_code' => $ref,
        ]);
    }

}