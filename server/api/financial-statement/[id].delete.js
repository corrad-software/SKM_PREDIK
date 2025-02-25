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
    const statement_id = event.context.params.id;

    // 1. First, get the financial statement and reference files to get file paths
    const { data: statement, error: statementError } = await supabase
      .from('financial_statements')
      .select('*')
      .eq('id', statement_id)
      .single();

    if (statementError) {
      console.error('Statement Fetch Error:', statementError);
      throw createError({
        statusCode: 404,
        message: `Financial statement not found: ${statementError.message}`,
      });
    }

    // Get reference files separately
    const { data: referenceFiles, error: refError } = await supabase
      .from('reference_files')
      .select('*')
      .eq('statement_id', statement_id);

    if (refError) {
      console.error('Reference Files Fetch Error:', refError);
      // Continue without reference files
    }

    // Prepare array of files to delete
    const filesToDelete = [];

    // Add statement file if exists
    if (statement.file_path) {
      filesToDelete.push(statement.file_path);
    }

    // Add reference files if they exist
    if (referenceFiles && referenceFiles.length > 0) {
      referenceFiles.forEach(ref => {
        if (ref.file_path) {
          filesToDelete.push(ref.file_path);
        }
      });
    }

    // 2. Delete files from storage if any exist
    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .storage
        .from('financial-statements')
        .remove(filesToDelete);

      if (deleteError) {
        console.error('Storage Delete Error:', deleteError);
        // Log error but continue with database cleanup
        console.warn('Failed to delete some files from storage, continuing with database cleanup');
      }
    }

    // 3. Delete all entries from financial_entries table for this statement
    const { error: entriesError } = await supabase
      .from('financial_entries')
      .delete()
      .eq('statement_id', statement_id);

    if (entriesError) {
      console.error('Entries Delete Error:', entriesError);
      throw createError({
        statusCode: 500,
        message: `Failed to delete entries: ${entriesError.message}`,
      });
    }

    // 4. Delete reference files records
    const { error: refDeleteError } = await supabase
      .from('reference_files')
      .delete()
      .eq('statement_id', statement_id);

    if (refDeleteError) {
      console.error('Reference Files Delete Error:', refDeleteError);
      throw createError({
        statusCode: 500,
        message: `Failed to delete reference files: ${refDeleteError.message}`,
      });
    }

    // 5. Finally, delete the financial statement record
    const { error: deleteError } = await supabase
      .from('financial_statements')
      .delete()
      .eq('id', statement_id);

    if (deleteError) {
      console.error('Statement Delete Error:', deleteError);
      throw createError({
        statusCode: 500,
        message: `Failed to delete statement: ${deleteError.message}`,
      });
    }

    // Return success response
    return {
      status: "success",
      message: "Financial statement deleted successfully",
      details: {
        statement_id: statement_id,
        files_deleted: filesToDelete,
        entries_deleted: true,
        reference_files_deleted: referenceFiles?.length || 0
      }
    };

  } catch (error) {
    console.error('Delete Statement Error:', error);
    
    return {
      status: "error",
      message: error.message || "An error occurred while deleting the statement",
    };
  }
}); 