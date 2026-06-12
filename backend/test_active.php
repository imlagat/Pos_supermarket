
$controller = app()->make(\App\Http\Controllers\DiscountRuleController::class);
echo "---RESPONSE---\n";
echo json_encode($controller->active());
echo "\n---END---\n";
