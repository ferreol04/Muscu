<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $admins = [
            [
                'name'             => 'Super Admin',
                'email'            => 'admin@gympro.com',
                'password'         => Hash::make('Admin@2026'),
                'role'             => 'admin',
                'password_changed' => true,
            ],
            [
                'name'             => 'Réceptionniste',
                'email'            => 'reception@gympro.com',
                'password'         => Hash::make('Reception@2026'),
                'role'             => 'admin',
                'password_changed' => true,
            ],
        ];

        foreach ($admins as $admin) {
            User::updateOrCreate(
                ['email' => $admin['email']],
                $admin
            );
        }
    }
}
