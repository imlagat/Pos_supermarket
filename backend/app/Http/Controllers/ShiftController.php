<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
class ShiftController extends Controller
{
    public function current(Request $request)
    {
        $user = $request->user();
        
        $shift = \App\Models\Shift::where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        return response()->json(['shift' => $shift]);
    }

    public function open(Request $request)
    {
        $request->validate([
            'opening_balance' => 'required|numeric|min:0',
            'opening_mpesa_balance' => 'required|numeric|min:0',
            'branch_id' => 'required|exists:branches,id'
        ]);

        $user = $request->user();

        $activeShift = \App\Models\Shift::where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        if ($activeShift) {
            return response()->json(['message' => 'You already have an open shift'], 400);
        }

        $shift = \App\Models\Shift::create([
            'user_id' => $user->id,
            'branch_id' => $request->branch_id,
            'opening_balance' => $request->opening_balance,
            'opening_mpesa_balance' => $request->opening_mpesa_balance,
            'opening_time' => now(),
            'status' => 'open'
        ]);

        // Send email to tenant admins, managers, and super admins
        $this->notifyAdminsOfShift($shift, new \App\Mail\ShiftOpenedMail($shift));

        return response()->json(['shift' => $shift], 201);
    }

    public function close(Request $request)
    {
        $request->validate([
            'actual_cash' => 'required|numeric|min:0',
            'actual_mpesa' => 'required|numeric|min:0',
            'notes' => 'nullable|string'
        ]);

        $user = $request->user();

        $shift = \App\Models\Shift::where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        if (!$shift) {
            return response()->json(['message' => 'No open shift found'], 404);
        }

        // Calculate expected cash
        $cashSales = \App\Models\Payment::whereHas('order', function ($query) use ($shift) {
                $query->where('shift_id', $shift->id);
            })
            ->where('method', 'cash')
            ->sum('amount');
            
        $mpesaSales = \App\Models\Payment::whereHas('order', function ($query) use ($shift) {
                $query->where('shift_id', $shift->id);
            })
            ->where('method', 'mpesa')
            ->sum('amount');

        $cardSales = \App\Models\Payment::whereHas('order', function ($query) use ($shift) {
                $query->where('shift_id', $shift->id);
            })
            ->where('method', 'card')
            ->sum('amount');

        $deposits = $shift->drawerMovements()->where('type', 'deposit')->sum('amount');

        $expectedCash = $shift->opening_balance + $cashSales - $deposits;
        $variance = $request->actual_cash - $expectedCash;
        
        $expectedMpesa = $shift->opening_mpesa_balance + $mpesaSales;
        $expectedCard = $cardSales;

        $shift->update([
            'closing_time' => now(),
            'expected_cash' => $expectedCash,
            'expected_mpesa' => $expectedMpesa,
            'expected_card' => $expectedCard,
            'actual_cash' => $request->actual_cash,
            'actual_mpesa' => $request->actual_mpesa,
            'actual_card' => $request->actual_card,
            'variance' => $variance,
            'status' => 'closed',
            'notes' => $request->notes
        ]);

        $data = [
            'cashSales' => $cashSales,
            'mpesaSales' => $mpesaSales,
            'cardSales' => $cardSales,
            'deposits' => $deposits,
        ];
        $this->notifyAdminsOfShift($shift, new \App\Mail\ShiftClosedMail($shift, $data));

        return response()->json(['shift' => $shift]);
    }

    public function index(Request $request)
    {
        $query = \App\Models\Shift::with(['user', 'branch'])->orderBy('created_at', 'desc');

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }
        
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $shifts = $query->get();

