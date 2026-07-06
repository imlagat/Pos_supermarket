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
        .tier-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: center; }
        .tier-name { font-size: 20px; font-weight: bold; color: #f97316; text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Your Subscription Plan Has Changed</h2>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>This is a notification that the subscription plan for your store, <strong>{{ $tenant->name }}</strong>, has been updated.</p>
            
            <div class="tier-box">
                <p style="margin: 0; color: #64748b; font-size: 14px;">Your new plan is:</p>
                <div class="tier-name">{{ $newTier }} Plan</div>
            </div>
            
            <p>Your account has been successfully transitioned from the {{ ucfirst($oldTier) }} plan to the {{ ucfirst($newTier) }} plan. All features and limits associated with your new plan are now active.</p>
            
            <div style="text-align: center;">
                <a href="{{ url('/billing') }}" class="btn">View Plan Details</a>
            </div>
            
            <p style="margin-top: 30px;">If you did not request this change or have any questions, please contact us immediately.</p>
            <p>Best regards,<br>The POSlish Team</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} POSlish. All rights reserved.
        </div>
    </div>
</body>
</html>
