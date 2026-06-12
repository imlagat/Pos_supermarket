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
        return response()->json([
            'ip' => gethostbyname(gethostname())
        ]);
    }
}
