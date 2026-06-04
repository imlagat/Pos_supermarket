<?php
namespace App\Listeners;
use App\Models\AuditLog;
use Illuminate\Auth\Events\Logout;
use Illuminate\Http\Request;

class LogSuccessfulLogout
{
    protected $request;
    public function __construct(Request $request)
    {
        $this->request = $request;
    }
    public function handle(Logout $event)
    {
        AuditLog::create([
            'user_id' => $event->user->id,
            'action' => 'logout',
            'model_type' => 'User',
            'model_id' => $event->user->id,
            'ip_address' => $this->request->ip(),
        ]);
    }
}
