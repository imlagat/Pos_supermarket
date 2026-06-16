<?php
namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use App\Models\Order;

class UserController extends Controller
{
    // Admin only – list all users
    public function index()
    {
        return User::all();
    }

    // Admin only – create user
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'required|in:admin,manager,cashier'
        ]);
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role
        ]);
        return response()->json($user, 201);
    }

    // Admin only – show single user
    public function show(User $user)
    {
        return $user;
    }

    // Admin only – update user
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:6|confirmed',
            'role' => 'sometimes|in:admin,manager,cashier'
        ]);
        if ($request->has('password')) {
            $request->merge(['password' => Hash::make($request->password)]);
        }
        $user->update($request->all());
        return $user;
    }

    // Admin only – delete user
    public function destroy(User $user)
    {
        $user->delete();
        return response()->noContent();
    }

    // Authenticated user – get own profile
    public function profile(Request $request)
    {
        return $request->user();
    }

    // Authenticated user – update own profile (name, email, password)
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $rules = [
            'name' => 'sometimes|string|max:255',
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
        ];

        // If password is being changed, require current password and confirmation
        if ($request->has('password') && !empty($request->password)) {
            $rules['current_password'] = 'required|string';
            $rules['password'] = 'required|string|min:6|confirmed';
        }

        if ($request->has('pin') && !empty($request->pin)) {
            $rules['pin'] = 'string|size:4';
        }

        $validated = $request->validate($rules);

        // Verify current password if updating password
        if ($request->has('password') && !empty($request->password)) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json(['message' => 'Current password is incorrect'], 422);
            }
            $validated['password'] = Hash::make($request->password);
        }

        if ($request->has('pin') && !empty($request->pin)) {
            $validated['pin'] = $request->pin;
        }

        $user->update($validated);
        return response()->json(['user' => $user, 'message' => 'Profile updated']);
    }

    // Admin/Manager only – get cashier performance
    public function performance(Request $request)
    {
        $query = Order::query()->where('status', 'completed');
        $returnsQuery = \App\Models\ReturnOrder::query();

        $period = $request->input('period', 'daily');
        if ($period === 'daily') {
            $query->whereDate('created_at', today());
            $returnsQuery->whereDate('created_at', today());
        } elseif ($period === 'weekly') {
            $query->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
            $returnsQuery->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
        } elseif ($period === 'monthly') {
            $query->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year);
            $returnsQuery->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year);
        } elseif ($period === 'custom') {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            if ($startDate && $endDate) {
                $query->whereBetween('created_at', [Carbon::parse($startDate)->startOfDay(), Carbon::parse($endDate)->endOfDay()]);
                $returnsQuery->whereBetween('created_at', [Carbon::parse($startDate)->startOfDay(), Carbon::parse($endDate)->endOfDay()]);
            }
        }

        $ordersByUser = $query->with('cashier')->get()->groupBy('user_id');
        $returnsByUser = $returnsQuery->get()->groupBy('user_id');

        $allUserIds = $ordersByUser->keys()->merge($returnsByUser->keys())->unique();

        $performance = $allUserIds->map(function ($userId) use ($ordersByUser, $returnsByUser) {
            $user = User::find($userId);
            if (!$user || $user->role !== 'cashier') return null;

            $orders = $ordersByUser->get($userId, collect());
            $returns = $returnsByUser->get($userId, collect());

            return [
                'user_id' => $userId,
                'name' => $user->name,
                'email' => $user->email,
                'orders_taken' => $orders->count(),
                'total_sales' => (float) $orders->sum('total_amount'),
                'returns_taken' => $returns->count(),
                'total_returns_amount' => (float) $returns->sum('refund_amount'),
            ];
        })
        ->filter(function ($data) {
            return $data !== null;
        })
        ->values();

        return response()->json($performance);
    }
}
