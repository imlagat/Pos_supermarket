<?php
namespace App\Http\Controllers;
use App\Services\MpesaService;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class MpesaController extends Controller
{
    public function stkPush(Request $request, MpesaService $mpesa)
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

        // Normalize phone number
        $phone = preg_replace('/[^0-9]/', '', $request->phone);
        if (substr($phone, 0, 1) === '0') {
            $phone = '254' . substr($phone, 1);
        } elseif (substr($phone, 0, 3) !== '254') {
            $phone = '254' . $phone;
        }

        $response = $mpesa->stkPush($request->amount, $phone, $request->order_id);

        if (isset($response['error'])) {
            return response()->json(['error' => $response['error']], 500);
        }

        if (isset($response['ResponseCode']) && $response['ResponseCode'] == '0') {
            Cache::put('mpesa_' . $response['CheckoutRequestID'], 'pending', now()->addMinutes(5));
            return response()->json(['message' => 'STK push sent', 'checkout_id' => $response['CheckoutRequestID']]);
        }

        return response()->json(['error' => 'STK push failed', 'details' => $response], 500);
    }


    public function callback(Request $request)
{
    Log::info('M-Pesa callback received', $request->all());

    $body = $request->input('Body.stkCallback');
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
    Cache::put('mpesa_' . $checkoutId, $status, now()->addMinutes(10));

    if ($mpesaCode) {
        Cache::put('mpesa_ref_' . $checkoutId, $mpesaCode, now()->addMinutes(10));
    }

    return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Success']);
}

public function checkStatus(Request $request, string $checkoutId)
{
    $status = Cache::get('mpesa_' . $checkoutId, 'pending');
    $ref = Cache::get('mpesa_ref_' . $checkoutId, null);

    return response()->json([
        'status'     => $status,
        'mpesa_code' => $ref,
    ]);
}

}