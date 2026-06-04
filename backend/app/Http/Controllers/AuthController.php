<?php
namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;

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

        // Generate OTP
        $otpCode = (string) rand(100000, 999999);
        $user->otp_code = $otpCode;
        $user->otp_expires_at = now()->addMinutes(10);
        $user->save();

        // Send OTP email
        Mail::to($user->email)->send(new OtpMail($otpCode));

        return response()->json([
            'requires_2fa' => true,
            'email' => $user->email,
            'message' => 'OTP sent to your email.'
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
            'user' => $user,
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
        Mail::to($user->email)->send(new OtpMail($otpCode));

        return response()->json([
            'message' => 'A new OTP has been sent to your email.'
        ]);
    }

    public function user(Request $request)
    {
        return $request->user();
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }
}
