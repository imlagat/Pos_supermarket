<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\Shift;

class ShiftClosedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $shift;
    public $data;

    /**
     * Create a new message instance.
     */
    public function __construct(Shift $shift, array $data)
    {
        $this->shift = $shift;
        $this->data = $data;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Shift Closed - ' . ($this->shift->user->name ?? 'User') . ' at ' . ($this->shift->branch->name ?? 'Branch'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.shifts.closed',
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
