<!DOCTYPE html>
<html>
<head>
    <title>Shift Opened</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #eaeaea; }
        .header { text-align: center; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #111; letter-spacing: -0.5px; }
        .logo-icon { display: inline-block; width: 24px; height: 24px; background: #111; color: #fff; border-radius: 4px; line-height: 24px; font-size: 14px; margin-right: 8px; vertical-align: middle; }
        .title { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
        .greeting { font-size: 15px; color: #555; margin-bottom: 20px; }
        .card { background-color: #fafafa; border: 1px solid #f0f0f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
        .row:last-child { margin-bottom: 0; }
        .label { color: #666; }
        .value { font-weight: bold; color: #111; }
        .footer { text-align: center; font-size: 12px; color: #aaa; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo"><span class="logo-icon">P</span> POS Super</div>
        </div>
        
        <div class="title">Shift opened</div>
        <p class="greeting">Hello Admin, Cashier <strong>{{ $shift->user->name ?? 'User' }}</strong> has just opened their shift. Here's the opening breakdown for their shift at <strong>{{ $shift->branch->name ?? 'Branch' }}</strong>.</p>
        
        <div class="card">
            <div class="row">
                <span class="label">Opened</span>
                <span class="value">{{ \Carbon\Carbon::parse($shift->opening_time)->format('d/m/Y, H:i:s') }}</span>
            </div>
        </div>

        <h4 style="margin-bottom: 10px; font-size: 14px; color: #111;">💵 Cash Drawer</h4>
        <div class="card">
            <div class="row">
                <span class="label">Opening Cash</span>
                <span class="value">Ksh {{ number_format($shift->opening_balance, 2) }}</span>
            </div>
        </div>

        <h4 style="margin-bottom: 10px; font-size: 14px; color: #111;">📱 M-Pesa Float</h4>
        <div class="card">
            <div class="row">
                <span class="label">Opening M-Pesa</span>
                <span class="value">Ksh {{ number_format($shift->opening_mpesa_balance, 2) }}</span>
            </div>
        </div>

        <div class="footer">
            &copy; {{ date('Y') }} POS Super &middot; Built for African businesses<br>
            <a href="#" style="color: #4A90E2; text-decoration: none;">pos.super</a>
        </div>
    </div>
</body>
</html>
