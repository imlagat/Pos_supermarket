<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Product;
use App\Models\Order;
use App\Models\ReturnOrder;
use App\Models\ReturnedItem;
use App\Models\DiscountRule;
use App\Models\Supplier;

class AIChatbotController extends Controller
{
    private $apiKey;

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY');
    }

    public function chat(Request $request)
    {
        $messages = $request->input('messages', []);
        $user = Auth::user();
        
        if (empty($this->apiKey)) {
            return $this->localFallbackChat($messages, $user);
        }

        $role = $user ? $user->role : 'guest';
        $name = $user ? $user->name : 'User';
        
        $systemPrompt = "You are the official Supermarket AI Assistant. "
            . "The current user is '{$name}' logged in with the role: [{$role}].\n"
            . "Role Guidelines:\n"
            . "- If role is 'admin' or 'manager', provide comprehensive strategic insights, acknowledge their leadership role, and offer detailed analytical data when asked. You are permitted to use create_discount and create_open_box_deal.\n"
            . "- If role is 'cashier', maintain a helpful and supportive tone focused exclusively on daily operations (e.g. stock lookups, processing returns). You must NOT reveal sensitive financial reports. If they ask for sensitive data, explicitly explain that as a cashier, they do not have access to financial reports.\n"
            . "You have access to several tools to query and mutate the database. Use them when requested.\n"
            . "- To process a return, you must ask the user for the order ID and the product IDs/quantities if they haven't provided them. Use the perform_return tool.\n"
            . "- To create an open box deal, you must first know the returned_item_id. Ask the user if they haven't provided it.\n"
            . "- To create a discount, use create_discount. You must know the product ID.\n"
            . "If a tool returns an error saying 'Permission denied', apologize politely and inform the user that their role ({$role}) does not have the required privileges.\n";

        // Gemini tool definitions
        $functionDeclarations = [
            [
                'name' => 'lookup_product',
                'description' => 'Look up a product in the inventory by name or SKU to check its price and stock level.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'query' => ['type' => 'STRING', 'description' => 'The exact short name or exact SKU to search for (e.g., "SKU011" or "Yoghurt"). Extract only the core keyword. NEVER pass a full phrase or sentence.']
                    ],
                    'required' => ['query']
                ]
            ],
            [
                'name' => 'get_low_stock',
                'description' => 'Get a list of products that are currently low on stock.'
            ],
            [
                'name' => 'get_sales_report',
                'description' => 'Get a summary of total sales, refunds, and order counts. Only Admin and Manager roles are allowed.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'period' => ['type' => 'STRING', 'description' => 'The time period for the sales report. Allowed values: daily, weekly, monthly, all_time.']
                    ],
                    'required' => ['period']
                ]
            ],
            [
                'name' => 'create_discount',
                'description' => 'Create a discount rule for a specific product. Only Admin and Manager roles are allowed.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'name' => ['type' => 'STRING', 'description' => 'Name of the discount (e.g. Summer Sale)'],
                        'discount_type' => ['type' => 'STRING', 'description' => 'Type of discount: percentage or fixed'],
                        'value' => ['type' => 'NUMBER', 'description' => 'Discount amount or percentage'],
                        'product_id' => ['type' => 'INTEGER', 'description' => 'ID of the product to apply discount to'],
                        'starts_at' => ['type' => 'STRING', 'description' => 'Start date (YYYY-MM-DD)'],
                        'ends_at' => ['type' => 'STRING', 'description' => 'End date (YYYY-MM-DD)']
                    ],
                    'required' => ['name', 'discount_type', 'value', 'product_id']
                ]
            ],
            [
                'name' => 'perform_return',
                'description' => 'Process a return for a specific order. Ensure you have the order ID and items list.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'order_id' => ['type' => 'INTEGER', 'description' => 'The ID of the order being returned'],
                        'items' => [
                            'type' => 'ARRAY',
                            'description' => 'List of items to return',
                            'items' => [
                                'type' => 'OBJECT',
                                'properties' => [
                                    'product_id' => ['type' => 'INTEGER'],
                                    'quantity' => ['type' => 'INTEGER']
                                ]
                            ]
                        ],
                        'reason' => ['type' => 'STRING', 'description' => 'Reason for return'],
                        'refund_amount' => ['type' => 'NUMBER', 'description' => 'Total amount to refund'],
                        'refund_method' => ['type' => 'STRING', 'description' => 'Method: cash, mpesa, card, credit_note']
                    ],
                    'required' => ['order_id', 'items', 'refund_amount', 'refund_method']
                ]
            ],
            [
                'name' => 'get_recent_transactions',
                'description' => 'Get a list of the most recent completed orders/transactions.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'limit' => ['type' => 'INTEGER', 'description' => 'Number of recent transactions to fetch (default 5)']
                    ]
                ]
            ],
            [
                'name' => 'get_suppliers_count',
                'description' => 'Get the total count of registered suppliers in the system.'
            ],
            [
                'name' => 'create_open_box_deal',
                'description' => 'Mark a returned item as an Open Box deal with a special price. Only Admin and Manager roles are allowed.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'returned_item_id' => ['type' => 'INTEGER', 'description' => 'The ID of the ReturnedItem record'],
                        'open_box_price' => ['type' => 'NUMBER', 'description' => 'The special discounted price for the open box item']
                    ],
                    'required' => ['returned_item_id', 'open_box_price']
                ]
            ]
        ];

        // Format user messages for Gemini
        $geminiMessages = [];
        foreach ($messages as $msg) {
            if ($msg['role'] !== 'system') {
                if (isset($msg['content']) && is_string($msg['content'])) {
                    $geminiMessages[] = [
                        'role' => $msg['role'] === 'assistant' ? 'model' : 'user',
                        'parts' => [['text' => $msg['content']]]
                    ];
                }
            }
        }

        // Send to Gemini
        $response = $this->callGemini($geminiMessages, $systemPrompt, $functionDeclarations);

        if (!$response->successful()) {
            $errorResponse = $response->json();
            $errorMessage = $errorResponse['error']['message'] ?? 'Failed to connect to Gemini API';
            return response()->json(['error' => 'API Error: ' . $errorMessage, 'details' => $errorResponse], 500);
        }

        $maxToolCalls = 5;
        $toolCallCount = 0;

        while ($toolCallCount < $maxToolCalls) {
            $data = $response->json();
            $candidate = $data['candidates'][0]['content'] ?? null;
            
            if (!$candidate) {
                return response()->json(['error' => 'API Error: Invalid response from Gemini', 'details' => $data], 500);
            }

            $toolUse = null;
            $assistantText = '';
            
            foreach ($candidate['parts'] as $part) {
                if (isset($part['functionCall'])) {
                    $toolUse = $part['functionCall'];
                } elseif (isset($part['text'])) {
                    $assistantText .= $part['text'];
                }
            }

            // If there's a tool use, execute it and loop again
            if ($toolUse) {
                $toolCallCount++;
                
                // Execute the local function
                $toolResult = $this->executeTool($toolUse['name'], $toolUse['args'] ?? [], $user);
                
                // Ensure functionCall args serialize to {} instead of [] when empty
                $modelParts = $candidate['parts'];
                foreach ($modelParts as &$p) {
                    if (isset($p['functionCall'])) {
                        if (!isset($p['functionCall']['args']) || (is_array($p['functionCall']['args']) && empty($p['functionCall']['args']))) {
                            $p['functionCall']['args'] = new \stdClass();
                        } elseif (is_array($p['functionCall']['args'])) {
                            $p['functionCall']['args'] = (object) $p['functionCall']['args'];
                        }
                    }
                }

                // Append model's tool call request to history
                $geminiMessages[] = [
                    'role' => 'model',
                    'parts' => $modelParts
                ];
                
                // Append tool result as user role
                $geminiMessages[] = [
                    'role' => 'user',
                    'parts' => [
                        [
                            'functionResponse' => [
                                'name' => $toolUse['name'],
                                'response' => [
                                    'name' => $toolUse['name'],
                                    'content' => $toolResult
                                ]
                            ]
                        ]
                    ]
                ];

                // Call Gemini again with the updated history
                $response = $this->callGemini($geminiMessages, $systemPrompt, $functionDeclarations);
                
                if (!$response->successful()) {
                    $errorResponse = $response->json();
                    $errorMessage = $errorResponse['error']['message'] ?? 'Subsequent Gemini API call failed';
                    return response()->json(['error' => 'API Error: ' . $errorMessage, 'details' => $errorResponse], 500);
                }
                
                continue; // Loop again to process the new response
            }

            // If no tool use, we have our final text response
            return response()->json(['message' => ['role' => 'assistant', 'content' => $assistantText]]);
        }
        
        return response()->json(['error' => 'API Error: Maximum tool call limit reached'], 500);
    }

    private function callGemini($messages, $systemPrompt, $functionDeclarations)
    {
        $payload = [
            'systemInstruction' => [
                'parts' => [['text' => $systemPrompt]]
            ],
            'contents' => $messages,
            'tools' => [
                ['functionDeclarations' => $functionDeclarations]
            ],
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => 1024,
            ]
        ];

        return Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . $this->apiKey, $payload);
    }

    private function localFallbackChat($messages, $user)
    {
        return response()->json([
            'message' => [
                'role' => 'assistant', 
                'content' => "*(Running in Offline Mode - Gemini API Key missing)*\nPlease configure your GEMINI_API_KEY."
            ]
        ]);
    }

    private function executeTool($name, $arguments, $user)
    {
        switch ($name) {
            case 'lookup_product':
                $query = $arguments['query'] ?? '';
                $products = Product::where('name', 'like', "%{$query}%")
                    ->orWhere('sku', 'like', "%{$query}%")
                    ->orWhere('barcode', 'like', "%{$query}%")
                    ->take(5)
                    ->get(['id', 'name', 'sku', 'base_price', 'category']);
                
                if ($products->isEmpty()) {
                    return ['status' => 'not_found', 'message' => 'No products found matching the query.'];
                }
                return ['status' => 'success', 'data' => $products];

            case 'get_low_stock':
                $lowStock = Product::join('branch_stocks', 'products.id', '=', 'branch_stocks.product_id')
                    ->whereColumn('branch_stocks.quantity', '<=', 'branch_stocks.min_stock_threshold')
                    ->take(20)
                    ->get(['products.id', 'products.name', 'products.sku', 'branch_stocks.quantity as stock_quantity', 'branch_stocks.min_stock_threshold']);
                return ['status' => 'success', 'data' => $lowStock];

            case 'get_sales_report':
                if (!$user || ($user->role !== 'admin' && $user->role !== 'manager')) {
                    return [
                        'status' => 'error', 
                        'message' => 'Permission denied. Only Admin and Manager roles are allowed to view sales data.'
                    ];
                }

                $period = $arguments['period'] ?? 'daily';
                
                $startDate = null;
                if ($period === 'daily') $startDate = now()->startOfDay();
                elseif ($period === 'weekly') $startDate = now()->subDays(6)->startOfDay();
                elseif ($period === 'monthly') $startDate = now()->subDays(29)->startOfDay();

                $query = Order::where('status', 'completed');
                $refundQuery = ReturnOrder::query();

                if ($startDate) {
                    $query->where('created_at', '>=', $startDate);
                    $refundQuery->where('created_at', '>=', $startDate);
                }

                $grossSales = $query->sum('total_amount');
                $totalRefunds = $refundQuery->sum('refund_amount');
                $netSales = $grossSales - $totalRefunds;
                $ordersCount = $query->count();

                return [
                    'status' => 'success',
                    'period' => $period,
                    'data' => [
                        'gross_sales' => $grossSales,
                        'total_refunds' => $totalRefunds,
                        'net_sales' => $netSales,
                        'total_orders' => $ordersCount
                    ]
                ];

            case 'create_discount':
                if (!$user || ($user->role !== 'admin' && $user->role !== 'manager')) {
                    return ['status' => 'error', 'message' => 'Permission denied. Only Admin and Manager can create discounts.'];
                }
                try {
                    $discount = DiscountRule::create([
                        'name' => $arguments['name'],
                        'type' => $arguments['discount_type'],
                        'product_id' => $arguments['product_id'],
                        'discount_type' => $arguments['discount_type'],
                        'value' => $arguments['value'],
                        'starts_at' => $arguments['starts_at'] ?? now(),
                        'ends_at' => $arguments['ends_at'] ?? now()->addDays(7),
                        'is_active' => true
                    ]);
                    return ['status' => 'success', 'message' => "Discount '{$discount->name}' created successfully.", 'discount' => $discount];
                } catch (\Exception $e) {
                    return ['status' => 'error', 'message' => $e->getMessage()];
                }

            case 'perform_return':
                try {
                    $order = Order::find($arguments['order_id']);
                    if (!$order || $order->status !== 'completed') {
                        return ['status' => 'error', 'message' => 'Order not found or not completed.'];
                    }
                    
                    DB::beginTransaction();
                    $return = ReturnOrder::create([
                        'order_id' => $arguments['order_id'],
                        'user_id' => $user ? $user->id : 1,
                        'items' => json_encode($arguments['items']),
                        'reason' => $arguments['reason'] ?? 'Chatbot return',
                        'refund_amount' => $arguments['refund_amount'],
                        'refund_method' => $arguments['refund_method'],
                    ]);

                    foreach ($arguments['items'] as $item) {
                        ReturnedItem::create([
                            'return_id' => $return->id,
                            'product_id' => $item['product_id'],
                            'quantity' => $item['quantity'],
                            'condition' => 'other',
                            'status' => 'pending',
                        ]);
                    }

                    if ($order->customer_id) {
                        $pointsEarningRate = (int) \App\Helpers\SettingsHelper::get('points_earning_rate', 10);
                        $pointsEarned = floor($order->total_amount / $pointsEarningRate);
                        if ($pointsEarned > 0) {
                            $order->customer()->decrement('points_balance', $pointsEarned);
                        }
                    }

                    DB::commit();
                    return ['status' => 'success', 'message' => 'Return processed successfully.', 'return_id' => $return->id];
                } catch (\Exception $e) {
                    DB::rollBack();
                    return ['status' => 'error', 'message' => 'Failed to process return: ' . $e->getMessage()];
                }

            case 'get_recent_transactions':
                $limit = $arguments['limit'] ?? 5;
                $orders = Order::with('customer')
                    ->orderBy('created_at', 'desc')
                    ->take($limit)
                    ->get(['id', 'order_number', 'total_amount', 'status', 'created_at', 'customer_id'])
                    ->map(function ($order) {
                        return [
                            'id' => $order->id,
                            'order_number' => $order->order_number,
                            'total_amount' => $order->total_amount,
                            'status' => $order->status,
                            'customer_name' => $order->customer ? $order->customer->name : 'Walk-in',
                            'date' => $order->created_at->toDateTimeString()
                        ];
                    });
                return ['status' => 'success', 'data' => $orders];

            case 'get_suppliers_count':
                $count = Supplier::count();
                return ['status' => 'success', 'data' => ['total_suppliers' => $count]];

            case 'create_open_box_deal':
                if (!$user || ($user->role !== 'admin' && $user->role !== 'manager')) {
                    return ['status' => 'error', 'message' => 'Permission denied. Only Admin and Manager can create open box deals.'];
                }
                try {
                    $returnedItem = ReturnedItem::find($arguments['returned_item_id']);
                    if (!$returnedItem) {
                        return ['status' => 'error', 'message' => 'Returned item not found.'];
                    }
                    $returnedItem->update([
                        'status' => 'open_box',
                        'open_box_price' => $arguments['open_box_price'],
                        'condition' => 'open_box',
                    ]);
                    return ['status' => 'success', 'message' => "Returned item marked as open box deal at Ksh {$arguments['open_box_price']}."];
                } catch (\Exception $e) {
                    return ['status' => 'error', 'message' => $e->getMessage()];
                }

            default:
                return ['status' => 'error', 'message' => 'Unknown tool requested.'];
        }
    }
}
