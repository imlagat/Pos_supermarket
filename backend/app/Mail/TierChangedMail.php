<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TierChangedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $tenant;
    public $oldTier;
    public $newTier;

    /**
     * Create a new message instance.
     */
    public function __construct(\App\Models\Tenant $tenant, $oldTier, $newTier)
    {
        $this->tenant = $tenant;
        $this->oldTier = $oldTier;
        $this->newTier = $newTier;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your POSlish Plan Has Been Updated',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.tier_changed',
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
