<?php
namespace App\Services;

class CartObject
{
    public $items = [];
    public $subtotal = 0;
    public $total = 0;
    public $discounts = [];
    public $customer = null;

    public function __construct(array $items, $customer = null)
    {
        $this->items = $items;
        $this->customer = $customer;
        $this->calculateSubtotal();
        $this->total = (float) $this->subtotal;
    }

    private function calculateSubtotal()
    {
        $this->subtotal = 0;
        foreach ($this->items as $item) {
            $this->subtotal += $item['price'] * $item['quantity'];
        }
    }

    public function applyDiscount($name, $amount)
    {
        $this->total -= (float) $amount;
        $this->discounts[] = ['name' => $name, 'amount' => (float) $amount];
    }
}
