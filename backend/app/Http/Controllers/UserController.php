<?php
namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

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

        $validated = $request->validate($rules);

        // Verify current password if updating password
        if ($request->has('password') && !empty($request->password)) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json(['message' => 'Current password is incorrect'], 422);
            }
            $validated['password'] = Hash::make($request->password);
        }

        $user->update($validated);
        return response()->json(['user' => $user, 'message' => 'Profile updated']);
    }
}
