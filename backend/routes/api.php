<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DiscountRuleController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\MpesaController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\SearchController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/resend-otp', [AuthController::class, 'resendOtp']);
Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLinkEmail']);
Route::post('/reset-password', [PasswordResetController::class, 'reset']);
// M-Pesa callback — must be public (no auth) so Safaricom can reach it
Route::post('/mpesa/callback', [MpesaController::class, 'callback']);

Route::post('/remote-scan/session/{sessionId}', [App\Http\Controllers\RemoteScannerController::class, 'store']);
Route::get('/remote-scan/session/{sessionId}', [App\Http\Controllers\RemoteScannerController::class, 'check']);
Route::get('/system/local-ip', [App\Http\Controllers\RemoteScannerController::class, 'getLocalIp']);

// Marketing Contact Sales
Route::post('/contact-sales', [App\Http\Controllers\ContactController::class, 'submitSalesInquiry']);


Route::middleware('auth:sanctum')->group(function () {
    Route::get("/customers/export", [App\Http\Controllers\CustomerController::class, "export"]);
Route::middleware("auth:sanctum")->get("/transactions/export", [App\Http\Controllers\TransactionController::class, "export"]);
    Route::get("/customers/export", [App\Http\Controllers\CustomerController::class, "export"]);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/switch-account', [AuthController::class, 'switchAccount']);
    Route::post('/upgrade', [AuthController::class, 'upgradeMock']);

    Route::get('/products/lookup/{barcode}', [ProductController::class, 'lookup']);
    Route::apiResource('products', ProductController::class);

    Route::get('/search', [SearchController::class, 'globalSearch']);

    Route::post('/cart/calculate', [OrderController::class, 'calculateCart']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/transactions/export', [App\Http\Controllers\TransactionController::class, 'export']);

    Route::get('/transactions/held', [App\Http\Controllers\OrderController::class, 'getHeld']);
    Route::post('/transactions/held', [App\Http\Controllers\OrderController::class, 'hold']);
    Route::delete('/transactions/held/{id}', [App\Http\Controllers\OrderController::class, 'resume']);
    Route::post('/transactions/{id}/email', [App\Http\Controllers\OrderController::class, 'emailReceipt']);

    Route::get('/users/performance', [App\Http\Controllers\UserController::class, 'performance'])->middleware('role:admin,manager');
    Route::apiResource('users', App\Http\Controllers\UserController::class)->middleware('role:admin,manager');
    
    Route::get('/shifts/current', [\App\Http\Controllers\ShiftController::class, 'current']);
    Route::post('/shifts/open', [\App\Http\Controllers\ShiftController::class, 'open']);
    Route::post('/shifts/close', [\App\Http\Controllers\ShiftController::class, 'close']);
    Route::get('/shifts/drawer-status', [\App\Http\Controllers\ShiftController::class, 'drawerStatus']);
    Route::post('/shifts/deposit', [\App\Http\Controllers\ShiftController::class, 'deposit']);
    Route::get('/shifts', [\App\Http\Controllers\ShiftController::class, 'index'])->middleware('role:admin,manager');

    Route::apiResource('customers', CustomerController::class);
    Route::post('/customers/{customer}/redeem-points', [CustomerController::class, 'redeemPoints']);

    Route::get('/discount-rules/active', [App\Http\Controllers\DiscountRuleController::class, 'active']);
    Route::apiResource('discount-rules', DiscountRuleController::class)->middleware('role:admin,manager');
    Route::get('/reports/sales', [ReportController::class, 'sales'])->middleware('role:admin,manager');
    Route::get('/reports/low-stock', [ReportController::class, 'lowStock'])->middleware('role:admin,manager');
    Route::get('/reports/expiring-products', [ReportController::class, 'expiringProducts'])->middleware('role:admin,manager');
    Route::get('/finance/pnl', [\App\Http\Controllers\FinanceController::class, 'getPnL'])->middleware('role:admin,manager');

    Route::get('/inventory/alerts', [InventoryController::class, 'alerts']);
    Route::post('/mpesa/stkpush', [MpesaController::class, 'stkPush']);
    Route::get('/mpesa/status/{checkoutId}', [MpesaController::class, 'checkStatus']);

    Route::apiResource('branches', \App\Http\Controllers\BranchController::class)->middleware('role:admin');
    Route::get('/batches', [InventoryController::class, 'getBatches'])->middleware('role:admin,manager');
    Route::post('/batches', [InventoryController::class, 'addBatch'])->middleware('role:admin,manager');
    Route::put('/batches/{batch}', [InventoryController::class, 'updateBatch'])->middleware('role:admin,manager');
    
    // AI Chatbot
    Route::post('/chat', [App\Http\Controllers\AIChatbotController::class, 'chat']);

    // AI Automated Operations
    Route::post('/ai/auto-reorder', [App\Http\Controllers\AIOperationsController::class, 'autoReorder'])->middleware('role:admin,manager', 'checkTier:ai');
    Route::post('/ai/dynamic-pricing', [App\Http\Controllers\AIOperationsController::class, 'dynamicPricing'])->middleware('role:admin,manager', 'checkTier:ai');

    // Super Admin Routes
    Route::get('/super-admin/tenants', [App\Http\Controllers\SuperAdminController::class, 'getTenants']);
    Route::put('/super-admin/tenants/{id}/tier', [App\Http\Controllers\SuperAdminController::class, 'updateTier']);
    Route::put('/super-admin/tenants/{id}/status', [App\Http\Controllers\SuperAdminController::class, 'updateStatus']);
    Route::put('/super-admin/tenants/{id}', [App\Http\Controllers\SuperAdminController::class, 'updateTenant']);
    Route::delete('/super-admin/tenants/{id}', [App\Http\Controllers\SuperAdminController::class, 'deleteTenant']);
    Route::get('/super-admin/admins', [App\Http\Controllers\SuperAdminController::class, 'getAdmins']);
    Route::post('/super-admin/admins', [App\Http\Controllers\SuperAdminController::class, 'createAdmin']);
    Route::put('/super-admin/admins/{id}', [App\Http\Controllers\SuperAdminController::class, 'updateAdmin']);
    Route::delete('/super-admin/admins/{id}', [App\Http\Controllers\SuperAdminController::class, 'deleteAdmin']);
    Route::get('/super-admin/subscriptions', [App\Http\Controllers\SuperAdminController::class, 'getSubscriptionTransactions']);
    Route::put('/super-admin/subscriptions/{id}', [App\Http\Controllers\SuperAdminController::class, 'updateSubscriptionTransaction']);
});

Route::middleware('auth:sanctum')->get('/mpesa/status/{checkoutId}', [MpesaController::class, 'checkStatus']);

Route::middleware('auth:sanctum')->get('/transactions', [App\Http\Controllers\TransactionController::class, 'index']);
Route::middleware('auth:sanctum')->get('/transactions/{id}', [App\Http\Controllers\TransactionController::class, 'show']);

Route::middleware('auth:sanctum')->get('/reports/daily-sales', [App\Http\Controllers\ReportController::class, 'dailySales']);
Route::middleware('auth:sanctum')->get('/reports/weekly-sales', [App\Http\Controllers\ReportController::class, 'weeklySales']);
Route::middleware('auth:sanctum')->get('/reports/monthly-sales', [App\Http\Controllers\ReportController::class, 'monthlySales']);
Route::middleware('auth:sanctum')->get('/reports/top-products', [App\Http\Controllers\ReportController::class, 'topProducts']);
Route::middleware('auth:sanctum')->get('/reports/sales-by-category', [App\Http\Controllers\ReportController::class, 'salesByCategory']);
Route::middleware('auth:sanctum')->get('/reports/sales-by-payment-method', [App\Http\Controllers\ReportController::class, 'salesByPaymentMethod']);

Route::middleware('auth:sanctum')->get('/settings', [App\Http\Controllers\SettingsController::class, 'index']);
Route::middleware('auth:sanctum')->post('/settings', [App\Http\Controllers\SettingsController::class, 'update'])->middleware('role:admin');

Route::middleware('auth:sanctum')->get('/profile', [App\Http\Controllers\UserController::class, 'profile']);
Route::middleware('auth:sanctum')->put('/profile', [App\Http\Controllers\UserController::class, 'updateProfile']);
Route::middleware('auth:sanctum')->post('/returns', [App\Http\Controllers\ReturnController::class, 'store']);
Route::middleware('auth:sanctum')->get('/returns', [App\Http\Controllers\ReturnController::class, 'index']);
Route::middleware('auth:sanctum')->get('/audit-logs', [App\Http\Controllers\AuditLogController::class, 'index'])->middleware('role:admin');
    Route::get('/promotions/active', [App\Http\Controllers\DiscountRuleController::class, 'active']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('suppliers/{supplier}/purchase-orders', [App\Http\Controllers\SupplierController::class, 'purchaseOrders']);
    Route::apiResource('suppliers', App\Http\Controllers\SupplierController::class);
    Route::apiResource('purchase-orders', App\Http\Controllers\PurchaseOrderController::class);
    Route::post('/purchase-orders/{purchaseOrder}/receive', [App\Http\Controllers\PurchaseOrderController::class, 'receive']);
    Route::post('/purchase-orders/{purchaseOrder}/pay', [App\Http\Controllers\PurchaseOrderController::class, 'pay']);
    Route::post('/purchase-orders/{purchaseOrder}/approve', [App\Http\Controllers\PurchaseOrderController::class, 'approve'])->middleware('role:admin,manager');
});
Route::middleware('auth:sanctum')->post('/returns/search-order', [App\Http\Controllers\ReturnController::class, 'getOrder']);
Route::middleware('auth:sanctum')->post('/returns', [App\Http\Controllers\ReturnController::class, 'store']);
Route::middleware('auth:sanctum')->get('/returns', [App\Http\Controllers\ReturnController::class, 'index']);
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('returns', App\Http\Controllers\ReturnController::class)->only(['index', 'store']);
});
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/returns', [App\Http\Controllers\ReturnController::class, 'index']);
    Route::post('/returns', [App\Http\Controllers\ReturnController::class, 'store']);
});
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('returns', App\Http\Controllers\ReturnController::class)->only(['index', 'store']);
});
Route::middleware('auth:sanctum')->get('/purchase-orders/overdue', [App\Http\Controllers\PurchaseOrderController::class, 'overdue']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/returned-items', [App\Http\Controllers\ReturnedItemController::class, 'index'])->middleware('role:admin,manager');
    Route::post('/returned-items/{returnedItem}/open-box', [App\Http\Controllers\ReturnedItemController::class, 'markOpenBox'])->middleware('role:admin,manager');
    Route::post('/returned-items/{returnedItem}/dispose', [App\Http\Controllers\ReturnedItemController::class, 'dispose'])->middleware('role:admin,manager');
});
Route::middleware('auth:sanctum')->post('/products/import', [App\Http\Controllers\ProductImportController::class, 'import'])->middleware('role:admin,manager');
Route::middleware('auth:sanctum')->get('/open-box-items', [App\Http\Controllers\OpenBoxController::class, 'index']);
Route::middleware('auth:sanctum')->post('/returned-items/{returnedItem}/image', [App\Http\Controllers\ReturnedItemController::class, 'uploadImage'])->middleware('role:admin,manager');
Route::middleware('auth:sanctum')->get('/reports/returned-items', [App\Http\Controllers\ReportController::class, 'returnedItems']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/subscriptions/history', [App\Http\Controllers\SubscriptionController::class, 'history']);
    Route::post('/subscriptions/subscribe', [App\Http\Controllers\SubscriptionController::class, 'subscribe']);
    Route::post('/subscriptions/callback', [App\Http\Controllers\SubscriptionController::class, 'handleCallback']);
    Route::post('/onboarding/complete', [App\Http\Controllers\SettingsController::class, 'completeOnboarding']);
});
