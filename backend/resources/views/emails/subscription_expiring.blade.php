<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; background-color: #dc2626; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Your Subscription is Expiring Soon</h2>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>This is an automated notification regarding your POSlish subscription for your store, <strong>{{ $tenant->name }}</strong>.</p>
            
            @if($daysLeft === 0)
                <p style="color: #dc2626; font-weight: bold; font-size: 18px;">Your subscription expires TODAY.</p>
            @else
                <p>Your active subscription will expire in <strong>{{ $daysLeft }} day(s)</strong>.</p>
            @endif
            
            <p>To avoid any disruption to your business operations, including POS access, staff logins, and inventory management, please renew your subscription as soon as possible.</p>
            
            <div style="text-align: center;">
                <a href="{{ url('/billing') }}" class="btn">Renew Subscription</a>
            </div>
            
            <p style="margin-top: 30px;">If you have already renewed, please ignore this email. Our support team is available if you need any assistance.</p>
            <p>Best regards,<br>The POSlish Team</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} POSlish. All rights reserved.
        </div>
    </div>
</body>
</html>
