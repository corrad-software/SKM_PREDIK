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
    const id = event.context.params.id;

    // Get the financial statement and its entries
    const { data: statement, error: statementError } = await supabase
      .from('financial_statements')
      .select(`
        *,
        financial_entries (*)
      `)
      .eq('id', id)
      .single();

    if (statementError) {
      throw createError({
        statusCode: 500,
        message: `Failed to fetch financial statement: ${statementError.message}`
      });
    }

    if (!statement) {
      throw createError({
        statusCode: 404,
        message: 'Financial statement not found'
      });
    }

    // Get reference files separately
    const { data: referenceFiles, error: refError } = await supabase
      .from('reference_files')
      .select('*')
      .eq('statement_id', id);

    if (refError) {
      console.error('Reference Files Error:', refError);
      // Don't throw error, continue without reference files
    }

    // Get the file URLs
    const { data: { publicUrl: statementUrl } } = supabase
      .storage
      .from('financial-statements')
      .getPublicUrl(statement.file_path);

    // Get reference file URLs if they exist
    let referenceFilesWithUrls = [];
    if (referenceFiles && referenceFiles.length > 0) {
      referenceFilesWithUrls = referenceFiles.map(ref => {
        const { data: { publicUrl } } = supabase
          .storage
          .from('financial-statements')
          .getPublicUrl(ref.file_path);
        
        return {
          ...ref,
          file_url: publicUrl
        };
      });
    }

    // Group entries by section
    const entriesBySection = {};
    if (statement.financial_entries) {
      statement.financial_entries.forEach(entry => {
        if (!entriesBySection[entry.section]) {
          entriesBySection[entry.section] = [];
        }
        entriesBySection[entry.section].push(entry);
      });

      // Sort entries within each section
      Object.keys(entriesBySection).forEach(section => {
        entriesBySection[section].sort((a, b) => a.sort_order - b.sort_order);
      });
    }

    return {
      status: "success",
      data: {
        id: statement.id,
        file_name: statement.file_name,
        file_path: statement.file_path,
        file_url: statementUrl,
        statement_type: statement.statement_type,
        status: statement.status,
        created_at: statement.created_at,
        updated_at: statement.updated_at,
        analysis_result: statement.analysis_result,
        entries: entriesBySection,
        reference_files: referenceFilesWithUrls
      }
    };

  } catch (error) {
    console.error('Get Statement Error:', error);
    
    return {
      status: "error",
      message: error.message || "An error occurred while fetching the statement"
    };
  }
}); 