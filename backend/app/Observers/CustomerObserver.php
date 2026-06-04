<?php
namespace App\Observers;
use App\Models\Customer;

class CustomerObserver
{
    public function saving(Customer $customer)
    {
        $points = $customer->points_balance;
        if ($points < 5000) {
            $customer->tier = 'bronze';
        } elseif ($points < 10000) {
            $customer->tier = 'silver';
        } else {
            $customer->tier = 'gold';
        }
    }
}
