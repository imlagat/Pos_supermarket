<?php
namespace App\Console\Commands;
use App\Models\Batch;
use App\Models\DiscountRule;
use Illuminate\Console\Command;

class ApplyExpiryMarkdowns extends Command
{
    protected $signature = 'promotion:expiry-markdowns';
    protected $description = 'Create or update expiry markdown discount rules based on days left';
    public function handle()
    {
        // Define expiry tiers
        $tiers = [
            ['days_min' => 0, 'days_max' => 2, 'discount' => 70],
            ['days_min' => 3, 'days_max' => 7, 'discount' => 50],
            ['days_min' => 8, 'days_max' => 30, 'discount' => 20],
        ];
        foreach ($tiers as $tier) {
            $rule = DiscountRule::firstOrCreate(
                [
                    'type' => 'expiry_markdown',
                    'name' => "Expiry markdown ({$tier['days_min']}-{$tier['days_max']} days)",
                ],
                [
                    'is_active' => true,
                    'days_left_min' => $tier['days_min'],
                    'days_left_max' => $tier['days_max'],
                    'discount_percentage' => $tier['discount'],
                    'discount_type' => 'percentage',
                ]
            );
            $this->info("Rule {$rule->name} active.");
        }
    }
}
