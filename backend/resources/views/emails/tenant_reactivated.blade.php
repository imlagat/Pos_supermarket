<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0f172a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; background-color: #0f172a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Welcome Back! Account Reactivated</h2>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>Great news! Your POSlish account for <strong>{{ $tenant->name }}</strong> has been fully reactivated.</p>
            <p>All restrictions have been lifted, and you now have full access to your POS, dashboard, and all system features once again.</p>
            
            <div style="text-align: center;">
                <a href="{{ url('/login') }}" class="btn">Log In to Your Store</a>
            </div>
            
            <p style="margin-top: 30px;">If you experience any issues or have questions, our support team is always ready to assist you.</p>
            <p>Best regards,<br>The POSlish Team</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} POSlish. All rights reserved.
        </div>
    </div>
</body>
</html>
