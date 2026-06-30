<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f97316; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; background-color: #f97316; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Your Free Trial is Expiring Soon</h2>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>We hope you are enjoying your experience with POSlish for your store, <strong>{{ $tenant->name }}</strong>.</p>
            <p>This is a quick reminder that your 7-day free trial will expire in <strong>{{ $daysLeft }} day(s)</strong>.</p>
            <p>To ensure uninterrupted access to your POS, inventory management, and reports, please upgrade your account before the trial period ends.</p>
            
            <div style="text-align: center;">
                <a href="{{ url('/billing') }}" class="btn">Upgrade Now</a>
            </div>
            
            <p style="margin-top: 30px;">If you have any questions or need assistance choosing a plan, our support team is here to help.</p>
            <p>Best regards,<br>The POSlish Team</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} POSlish. All rights reserved.
        </div>
    </div>
</body>
</html>
