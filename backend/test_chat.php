<?php
$data = [
    'messages' => [
        ['role' => 'user', 'content' => 'What is the price of apple?']
    ]
];
$ch = curl_init('http://localhost:8000/api/chat');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Accept: application/json']);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
$response = curl_exec($ch);
echo $response;
