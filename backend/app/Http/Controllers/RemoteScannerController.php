<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class RemoteScannerController extends Controller
{
    /**
     * Store a barcode scan from the mobile device.
     */
    public function store(Request $request, $sessionId)
    {
        $request->validate([
            'barcode' => 'required|string'
        ]);

        $barcode = $request->input('barcode');
        
        // Cache the barcode for this session for 5 minutes
        Cache::put("remote_scan_{$sessionId}", $barcode, now()->addMinutes(5));

        return response()->json(['success' => true, 'message' => 'Barcode received']);
    }

    /**
     * Check if a barcode was scanned for this session.
     * Called continuously by the POS.
     */
    public function check($sessionId)
    {
        $cacheKey = "remote_scan_{$sessionId}";
        
        if (Cache::has($cacheKey)) {
            $barcode = Cache::get($cacheKey);
            // Delete it immediately so it doesn't get processed twice
            Cache::forget($cacheKey);
            
            return response()->json([
                'scanned' => true,
                'barcode' => $barcode
            ]);
        }

        return response()->json([
            'scanned' => false
        ]);
    }

    /**
     * Get the local IP address of the server.
     */
    public function getLocalIp()
    {
        $ip = '127.0.0.1';
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $ip = gethostbyname(gethostname());
        } else {
            $command = "ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n 1";
            $ip = trim(shell_exec($command));
            if (!$ip) {
                $ip = gethostbyname(gethostname());
            }
        }

        return response()->json([
            'ip' => $ip
        ]);
    }
}
