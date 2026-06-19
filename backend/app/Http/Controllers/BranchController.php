<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Branch;

class BranchController extends Controller
{
    public function index()
    {
        return response()->json(Branch::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,inactive',
        ]);

        $user = $request->user();
        if ($user && $user->tenant && $user->tenant->tier === 'bronze') {
            $branchCount = Branch::where('tenant_id', $user->tenant_id)->count();
            if ($branchCount >= 1) {
                return response()->json(['message' => 'Bronze plan does not support multiple branches. Please upgrade to Silver or Custom to add more.'], 403);
            }
        }

        $branch = Branch::create($validated);
        return response()->json($branch, 201);
    }

    public function show(Branch $branch)
    {
        return response()->json($branch);
    }

    public function update(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'location' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,inactive',
        ]);

        $branch->update($validated);
        return response()->json($branch);
    }

    public function destroy(Branch $branch)
    {
        if ($branch->id === 1) {
            return response()->json(['error' => 'Cannot delete the Main Branch.'], 403);
        }
        $branch->delete();
        return response()->json(['message' => 'Branch deleted successfully.']);
    }
}
