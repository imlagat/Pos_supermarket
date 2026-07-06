<?php
namespace App\Services;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MpesaService
{
    protected $consumerKey;
    protected $consumerSecret;
    protected $shortcode;
    protected $passkey;
    protected $environment;
    protected $callbackUrl;

    public function __construct(array $credentials = null)
    {
        if ($credentials) {
            $this->consumerKey = $credentials['consumer_key'] ?? env('MPESA_CONSUMER_KEY');
            $this->consumerSecret = $credentials['consumer_secret'] ?? env('MPESA_CONSUMER_SECRET');
            $this->shortcode = $credentials['shortcode'] ?? env('MPESA_SHORTCODE');
            $this->passkey = $credentials['passkey'] ?? env('MPESA_PASSKEY');
            $this->environment = $credentials['environment'] ?? env('MPESA_ENVIRONMENT', 'sandbox');
            $this->callbackUrl = $credentials['callback_url'] ?? env('MPESA_CALLBACK_URL');
        } else {
            $this->consumerKey = env('MPESA_CONSUMER_KEY');
            $this->consumerSecret = env('MPESA_CONSUMER_SECRET');
            $this->shortcode = env('MPESA_SHORTCODE');
            $this->passkey = env('MPESA_PASSKEY');
            $this->environment = env('MPESA_ENVIRONMENT', 'sandbox');
            $this->callbackUrl = env('MPESA_CALLBACK_URL');
        }
    }

    public function getAccessToken()
    {
        $url = $this->environment === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
            : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

        try {
            $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)->get($url);
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

        $url = $this->environment === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
        
        $timestamp = now()->format('YmdHis');
        $password = base64_encode($this->shortcode . $this->passkey . $timestamp);
        
        $payload = [
            'BusinessShortCode' => $this->shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => 'CustomerPayBillOnline',
            'Amount' => (int) $amount,
            'PartyA' => $phone,
            'PartyB' => $this->shortcode,
            'PhoneNumber' => $phone,
            'CallBackURL' => $this->callbackUrl,
            'AccountReference' => $accountReference,
            'TransactionDesc' => 'POS Payment'
        ];
        
        $token = $this->getAccessToken();
        if (!$token) {
            Log::error('M-Pesa: Failed to get access token');
            return ['error' => 'Failed to authenticate with M-Pesa. Please check your credentials.'];
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