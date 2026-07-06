<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeTenantMail extends Mailable
{
    use Queueable, SerializesModels;

    public $tenantName;
    public $userName;
    public $otpCode;

    /**
     * Create a new message instance.
     */
    public function __construct($tenantName, $userName, $otpCode = null)
    {
        $this->tenantName = $tenantName;
        $this->userName = $userName;
        $this->otpCode = $otpCode;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to POSlish! Your store is ready.',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            htmlString: '<h1>Welcome to POSlish!</h1><p>Hi ' . $this->userName . ', your store <strong>' . $this->tenantName . '</strong> is set up. Enjoy your 7 days trial!</p>' . ($this->otpCode ? '<br><p>To complete your registration and log in, please enter this verification code: <strong style="font-size: 24px; letter-spacing: 2px;">' . $this->otpCode . '</strong></p>' : ''),
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
