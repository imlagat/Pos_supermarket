<?php
namespace App\Pipelines;
use App\Services\CartObject;
use App\Models\Customer;
use App\Helpers\SettingsHelper;
use Closure;

class ApplyMemberTierDiscount
{
    public function handle(CartObject $cart, Closure $next)
    {
        if (!$cart->customer) {
            return $next($cart);
        }
        $customer = Customer::find($cart->customer);
        if (!$customer) {
            return $next($cart);
        }
        $silverDiscount = (float) SettingsHelper::get('silver_discount', 5);
        $goldDiscount = (float) SettingsHelper::get('gold_discount', 10);
        $discountPercent = match($customer->tier) {
            'silver' => $silverDiscount,
            'gold' => $goldDiscount,
            default => 0,
        };
        if ($discountPercent > 0) {
            $discountAmount = $cart->subtotal * ($discountPercent / 100);
            $cart->applyDiscount("Member {$customer->tier} discount ({$discountPercent}%)", $discountAmount);
        }
        return $next($cart);
    }
}
