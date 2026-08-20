<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membres', function (Blueprint $table) {
            $table->foreignId('coach_id')
                  ->nullable()
                  ->constrained('coachs')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('membres', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\Coach::class);
        });
    }
};