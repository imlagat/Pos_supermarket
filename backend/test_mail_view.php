<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = new \App\Models\User(['name' => 'John Doe']);
$branch = new \App\Models\Branch(['name' => 'Main Branch']);
$shift = new \App\Models\Shift([
    'opening_time' => now(),
    'closing_time' => now(),
    'opening_balance' => 2000,
    'opening_mpesa_balance' => 5000,
    'expected_cash' => 2174,
    'expected_mpesa' => 5000,
    'expected_card' => 174,
    'actual_cash' => 2174,
    'actual_mpesa' => 5000,
    'actual_card' => 174,
    'variance' => 0,
]);
$shift->setRelation('user', $user);
$shift->setRelation('branch', $branch);

$data = [
    'cashSales' => 174,
    'mpesaSales' => 0,
    'cardSales' => 174,
    'deposits' => 0,
];

try {
    $htmlOpen = view('emails.shifts.opened', ['shift' => $shift])->render();
    echo "Opened mail renders OK\n";
} catch (\Exception $e) {
    echo "Error rendering opened: " . $e->getMessage() . "\n";
}

try {
    $htmlClose = view('emails.shifts.closed', ['shift' => $shift, 'data' => $data])->render();
    echo "Closed mail renders OK\n";
} catch (\Exception $e) {
    echo "Error rendering closed: " . $e->getMessage() . "\n";
}
