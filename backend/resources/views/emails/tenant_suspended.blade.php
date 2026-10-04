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
            <h2>Account Suspended</h2>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>This is an automated notification regarding your POSlish account for your store, <strong>{{ $tenant->name }}</strong>.</p>
            <p>Your store account has been temporarily <strong>suspended</strong> by the system administrator. During this time, access to your POS, dashboard, and other services will be restricted.</p>
            
            <p>To resolve this issue and restore access to your account, please reach out to our support team.</p>
            
            <div style="text-align: center;">
                <a href="mailto:superposlish@gmail.com" class="btn">Talk to Support</a>
            </div>
            
            <p style="margin-top: 30px;">Once the issue is resolved, your account will be reactivated immediately. We appreciate your prompt attention to this matter.</p>
            <p>Best regards,<br>The POSlish Team</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} POSlish. All rights reserved.
        </div>
    </div>
</body>
</html>
