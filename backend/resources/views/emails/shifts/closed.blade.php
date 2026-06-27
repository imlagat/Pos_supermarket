<!DOCTYPE html>
<html>
<head>
    <title>Shift Closed</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #111; line-height: 1.5; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 20px; font-weight: bold; color: #111; letter-spacing: -0.5px; display: flex; align-items: center; justify-content: center; }
        .logo-icon { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: #111; color: #fff; border-radius: 6px; font-size: 16px; margin-right: 10px; font-weight: bold; }
        .icon { width: 32px; height: 32px; margin-bottom: 15px; }
        .title { font-size: 22px; font-weight: 700; margin-bottom: 10px; }
        .greeting { font-size: 15px; color: #444; margin-bottom: 25px; }
        .card { background-color: #fcfcfc; border: 1px solid #f0f0f0; border-radius: 10px; padding: 18px; margin-bottom: 20px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; align-items: center; }
        .row.divider-top { margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee; }
        .row:last-child { margin-bottom: 0; }
        .label { color: #555; }
        .value { font-weight: 600; color: #111; }
        .value.green { color: #10B981; }
        .value.red { color: #EF4444; }
        .section-title { margin-bottom: 12px; font-size: 15px; font-weight: 700; display: flex; align-items: center; }
        .section-title span.emoji { margin-right: 8px; }
        .variance-card { border-radius: 8px; padding: 12px 18px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 600; }
        .variance-card.balanced { background-color: #F0FDF4; border: 1px solid #DCFCE7; color: #166534; }
        .variance-card.short { background-color: #FEF2F2; border: 1px solid #FEE2E2; color: #991B1B; }
        .variance-card.over { background-color: #EFF6FF; border: 1px solid #DBEAFE; color: #1E40AF; }
        .variance-card .icon-label { display: flex; align-items: center; }
        .variance-card .icon-label svg { margin-right: 8px; width: 16px; height: 16px; }
        .variance-value { font-weight: bold; }
        .footer-message { text-align: center; color: #10B981; font-size: 13px; font-weight: 500; margin-top: 10px; margin-bottom: 40px; }
        .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 20px; }
        .footer a { color: #60a5fa; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo"><span class="logo-icon">ll</span> LipanaPOS</div>
        </div>
        
        <div>
            <div style="font-size: 24px; margin-bottom: 10px;">📊</div>
            <div class="title">Shift closed</div>
            <p class="greeting">Hi {{ $shift->user->name ?? 'User' }}, here's the breakdown from your shift at <strong>{{ $shift->branch->name ?? 'Branch' }}</strong>.</p>
        </div>
        
        <div class="card">
            <div class="row">
                <span class="label">Opened</span>
                <span class="value">{{ \Carbon\Carbon::parse($shift->opening_time)->format('d/m/Y, H:i:s') }}</span>
            </div>
            <div class="row">
                <span class="label">Closed</span>
                <span class="value">{{ \Carbon\Carbon::parse($shift->closing_time)->format('d/m/Y, H:i:s') }}</span>
            </div>
        </div>

        <!-- Cash Drawer -->
        <div class="section-title"><span class="emoji">💵</span> Cash Drawer</div>
        <div class="card">
            <div class="row">
                <span class="label">Opening Cash</span>
                <span class="value">Ksh {{ number_format($shift->opening_balance, 2) }}</span>
            </div>
            <div class="row">
                <span class="label">+ Cash Sales</span>
                <span class="value green">Ksh {{ number_format($data['cashSales'], 2) }}</span>
            </div>
            @if(isset($data['deposits']) && $data['deposits'] > 0)
            <div class="row">
                <span class="label">- Deposits</span>
                <span class="value red">Ksh {{ number_format($data['deposits'], 2) }}</span>
            </div>
            @endif
            <div class="row divider-top">
                <span class="label">Expected Cash</span>
                <span class="value">Ksh {{ number_format($shift->expected_cash, 2) }}</span>
            </div>
            <div class="row divider-top">
                <span class="label">Actual Cash Counted</span>
                <span class="value">Ksh {{ number_format($shift->actual_cash, 2) }}</span>
            </div>
        </div>

        @php
            $cashVariance = $shift->variance;
            $cashVarianceAbs = abs($cashVariance);
            $cashVarianceClass = $cashVariance == 0 ? 'balanced' : ($cashVariance < 0 ? 'short' : 'over');
            $cashVarianceText = $cashVariance == 0 ? '(Balanced)' : ($cashVariance < 0 ? '(Short)' : '(Over)');
        @endphp
        <div class="variance-card {{ $cashVarianceClass }}">
            <div class="icon-label">
                @if($cashVariance == 0)
                <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                @else
                <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                @endif
                Cash Variance
            </div>
            <div class="variance-value">Ksh {{ number_format($cashVarianceAbs, 2) }} {{ $cashVarianceText }}</div>
        </div>


        <!-- M-Pesa Float -->
        <div class="section-title"><span class="emoji">📱</span> M-Pesa Float</div>
        <div class="card">
            <div class="row">
                <span class="label">Opening M-Pesa</span>
                <span class="value">Ksh {{ number_format($shift->opening_mpesa_balance, 2) }}</span>
            </div>
            <div class="row">
                <span class="label">+ M-Pesa Sales</span>
                <span class="value green">Ksh {{ number_format($data['mpesaSales'], 2) }}</span>
            </div>
            <div class="row divider-top">
                <span class="label">Expected M-Pesa</span>
                <span class="value">Ksh {{ number_format($shift->expected_mpesa, 2) }}</span>
            </div>
            <div class="row divider-top">
                <span class="label">Closing M-Pesa Balance</span>
                <span class="value">Ksh {{ number_format($shift->actual_mpesa, 2) }}</span>
            </div>
        </div>

        @php
            $mpesaVariance = $shift->actual_mpesa - $shift->expected_mpesa;
            $mpesaVarianceAbs = abs($mpesaVariance);
            $mpesaVarianceClass = $mpesaVariance == 0 ? 'balanced' : ($mpesaVariance < 0 ? 'short' : 'over');
            $mpesaVarianceText = $mpesaVariance == 0 ? '(Balanced)' : ($mpesaVariance < 0 ? '(Short)' : '(Over)');
        @endphp
        <div class="variance-card {{ $mpesaVarianceClass }}">
            <div class="icon-label">
                @if($mpesaVariance == 0)
                <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                @else
                <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                @endif
                M-Pesa Variance
            </div>
            <div class="variance-value">Ksh {{ number_format($mpesaVarianceAbs, 2) }} {{ $mpesaVarianceText }}</div>
        </div>


        <!-- Other Payments -->
        <div class="section-title">Other Payments Collected</div>
        <div class="card">
            <div class="row">
                <span class="label">Card</span>
                <span class="value">Ksh {{ number_format($data['cardSales'], 2) }}</span>
            </div>
        </div>

        <div class="card">
            <div class="row">
                <span class="label">Total Sales This Shift</span>
                <span class="value">Ksh {{ number_format($data['cashSales'] + $data['mpesaSales'] + $data['cardSales'], 2) }}</span>
            </div>
        </div>

        @if($cashVariance == 0 && $mpesaVariance == 0)
        <div class="footer-message">
            Perfect balance on both cash and M-Pesa — great work! 🎯
        </div>
        @endif

        <div class="footer">
            &copy; {{ date('Y') }} LipanaPOS &middot; Built for African businesses<br>
            <a href="#">pos.lipana.app</a>
        </div>
    </div>
</body>
</html>
