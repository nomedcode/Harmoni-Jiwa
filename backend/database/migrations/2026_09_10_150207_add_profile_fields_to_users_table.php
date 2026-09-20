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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'full_name')) $table->string('full_name', 100)->nullable();
            if (!Schema::hasColumn('users', 'gender')) $table->char('gender', 1)->nullable();
            if (!Schema::hasColumn('users', 'phone_number')) $table->string('phone_number', 13)->nullable();
            if (!Schema::hasColumn('users', 'supabase_uid')) $table->string('supabase_uid')->nullable()->unique();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'supabase_uid')) $table->dropUnique(['supabase_uid']);
            foreach (['full_name', 'gender', 'phone_number', 'supabase_uid'] as $column) {
                if (Schema::hasColumn('users', $column)) $table->dropColumn($column);
            }
        });
    }
};
