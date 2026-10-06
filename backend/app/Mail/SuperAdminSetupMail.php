<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SuperAdminSetupMail extends Mailable
{
    use Queueable, SerializesModels;

    public $userName;
    public $email;
    public $password;
    public $confirmationCode;

    /**
     * Create a new message instance.
     */
    public function __construct($userName, $email, $password, $confirmationCode)
    {
        $this->userName = $userName;
        $this->email = $email;
        $this->password = $password;
        $this->confirmationCode = $confirmationCode;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Super Admin Account Confirmed — Access Code: {$this->confirmationCode}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $appUrl = env('APP_URL', 'https://pos-supermarket-1.onrender.com');
        $portalUrl = rtrim($appUrl, '/') . '/superadmin';

        $html = "
        <div style=\"font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 16px;\">
            <div style=\"background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;\">
                <div style=\"text-align: center; margin-bottom: 24px;\">
                    <h1 style=\"color: #ea580c; margin: 0; font-size: 26px; font-weight: 800;\">Supermarket POS</h1>
                    <p style=\"color: #dc2626; font-size: 14px; font-weight: 700; margin-top: 4px;\">👑 Super Admin Access & Control Portal</p>
                </div>
                <hr style=\"border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;\" />
                <p style=\"color: #334155; font-size: 16px; line-height: 1.6;\">Hi <strong>{$this->userName}</strong>,</p>
                <p style=\"color: #334155; font-size: 15px; line-height: 1.6;\">Your Super Admin master account has been initialized and confirmed successfully.</p>

                <div style=\"background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;\">
                    <p style=\"color: #991b1b; font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0;\">Your One-Time Confirmation Code</p>
                    <h2 style=\"color: #b91c1c; font-size: 36px; letter-spacing: 6px; margin: 10px 0; font-family: monospace;\">{$this->confirmationCode}</h2>
                    <p style=\"color: #7f1d1d; font-size: 13px; margin: 0;\">Email: <strong>{$this->email}</strong></p>
                </div>

                <div style=\"background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 10px; padding: 18px; margin: 24px 0;\">
                    <h4 style=\"color: #c2410c; margin: 0 0 8px 0; font-size: 15px;\">Master Super Admin Capabilities:</h4>
                    <ul style=\"margin: 0; padding-left: 20px; color: #431407; font-size: 14px; line-height: 1.7;\">
                        <li>View and manage all registered stores & tenant databases</li>
                        <li>Activate or suspend store accounts</li>
                        <li>Manage subscription plans & billing tiers</li>
                        <li>Reset store admin passwords & oversee system users</li>
                    </ul>
                </div>

                <div style=\"text-align: center; margin: 32px 0;\">
                    <a href=\"{$portalUrl}\" style=\"background-color: #ea580c; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block;\">Access Super Admin Portal</a>
                </div>

                <hr style=\"border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;\" />
                <p style=\"color: #94a3b8; font-size: 12px; text-align: center; margin: 0;\">Sent from Supermarket POS Main System (superposlish@gmail.com)</p>
            </div>
        </div>
        ";

        return new Content(
            htmlString: $html,
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
