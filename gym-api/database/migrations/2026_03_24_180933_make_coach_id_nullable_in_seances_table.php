<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::table('seances', function (Blueprint $table) {
        $table->dropForeign(['coach_id']);
        $table->foreignId('coach_id')->nullable()->change();
        $table->foreign('coach_id')->references('id')->on('coachs')->onDelete('set null');
    });
}

public function down(): void
{
    Schema::table('seances', function (Blueprint $table) {
        $table->dropForeign(['coach_id']);
        $table->foreignId('coach_id')->nullable(false)->change();
        $table->foreign('coach_id')->references('id')->on('coachs')->onDelete('cascade');
    });
}
};
