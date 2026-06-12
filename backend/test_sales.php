$request = \Illuminate\Http\Request::create('/api/reports/sales', 'GET', ['period' => 'weekly']);
$controller = app()->make(\App\Http\Controllers\ReportController::class);
$response = $controller->sales($request);
echo "---RESPONSE---\n";
echo json_encode($response->getData());
echo "\n---END---\n";
