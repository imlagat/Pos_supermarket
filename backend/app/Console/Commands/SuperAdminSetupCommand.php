<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\SuperAdminSetupMail;

class SuperAdminSetupCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'superadmin:setup {--email=superposlish@gmail.com} {--password=SuperAdmin2026!}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Initializes or resets the primary Super Admin account and dispatches a confirmation email code';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = strtolower(trim($this->option('email')));
        $password = $this->option('password');

        $this->info("Initializing Super Admin account for {$email}...");

        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = User::create([
                'name' => 'Super Admin',
                'email' => $email,
                'password' => Hash::make($password),
                'role' => 'super_admin',
            ]);
            $this->info("Created new Super Admin user account.");
        } else {
            $user->role = 'super_admin';
            $user->password = Hash::make($password);
            $user->save();
            $this->info("Updated existing user to Super Admin role and reset password.");
        }

        $confirmationCode = sprintf("%06d", mt_rand(100000, 999999));

        try {
            Mail::to($email)->send(new SuperAdminSetupMail($user->name, $email, $password, $confirmationCode));
            $this->info("Sent confirmation code email to {$email} (Code: {$confirmationCode}).");
        } catch (\Exception $e) {
            $this->error("Failed to send setup email: " . $e->getMessage());
        }

        $this->info("=========================================");
        $this->info("Super Admin Setup Complete!");
        $this->info("Portal URL: /superadmin");
        $this->info("Email: {$email}");
        $this->info("Password: {$password}");
        $this->info("Confirmation Code: {$confirmationCode}");
        $this->info("=========================================");

        return 0;
    }
}
