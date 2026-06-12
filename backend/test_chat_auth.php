<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$user = \App\Models\User::first();
\Illuminate\Support\Facades\Auth::login($user);

$controller = new \App\Http\Controllers\AIChatbotController();
$request = \Illuminate\Http\Request::create('/api/chat', 'POST', [
    'messages' => [
        ['role' => 'user', 'content' => 'What is the price of an apple?']
    ]
]);
$request->setUserResolver(function () use ($user) {
    return $user;
});

$response = $controller->chat($request);
echo $response->getContent();
