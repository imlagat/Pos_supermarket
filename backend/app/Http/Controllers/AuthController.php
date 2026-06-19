<?php
namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;

use App\Models\Tenant;
use App\Models\Branch;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        if ($user->tenant && !$user->tenant->is_active && $user->role !== 'admin') {
            throw ValidationException::withMessages([
                'email' => ['Please contact your admin. Your store account is currently suspended.'],
            ]);
        }

        // Generate OTP
        $otpCode = (string) rand(100000, 999999);
        $user->otp_code = $otpCode;
        $user->otp_expires_at = now()->addMinutes(10);
        $user->save();

        // Send OTP email
        Mail::to($user->email)->queue(new OtpMail($otpCode));

        return response()->json([
            'requires_2fa' => true,
            'email' => $user->email,
            'message' => 'OTP sent to your email.'
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'tier' => 'nullable|string|in:bronze,silver,custom',
        ]);

        $tenantName = explode(' ', $request->name)[0] . "'s Store";
        $tier = $request->tier ?? 'bronze';

        $tenant = Tenant::create([
            'name' => $tenantName,
            'tier' => $tier,
            'is_active' => true,
            'trial_ends_at' => now()->addDays(3),
        ]);

        $branch = Branch::create([
            'tenant_id' => $tenant->id,
            'name' => 'Main Branch',
            'location' => 'Headquarters',
            'status' => 'active',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'admin',
            'pin' => '0000',
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\WelcomeTenantMail($tenant, $user));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to send welcome email: ' . $e->getMessage());
        }

        $token = $user->createToken('pos-token')->plainTextToken;

        return response()->json([
            'user' => $user->load('tenant'),
            'token' => $token,
            'message' => 'Registration successful.'
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp_code' => 'required|string'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            throw ValidationException::withMessages(['email' => ['User not found.']]);
        }

        if ($user->otp_code !== $request->otp_code) {
            throw ValidationException::withMessages(['otp_code' => ['Invalid OTP code.']]);
        }

        if (now()->greaterThan($user->otp_expires_at)) {
            throw ValidationException::withMessages(['otp_code' => ['OTP has expired.']]);
        }

        // OTP is valid, clear it
        $user->otp_code = null;
        $user->otp_expires_at = null;
        $user->save();

        // Issue token
        $token = $user->createToken('pos-token')->plainTextToken;

        return response()->json([
            'user' => $user->load('tenant'),
            'token' => $token
        ]);
    }

    public function resendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            throw ValidationException::withMessages(['email' => ['User not found.']]);
        }

        // Generate new OTP
        $otpCode = (string) rand(100000, 999999);
        $user->otp_code = $otpCode;
        $user->otp_expires_at = now()->addMinutes(10);
        $user->save();

        // Send OTP email
        Mail::to($user->email)->queue(new OtpMail($otpCode));

        return response()->json([
            'message' => 'A new OTP has been sent to your email.'
        ]);
    }

    public function user(Request $request)
    {
        return $request->user()->load('tenant');
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function switchAccount(Request $request)
    {
        $request->validate([
            'target_user_id' => 'required|exists:users,id',
            'pin' => 'required|string'
        ]);

        $adminUser = $request->user();

        if ($adminUser->role !== 'admin') {
            throw ValidationException::withMessages(['pin' => ['Only admins can switch accounts.']]);
        }

        if (!$adminUser->pin || $adminUser->pin !== $request->pin) {
            throw ValidationException::withMessages(['pin' => ['Invalid PIN.']]);
        }

        $targetUser = User::find($request->target_user_id);
        
        if ($targetUser->role === 'admin' && $targetUser->id !== $adminUser->id) {
             throw ValidationException::withMessages(['pin' => ['Cannot switch to another admin account.']]);
        }

        // Issue token for target user
        $token = $targetUser->createToken('pos-token')->plainTextToken;

        return response()->json([
            'user' => $targetUser->load('tenant'),
            'token' => $token
        ]);
    }

    public function upgradeMock(Request $request)
    {
        $user = $request->user();
        if ($user->tenant) {
            $user->tenant->update([
                'tier' => 'silver',
                'trial_ends_at' => null, // Trial is over, they upgraded
            ]);
        }

        return response()->json([
            'message' => 'Successfully upgraded to premium tier!',
            'user' => $user->load('tenant')
        ]);
    }
}
