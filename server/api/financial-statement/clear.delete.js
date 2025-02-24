import { createClient } from "@supabase/supabase-js";
import { createError } from "h3";

const ENV = useRuntimeConfig();

// Initialize Supabase client with service role key for server-side operations
const supabase = createClient(
  ENV.public.supabaseUrl,
  ENV.supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default defineEventHandler(async (event) => {
  try {
    // 1. First, get all files from storage (both statements and references)
    const { data: files, error: listError } = await supabase
      .storage
      .from('financial-statements')
      .list('', {
        limit: 1000, // Increased limit to handle more files
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('Storage List Error:', listError);
      throw createError({
        statusCode: 500,
        message: `Failed to list files: ${listError.message}`,
      });
    }

    // Also list files in references folder
    const { data: referenceFiles, error: refListError } = await supabase
      .storage
      .from('financial-statements')
      .list('references', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (refListError) {
      console.error('Reference Storage List Error:', refListError);
      throw createError({
        statusCode: 500,
        message: `Failed to list reference files: ${refListError.message}`,
      });
    }

    // 2. Delete all files from storage if any exist
    const allFiles = [
      ...(files?.map(file => file.name) || []),
      ...(referenceFiles?.map(file => `references/${file.name}`) || [])
    ];

    if (allFiles.length > 0) {
      const { error: deleteError } = await supabase
        .storage
        .from('financial-statements')
        .remove(allFiles);

      if (deleteError) {
        console.error('Storage Delete Error:', deleteError);
        // Log error but continue with database cleanup
        console.warn('Failed to delete some files from storage, continuing with database cleanup');
      }
    }

    // 3. Delete all entries from financial_entries table
    const { error: entriesError } = await supabase
      .from('financial_entries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (entriesError) {
      console.error('Entries Delete Error:', entriesError);
      throw createError({
        statusCode: 500,
        message: `Failed to delete entries: ${entriesError.message}`,
      });
    }

    // 4. Delete all records from reference_files table
    const { error: refError } = await supabase
      .from('reference_files')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (refError) {
      console.error('Reference Files Delete Error:', refError);
      throw createError({
        statusCode: 500,
        message: `Failed to delete reference files: ${refError.message}`,
      });
    }

    // 5. Delete all records from financial_statements table
    const { error: statementsError } = await supabase
      .from('financial_statements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (statementsError) {
      console.error('Statements Delete Error:', statementsError);
      throw createError({
        statusCode: 500,
        message: `Failed to delete statements: ${statementsError.message}`,
      });
    }

    // Return success response
    return {
      status: "success",
      message: "All data cleared successfully",
      details: {
        statement_files_deleted: files?.length || 0,
        reference_files_deleted: referenceFiles?.length || 0,
        total_files_deleted: allFiles.length
      }
    };

  } catch (error) {
    console.error('Clear Data Error:', error);
    
    return {
      status: "error",
      message: error.message || "An error occurred while clearing data",
    };
  }
}); 