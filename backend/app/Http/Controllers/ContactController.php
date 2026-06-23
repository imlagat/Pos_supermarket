<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\ContactSalesMail;
use Illuminate\Validation\ValidationException;

class ContactController extends Controller
{
    public function submitSalesInquiry(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'business_type' => 'required|string|max:100',
            'locations' => 'required|string|max:50',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:2000',
        ]);

        $adminEmail = env('MAIL_ADMIN_ADDRESS', env('MAIL_USERNAME', 'superposlish@gmail.com'));

        Mail::to($adminEmail)->send(new ContactSalesMail($validated));

        return response()->json([
            'success' => true,
            'message' => 'Your inquiry has been submitted successfully. Our sales team will contact you shortly.'
        ]);
    }
}
