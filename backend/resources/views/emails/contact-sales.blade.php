<!DOCTYPE html>
<html>
<head>
    <title>New Sales Inquiry</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2>New Sales Inquiry</h2>
    <p>A new inquiry has been submitted via the Talk to Sales form.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 200px;">Name</td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{ $data['name'] }}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Email</td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{ $data['email'] }}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Phone Number</td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{ $data['phone'] }}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Type of Business</td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{ $data['business_type'] }}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Number of Locations</td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{ $data['locations'] }}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Subject</td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{ $data['subject'] }}</td>
        </tr>
    </table>

    <h3 style="margin-top: 20px;">Message</h3>
    <div style="padding: 15px; background-color: #f9f9f9; border-left: 4px solid #0ea5e9; white-space: pre-wrap;">
{{ $data['message'] }}
    </div>
</body>
</html>
