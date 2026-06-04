<?php
namespace App\Helpers;
use App\Models\Setting;

class SettingsHelper
{
    public static function get($key, $default = null)
    {
        $setting = Setting::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }
}
