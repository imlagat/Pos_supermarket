<?php
namespace App\Services;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MpesaService
{
    public function getAccessToken()
    {
        $url = env('MPESA_ENVIRONMENT') === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
            : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

        try {
            $response = Http::withBasicAuth(env('MPESA_CONSUMER_KEY'), env('MPESA_CONSUMER_SECRET'))->get($url);
            $data = $response->json();

            if (isset($data['access_token'])) {
                return $data['access_token'];
            }

            Log::error('M-Pesa token error', [
                'status' => $response->status(),
                'body' => $data ?? $response->body(),
            ]);
            return null;
        } catch (\Exception $e) {
            Log::error('M-Pesa token request failed', ['message' => $e->getMessage()]);
            return null;
        }
    }

    public function stkPush($amount, $phone, $orderId, $accountReference = 'POS Payment')
    {
        // Normalize phone: strip non-digits, then ensure 254 prefix
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (substr($phone, 0, 1) === '0') {
            $phone = '254' . substr($phone, 1);
        } elseif (substr($phone, 0, 3) !== '254') {
            $phone = '254' . $phone;
        }

        $url = env('MPESA_ENVIRONMENT') === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
        $timestamp = now()->format('YmdHis');
        $password = base64_encode(env('MPESA_SHORTCODE').env('MPESA_PASSKEY').$timestamp);
        $payload = [
            'BusinessShortCode' => env('MPESA_SHORTCODE'),
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => 'CustomerPayBillOnline',
            'Amount' => (int) $amount,
            'PartyA' => $phone,
            'PartyB' => env('MPESA_SHORTCODE'),
            'PhoneNumber' => $phone,
            'CallBackURL' => env('MPESA_CALLBACK_URL'),
            'AccountReference' => $accountReference,
            'TransactionDesc' => 'POS Payment'
        ];
        $token = $this->getAccessToken();
        if (!$token) {
            Log::error('M-Pesa: Failed to get access token');
            return ['error' => 'Failed to authenticate with M-Pesa'];
        }
        try {
            $response = Http::withToken($token)->post($url, $payload);
            $result = $response->json();
            Log::info('M-Pesa STK push response', $result ?? ['raw' => $response->body()]);
            return $result;
        } catch (\Exception $e) {
            Log::error('M-Pesa HTTP error: ' . $e->getMessage());
            return ['error' => 'Request failed: ' . $e->getMessage()];
        }
    }
}