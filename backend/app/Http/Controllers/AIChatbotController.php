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
        $this->apiKey = env('ANTHROPIC_API_KEY');
    }

    public function chat(Request $request)
    {
        $messages = $request->input('messages', []);
        $user = Auth::user();
        
        if (empty($this->apiKey)) {
            return $this->localFallbackChat($messages, $user);
        }

        // Add a system prompt with context and roles
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

        $tools = [
            [
                'name' => 'lookup_product',
                'description' => 'Look up a product in the inventory by name or SKU to check its price and stock level.',
                'input_schema' => [
                    'type' => 'object',
                    'properties' => [
                        'query' => [
                            'type' => 'string',
                            'description' => 'The name or SKU of the product to search for.'
                        ]
                    ],
                    'required' => ['query']
                ]
            ],
            [
                'name' => 'get_low_stock',
                'description' => 'Get a list of products that are currently low on stock.',
                'input_schema' => [
                    'type' => 'object',
                    'properties' => new \stdClass()
                ]
            ],
            [
                'name' => 'get_sales_report',
                'description' => 'Get a summary of total sales, refunds, and order counts. Only Admin and Manager roles are allowed.',
                'input_schema' => [
                    'type' => 'object',
                    'properties' => [
                        'period' => [
                            'type' => 'string',
                            'description' => 'The time period for the sales report. Allowed values: daily, weekly, monthly, all_time.'
                        ]
                    ],
                    'required' => ['period']
                ]
            ],
            [
                'name' => 'create_discount',
                'description' => 'Create a discount rule for a specific product. Only Admin and Manager roles are allowed.',
                'input_schema' => [
                    'type' => 'object',
                    'properties' => [
                        'name' => ['type' => 'string', 'description' => 'Name of the discount (e.g. Summer Sale)'],
                        'discount_type' => ['type' => 'string', 'description' => 'Type of discount: percentage or fixed'],
                        'value' => ['type' => 'number', 'description' => 'Discount amount or percentage'],
                        'product_id' => ['type' => 'integer', 'description' => 'ID of the product to apply discount to'],
                        'starts_at' => ['type' => 'string', 'description' => 'Start date (YYYY-MM-DD)'],
                        'ends_at' => ['type' => 'string', 'description' => 'End date (YYYY-MM-DD)']
                    ],
                    'required' => ['name', 'discount_type', 'value', 'product_id']
                ]
            ],
            [
                'name' => 'perform_return',
                'description' => 'Process a return for a specific order. Ensure you have the order ID and items list.',
                'input_schema' => [
                    'type' => 'object',
                    'properties' => [
                        'order_id' => ['type' => 'integer', 'description' => 'The ID of the order being returned'],
                        'items' => [
                            'type' => 'array',
                            'description' => 'List of items to return',
                            'items' => [
                                'type' => 'object',
                                'properties' => [
                                    'product_id' => ['type' => 'integer'],
                                    'quantity' => ['type' => 'integer']
                                ],
                                'required' => ['product_id', 'quantity']
                            ]
                        ],
                        'reason' => ['type' => 'string', 'description' => 'Reason for return'],
                        'refund_amount' => ['type' => 'number', 'description' => 'Total amount to refund'],
                        'refund_method' => ['type' => 'string', 'description' => 'Method: cash, mpesa, card, credit_note']
                    ],
                    'required' => ['order_id', 'items', 'refund_amount', 'refund_method']
                ]
            ],
            [
                'name' => 'get_recent_transactions',
                'description' => 'Get a list of the most recent completed orders/transactions.',
                'input_schema' => [
                    'type' => 'object',
                    'properties' => [
                        'limit' => ['type' => 'integer', 'description' => 'Number of recent transactions to fetch (default 5)']
                    ]
                ]
            ],
            [
                'name' => 'get_suppliers_count',
                'description' => 'Get the total count of registered suppliers in the system.',
                'input_schema' => [
                    'type' => 'object',
                    'properties' => new \stdClass()
                ]
            ],
            [
                'name' => 'create_open_box_deal',
                'description' => 'Mark a returned item as an Open Box deal with a special price. Only Admin and Manager roles are allowed.',
                'input_schema' => [
                    'type' => 'object',
                    'properties' => [
                        'returned_item_id' => ['type' => 'integer', 'description' => 'The ID of the ReturnedItem record'],
                        'open_box_price' => ['type' => 'number', 'description' => 'The special discounted price for the open box item']
                    ],
                    'required' => ['returned_item_id', 'open_box_price']
                ]
            ]
        ];

        // Format user messages for Anthropic
        $anthropicMessages = [];
        foreach ($messages as $msg) {
            if ($msg['role'] !== 'system') {
                if (isset($msg['content']) && is_string($msg['content'])) {
                    $anthropicMessages[] = [
                        'role' => $msg['role'] === 'assistant' ? 'assistant' : 'user',
                        'content' => $msg['content']
                    ];
                }
            }
        }

        // Send to Anthropic
        $response = $this->callAnthropic($anthropicMessages, $systemPrompt, $tools);

        if ($response->successful()) {
            $data = $response->json();
            
            // Check for tool_use in response
            $toolUse = null;
            $assistantText = '';
            
            if (isset($data['content']) && is_array($data['content'])) {
                foreach ($data['content'] as $block) {
                    if ($block['type'] === 'tool_use') {
                        $toolUse = $block;
                    } elseif ($block['type'] === 'text') {
                        $assistantText .= $block['text'];
                    }
                }
            }

            if ($toolUse) {
                // Execute the local function
                $toolResult = $this->executeTool($toolUse['name'], $toolUse['input'], $user);
                
                // Pass exact previous assistant response back
                $anthropicMessages[] = [
                    'role' => 'assistant',
                    'content' => $data['content']
                ];
                
                // Pass tool result
                $anthropicMessages[] = [
                    'role' => 'user',
                    'content' => [
                        [
                            'type' => 'tool_result',
                            'tool_use_id' => $toolUse['id'],
                            'content' => json_encode($toolResult)
                        ]
                    ]
                ];

                $finalResponse = $this->callAnthropic($anthropicMessages, $systemPrompt, $tools);
                
                if ($finalResponse->successful()) {
                    $finalData = $finalResponse->json();
                    $finalText = '';
                    if (isset($finalData['content']) && is_array($finalData['content'])) {
                        foreach ($finalData['content'] as $block) {
                            if ($block['type'] === 'text') {
                                $finalText .= $block['text'];
                            }
                        }
                    }
                    return response()->json([
                        'message' => ['role' => 'assistant', 'content' => $finalText]
                    ]);
                }
                
                $errorResponse = $finalResponse->json();
                $errorMessage = $errorResponse['error']['message'] ?? 'Subsequent Anthropic API call failed';
                
                return response()->json(['error' => 'API Error: ' . $errorMessage, 'details' => $errorResponse], 500);
            }

            return response()->json(['message' => ['role' => 'assistant', 'content' => $assistantText]]);
        }
        
        $errorResponse = $response->json();
        $errorMessage = $errorResponse['error']['message'] ?? 'Failed to connect to Anthropic API';

        return response()->json(['error' => 'API Error: ' . $errorMessage, 'details' => $errorResponse], 500);
    }

    private function callAnthropic($messages, $systemPrompt, $tools)
    {
        return Http::withHeaders([
            'x-api-key' => $this->apiKey,
            'anthropic-version' => '2023-06-01',
            'content-type' => 'application/json',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model' => 'claude-3-5-sonnet-20241022',
            'max_tokens' => 1024,
            'system' => $systemPrompt,
            'messages' => $messages,
            'tools' => $tools
        ]);
    }

    private function localFallbackChat($messages, $user)
    {
        return response()->json([
            'message' => [
                'role' => 'assistant', 
                'content' => "*(Running in Offline Mode - Anthropic API Key missing)*\nPlease configure your ANTHROPIC_API_KEY."
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
                    ->get(['id', 'name', 'sku', 'base_price', 'stock_quantity', 'category']);
                
                if ($products->isEmpty()) {
                    return ['status' => 'not_found', 'message' => 'No products found matching the query.'];
                }
                return ['status' => 'success', 'data' => $products];

            case 'get_low_stock':
                $lowStock = Product::whereColumn('stock_quantity', '<=', 'min_stock_threshold')
                    ->take(20)
                    ->get(['id', 'name', 'sku', 'stock_quantity', 'min_stock_threshold']);
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
                        'type' => 'specific_products',
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
