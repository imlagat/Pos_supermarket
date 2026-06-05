<?php
namespace App\Pipelines;
use App\Models\DiscountRule;
use App\Services\CartObject;
use App\Models\Batch;
use Closure;
use Carbon\Carbon;

class ApplyAllPromotions
{
    public function handle(CartObject $cart, Closure $next)
    {
        $now = now();
        $rules = DiscountRule::where('is_active', true)
            ->where(function($q) use ($now) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->where(function($q) use ($now) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
            })
            ->get();

        foreach ($rules as $rule) {
            // Skip if rule has product_id and none of cart items match
            if ($rule->product_id) {
                $hasProduct = false;
                foreach ($cart->items as $item) {
                    if ($item['product_id'] == $rule->product_id) {
                        $hasProduct = true;
                        break;
                    }
                }
                if (!$hasProduct) continue;
            }
            // Skip if rule has category and none of cart items match
            if ($rule->category) {
                $hasCategory = false;
                foreach ($cart->items as $item) {
                    $product = \App\Models\Product::find($item['product_id']);
                    if ($product && $product->category == $rule->category) {
                        $hasCategory = true;
                        break;
                    }
                }
                if (!$hasCategory) continue;
            }

            switch ($rule->type) {
                case 'bogo':
                    $this->applyBogo($cart, $rule);
                    break;
                case 'percentage':
                case 'fixed':
                    $this->applyDiscount($cart, $rule);
                    break;
                case 'member_tier':
                    $this->applyMemberTier($cart, $rule);
                    break;
                case 'expiry_markdown':
                    $this->applyExpiryMarkdown($cart, $rule);
                    break;
            }
        }
        return $next($cart);
    }

    private function applyBogo(CartObject $cart, $rule)
    {
        $targetId = $rule->product_id;
        if (!$targetId) return;
        $minQty = $rule->min_quantity ?? 2;
        $freeQty = $rule->free_quantity ?? 1;
        $discountPercent = $rule->discount_percentage ?? 100;

        foreach ($cart->items as &$item) {
            if ($item['product_id'] == $targetId) {
                $qty = $item['quantity'];
                $qualifyingSets = floor($qty / $minQty);
                $freeItems = $qualifyingSets * $freeQty;
                $itemPrice = $item['price'];
                $discountAmount = ($freeItems * $itemPrice) * ($discountPercent / 100);
                $cart->applyDiscount($rule->name, $discountAmount);
                break;
            }
        }
    }

    private function applyDiscount(CartObject $cart, $rule)
    {
        $discountAmount = 0;
        if ($rule->type === 'percentage') {
            $discountAmount = $cart->subtotal * ($rule->value / 100);
        } else {
            $discountAmount = $rule->value;
        }
        $cart->applyDiscount($rule->name, $discountAmount);
    }

    private function applyMemberTier(CartObject $cart, $rule)
    {
        if (!$cart->customer) return;
        $customer = \App\Models\Customer::find($cart->customer);
        if (!$customer) return;
        $tier = $customer->tier;
        $tierDiscount = match($tier) {
            'silver' => 5,
            'gold' => 10,
            default => 0,
        };
        if ($tierDiscount > 0) {
            $discountAmount = $cart->subtotal * ($tierDiscount / 100);
            $cart->applyDiscount("Member {$tier} discount ({$tierDiscount}%)", $discountAmount);
        }
    }

    private function applyExpiryMarkdown(CartObject $cart, $rule)
    {
        foreach ($cart->items as &$item) {
            $productId = $item['product_id'];
            $batches = Batch::where('product_id', $productId)
                ->where('quantity', '>', 0)
                ->orderBy('expiry_date')
                ->get();
            foreach ($batches as $batch) {
                $daysLeft = Carbon::now()->diffInDays($batch->expiry_date, false);
                if ($daysLeft <= $rule->days_left_max && $daysLeft >= $rule->days_left_min) {
                    $discountPercent = $rule->discount_percentage;
                    $discountAmount = $item['price'] * $item['quantity'] * ($discountPercent / 100);
                    $cart->applyDiscount("Expiry sale ({$batch->batch_number})", $discountAmount);
                    break;
                }
            }
        }
    }
}
