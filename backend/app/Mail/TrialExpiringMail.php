<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\Tenant;

class TrialExpiringMail extends Mailable
{
    use Queueable, SerializesModels;

    public $tenant;
    public $daysLeft;

    /**
     * Create a new message instance.
     */
    public function __construct(Tenant $tenant, int $daysLeft)
    {
        $this->tenant = $tenant;
        $this->daysLeft = $daysLeft;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $dayString = $this->daysLeft === 1 ? '1 Day' : $this->daysLeft . ' Days';
        return new Envelope(
            subject: "Action Required: Your Free Trial Expires in {$dayString}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.trial_expiring',
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
