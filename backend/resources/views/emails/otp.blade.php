<!DOCTYPE html>
<html>
<head>
    <title>Your Login OTP</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h2>Your One-Time Password</h2>
    <p>Please use the following OTP to complete your login process. This code will expire in 10 minutes.</p>
    
    <div style="margin: 20px 0; padding: 15px; background-color: #f4f4f4; border-radius: 5px; display: inline-block;">
        <h1 style="margin: 0; letter-spacing: 5px;">{{ $otpCode }}</h1>
    </div>
    
    <p>If you did not request this, please ignore this email.</p>
    <p>Thank you,<br>Supermart Team</p>
</body>
</html>
