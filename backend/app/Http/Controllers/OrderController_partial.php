    public function calculateCart(Request $request)
    {
        $items = $request->input('items', []);
        $customerId = $request->input('customer_id');
        $cart = new CartObject($items, $customerId);
        try {
            $cart = Pipeline::send($cart)->through([\App\Pipelines\ApplyAllPromotions::class])->thenReturn();
        } catch (\Exception $e) {
            Log::error('Pipeline error: ' . $e->getMessage());
        }
        \Log::info('Cart calculation result', [
            'subtotal' => $cart->subtotal,
            'total' => $cart->total,
            'discounts' => $cart->discounts
        ]);
        return response()->json([
            'subtotal' => (float) $cart->subtotal,
            'total' => (float) $cart->total,
            'discounts' => $cart->discounts,
        ]);
    }
