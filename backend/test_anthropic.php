<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$apiKey = env('ANTHROPIC_API_KEY');
$response = Illuminate\Support\Facades\Http::withHeaders([
    'x-api-key' => $apiKey,
    'anthropic-version' => '2023-06-01',
    'content-type' => 'application/json',
])->post('https://api.anthropic.com/v1/messages', [
    'model' => 'claude-3-5-sonnet-20241022',
    'max_tokens' => 1024,
    'system' => "You are a test assistant.",
    'messages' => [
        ['role' => 'assistant', 'content' => "Hello"],
        ['role' => 'user', 'content' => "what are todays sales?"]
    ],
    'tools' => []
]);
echo "Status: " . $response->status() . "\n";
echo "Body: " . $response->body() . "\n";
