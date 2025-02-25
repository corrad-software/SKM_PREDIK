import { createClient } from "@supabase/supabase-js";
import { createError } from "h3";
import { CONSTANTS } from "~/server/utils/constants";

const ENV = useRuntimeConfig();

// Initialize Supabase client
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
    const id = event.context.params.id;

    // First, check if organization exists and belongs to the user
    const { data: organization, error: checkError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', id)
      .eq('created_by', CONSTANTS.DEFAULT_USER_ID)
      .single();

    if (checkError) {
      throw createError({
        statusCode: checkError.code === 'PGRST116' ? 404 : 500,
        message: checkError.code === 'PGRST116' ? 'Organization not found' : `Failed to check organization: ${checkError.message}`
      });
    }

    // Get all financial statements for this organization
    const { data: statements, error: stmtError } = await supabase
      .from('financial_statements')
      .select(`
        id, 
        file_path,
        reference_file:reference_files!financial_statements_reference_file_id_fkey (
          file_path
        )
      `)
      .eq('organization_id', id);

    if (stmtError) {
      throw createError({
        statusCode: 500,
        message: `Failed to fetch statements: ${stmtError.message}`
      });
    }

    // Collect all file paths to delete
    const filesToDelete = [];
    statements?.forEach(stmt => {
      if (stmt.file_path) filesToDelete.push(stmt.file_path);
      if (stmt.reference_file?.file_path) {
        filesToDelete.push(stmt.reference_file.file_path);
      }
    });

    // Delete files from storage if any exist
    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase
        .storage
        .from('financial-statements')
        .remove(filesToDelete);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with deletion even if storage cleanup fails
      }
    }

    // Delete the organization (this will cascade to relationships and statements)
    const { error: deleteError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw createError({
        statusCode: 500,
        message: `Failed to delete organization: ${deleteError.message}`
      });
    }

    return {
      status: "success",
      message: "Organization deleted successfully",
      details: {
        organization_id: id,
        statements_deleted: statements?.length || 0,
        files_deleted: filesToDelete
      }
    };

  } catch (error) {
    console.error('Delete Organization Error:', error);
    
    return {
      status: "error",
      message: error.message || "An error occurred while deleting the organization"
    };
  }
}); 