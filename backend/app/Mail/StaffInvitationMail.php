<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StaffInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $tenantName;
    public $userName;
    public $role;
    public $email;
    public $password;

    /**
     * Create a new message instance.
     */
    public function __construct($tenantName, $userName, $role, $email, $password)
    {
        $this->tenantName = $tenantName;
        $this->userName = $userName;
        $this->role = ucfirst($role);
        $this->email = $email;
        $this->password = $password;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "You've been invited to join {$this->tenantName} as {$this->role}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $appUrl = env('APP_URL', 'https://pos-supermarket-1.onrender.com');
        $loginUrl = rtrim($appUrl, '/') . '/login';

        $html = "
        <div style=\"font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 16px;\">
            <div style=\"background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;\">
                <div style=\"text-align: center; margin-bottom: 24px;\">
                    <h1 style=\"color: #ea580c; margin: 0; font-size: 26px; font-weight: 800;\">Supermarket POS</h1>
                    <p style=\"color: #64748b; font-size: 14px; margin-top: 4px;\">Staff Account Invitation</p>
                </div>
                <hr style=\"border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;\" />
                <p style=\"color: #334155; font-size: 16px; line-height: 1.6;\">Hi <strong>{$this->userName}</strong>,</p>
                <p style=\"color: #334155; font-size: 15px; line-height: 1.6;\">You have been added as a <strong>{$this->role}</strong> for <strong>{$this->tenantName}</strong> on Supermarket POS.</p>
                
                <div style=\"background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 10px; padding: 20px; margin: 24px 0;\">
                    <h3 style=\"color: #c2410c; margin-top: 0; margin-bottom: 12px; font-size: 16px;\">Your Account Details:</h3>
                    <p style=\"margin: 6px 0; color: #431407; font-size: 14px;\"><strong>Role:</strong> {$this->role}</p>
                    <p style=\"margin: 6px 0; color: #431407; font-size: 14px;\"><strong>Email:</strong> {$this->email}</p>
                    <p style=\"margin: 6px 0; color: #431407; font-size: 14px;\"><strong>Temporary Password:</strong> <span style=\"font-family: monospace; background: #ffedd5; padding: 2px 8px; border-radius: 4px; font-weight: bold;\">{$this->password}</span></p>
                </div>

                <div style=\"text-align: center; margin: 32px 0;\">
                    <a href=\"{$loginUrl}\" style=\"background-color: #ea580c; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block;\">Log In to Account</a>
                </div>

                <p style=\"color: #64748b; font-size: 13px; line-height: 1.5;\">For security reasons, please log in and change your password in your profile after your first sign in.</p>
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
