# Database Migrations

This directory contains database migration scripts for the Habify habit tracker application.

## How to Run Migrations

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the migration SQL
4. Run the migration

### Option 2: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db reset
# or
supabase db push
```

### Option 3: Direct SQL Execution
1. Connect to your Supabase database
2. Execute the migration SQL directly

## Migration Files

### 001_add_journal_images.sql (Recommended)
- **Complex version** with proper existence checks
- Adds `image_url` and `image_alt` columns to `journal_entries` table
- Creates `journal-images` storage bucket
- Sets up storage policies for image uploads
- **Safe to run multiple times** - checks if things already exist

### 001_add_journal_images_simple.sql (Fallback)
- **Simple version** using `IF NOT EXISTS` and `ON CONFLICT`
- Use this if the complex version has issues
- May require manual policy creation in some cases

## Important Notes

- Always backup your database before running migrations
- Test migrations on a development environment first
- Migrations are idempotent (safe to run multiple times)
- The `IF NOT EXISTS` clauses prevent errors if columns already exist

## Storage Setup

After running the migration, you may need to:
1. Verify the `journal-images` bucket was created
2. Check that storage policies are working correctly
3. Test image upload functionality in the application
