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

class SubscriptionExpiringMail extends Mailable
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
        $dayString = $this->daysLeft === 0 ? 'Today' : ($this->daysLeft === 1 ? '1 Day' : $this->daysLeft . ' Days');
        $subject = $this->daysLeft === 0 
            ? "Urgent: Your Subscription Expires Today!" 
            : "Action Required: Your Subscription Expires in {$dayString}";
            
        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.subscription_expiring',
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