        return response()->json($shifts);
    }

    public function drawerStatus(Request $request)
    {
        $user = $request->user();
        
        // 1. Try to find the user's personal open shift
        $shift = \App\Models\Shift::where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        // 2. If no personal shift, but user is admin/manager, aggregate all open shifts in their branch
        if (!$shift && in_array($user->role, ['admin', 'manager'])) {
            $shifts = \App\Models\Shift::where('status', 'open')
                ->when($request->header('X-Branch-ID'), function($q) use ($request) {
                    $q->where('branch_id', $request->header('X-Branch-ID'));
                })
                ->get();
                
            if ($shifts->isEmpty()) {
                return response()->json(['message' => 'No open shifts found'], 404);
            }

            $shiftIds = $shifts->pluck('id');
            
            $cashSales = \App\Models\Payment::whereHas('order', function ($query) use ($shiftIds) {
                $query->whereIn('shift_id', $shiftIds);
            })->where('method', 'cash')->sum('amount');

            $mpesaSales = \App\Models\Payment::whereHas('order', function ($query) use ($shiftIds) {
                $query->whereIn('shift_id', $shiftIds);
            })->where('method', 'mpesa')->sum('amount');

            $cardSales = \App\Models\Payment::whereHas('order', function ($query) use ($shiftIds) {
                $query->whereIn('shift_id', $shiftIds);
            })->where('method', 'card')->sum('amount');

            $deposits = \App\Models\DrawerMovement::whereIn('shift_id', $shiftIds)->where('type', 'deposit')->sum('amount');
            
            $openingCash = $shifts->sum('opening_balance');
            $openingMpesa = $shifts->sum('opening_mpesa_balance');
            
            $cashInDrawer = $openingCash + $cashSales - $deposits;
            $mpesaTotal = $openingMpesa + $mpesaSales;

            return response()->json([
                'opening_cash' => $openingCash,
                'cash_sales' => $cashSales,
                'deposits' => $deposits,
                'cash_in_drawer' => $cashInDrawer,
                'opening_mpesa' => $openingMpesa,
                'mpesa_sales' => $mpesaSales,
                'mpesa_total' => $mpesaTotal,
                'card_sales' => $cardSales,
                'card_total' => $cardSales,
                'movements' => \App\Models\DrawerMovement::whereIn('shift_id', $shiftIds)->with('shift.user')->orderBy('created_at', 'desc')->get(),
                'shift' => [
                    'opening_time' => $shifts->min('opening_time'),
                    'user' => ['name' => 'All Active Cashiers (' . $shifts->count() . ')']
                ]
            ]);
        }

        if (!$shift) {
            return response()->json(['message' => 'No open shift'], 404);
        }

        $cashSales = \App\Models\Payment::whereHas('order', function ($query) use ($shift) {
            $query->where('shift_id', $shift->id);
        })->where('method', 'cash')->sum('amount');

        $mpesaSales = \App\Models\Payment::whereHas('order', function ($query) use ($shift) {
            $query->where('shift_id', $shift->id);
        })->where('method', 'mpesa')->sum('amount');

        $cardSales = \App\Models\Payment::whereHas('order', function ($query) use ($shift) {
            $query->where('shift_id', $shift->id);
        })->where('method', 'card')->sum('amount');

        $deposits = $shift->drawerMovements()->where('type', 'deposit')->sum('amount');
        
        $cashInDrawer = $shift->opening_balance + $cashSales - $deposits;
        $mpesaTotal = $shift->opening_mpesa_balance + $mpesaSales;

        return response()->json([
            'opening_cash' => $shift->opening_balance,
            'cash_sales' => $cashSales,
            'deposits' => $deposits,
            'cash_in_drawer' => $cashInDrawer,
            'opening_mpesa' => $shift->opening_mpesa_balance,
            'mpesa_sales' => $mpesaSales,
            'mpesa_total' => $mpesaTotal,
            'card_sales' => $cardSales,
            'card_total' => $cardSales,
            'movements' => $shift->drawerMovements()->orderBy('created_at', 'desc')->get(),
            'shift' => $shift
        ]);
    }

    public function deposit(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string'
        ]);

        $user = $request->user();
        $shift = \App\Models\Shift::where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        if (!$shift) {
            return response()->json(['message' => 'No open shift'], 404);
        }

        $movement = $shift->drawerMovements()->create([
            'type' => 'deposit',
            'amount' => $request->amount,
            'method' => 'cash',
            'notes' => $request->notes
        ]);

        return response()->json(['message' => 'Deposit recorded', 'movement' => $movement]);
    }

    private function notifyAdminsOfShift($shift, $mailable)
    {
        dispatch(function () use ($shift, $mailable) {
            try {
                $shift->load(['user', 'branch']);
                $tenantId = $shift->user->tenant_id ?? $shift->branch->tenant_id ?? (auth()->check() ? auth()->user()->tenant_id : null);
                
                if (!$tenantId) {
                    \Illuminate\Support\Facades\Log::warning("No tenant_id found for shift notification. Shift ID: {$shift->id}");
                    return;
                }

                // Get all registered admin and manager emails for this specific tenant
                $tenantAdmins = \App\Models\User::withoutGlobalScopes()
                    ->where('tenant_id', $tenantId)
                    ->whereIn('role', ['admin', 'manager'])
                    ->whereNotNull('email')
                    ->pluck('email');

                // Fallback: If no admin/manager role found, get any registered user email for this tenant
                if ($tenantAdmins->isEmpty()) {
                    $tenantAdmins = \App\Models\User::withoutGlobalScopes()
                        ->where('tenant_id', $tenantId)
                        ->whereNotNull('email')
                        ->pluck('email');
                }

                $recipientList = $tenantAdmins->filter()->map(function($e) {
                    return strtolower(trim($e));
                })->unique()->values()->all();

                if (empty($recipientList)) {
                    \Illuminate\Support\Facades\Log::warning("No tenant admin emails found for Tenant ID {$tenantId}. Shift ID: {$shift->id}");
                    return;
                }

                \Illuminate\Support\Facades\Log::info("Sending shift notification (Shift ID: {$shift->id}) to Tenant ID {$tenantId} admins: " . implode(', ', $recipientList));

                foreach ($recipientList as $email) {
                    Mail::to($email)->send($mailable);
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to send shift notification email: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            }
        })->afterResponse();
    }
}
