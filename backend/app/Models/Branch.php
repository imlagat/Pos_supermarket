<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use \App\Traits\Tenantable;

    protected $fillable = ['name', 'location', 'contact_number', 'status'];

    public function stocks()
    {
        return $this->hasMany(BranchStock::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
