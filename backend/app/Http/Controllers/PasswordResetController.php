<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use App\Models\User;

class PasswordResetController extends Controller
{
    public function sendResetLinkEmail(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        return $status === Password::RESET_LINK_SENT
            ? response()->json(['message' => __($status)])
            : response()->json(['message' => __($status)], 400);
    }

    public function reset(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => bcrypt($password)
                ])->save();
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => __($status)])
            : response()->json(['message' => __($status)], 400);
    }

    public function sendResetOtp(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'If this email exists in our system, an OTP code has been sent.'], 200);
        }

        $otpCode = (string) rand(100000, 999999);
        $user->otp_code = $otpCode;
        $user->otp_expires_at = now()->addMinutes(15);
        $user->save();

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\OtpMail($otpCode));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to send password reset OTP: ' . $e->getMessage());
        }

        \Illuminate\Support\Facades\Log::info("PASSWORD RESET OTP for [{$user->email}]: {$otpCode}");

        return response()->json([
            'requires_otp' => true,
            'message' => 'A 6-digit verification code has been sent to your email.'
        ]);
    }

    public function resetWithOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp_code' => 'required|string',
            'password' => 'required|string|min:6',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || $user->otp_code !== $request->otp_code) {
            return response()->json(['message' => 'Invalid or expired OTP code.'], 422);
        }

        if ($user->otp_expires_at && now()->greaterThan($user->otp_expires_at)) {
            return response()->json(['message' => 'OTP code has expired. Please request a new one.'], 422);
        }

        $user->password = \Illuminate\Support\Facades\Hash::make($request->password);
        $user->otp_code = null;
        $user->otp_expires_at = null;
        $user->save();

        return response()->json([
            'message' => 'Password reset successful. You can now log in with your new password.'
        ]);
    }
}
