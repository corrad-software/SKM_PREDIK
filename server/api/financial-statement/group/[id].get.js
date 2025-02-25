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
    const group_id = event.context.params.id;

    // Get group details with all statements
    const { data: group, error: groupError } = await supabase
      .from('statement_groups')
      .select(`
        *,
        statement_group_items!inner (
          statement_id,
          statement_type
        )
      `)
      .eq('id', group_id)
      .single();

    if (groupError) {
      throw createError({
        statusCode: 404,
        message: `Statement group not found: ${groupError.message}`
      });
    }

    // Get all statements with their entries and reference files
    const statementIds = group.statement_group_items.map(item => item.statement_id);
    const { data: statements, error: statementsError } = await supabase
      .from('financial_statements')
      .select(`
        id,
        file_name,
        file_path,
        statement_type,
        status,
        uploaded_at,
        updated_at,
        analysis_result,
        reference_file_id,
        financial_entries (
          id,
          section,
          label,
          amount,
          is_total,
          parent_section,
          sort_order,
          created_at
        ),
        reference_files!reference_files_statement_id_fkey (
          id,
          file_name,
          file_path,
          file_url,
          created_at,
          updated_at
        )
      `)
      .in('id', statementIds);

    if (statementsError) {
      throw createError({
        statusCode: 500,
        message: `Failed to fetch statements: ${statementsError.message}`
      });
    }

    // Create a map of statements by their IDs
    const statementsMap = statements.reduce((acc, statement) => {
      // Get public URL for the statement file
      const { data: { publicUrl: statementUrl } } = supabase
        .storage
        .from('financial-statements')
        .getPublicUrl(statement.file_path);

      // Add the URL to the statement object
      acc[statement.id] = {
        ...statement,
        file_url: statementUrl
      };
      return acc;
    }, {});

    // Restructure the response to be more user-friendly
    const groupedStatements = {};
    group.statement_group_items.forEach(item => {
      const statement = statementsMap[item.statement_id];
      if (statement) {
        // Group entries by section and sort them
        const entriesBySection = {};
        if (statement.financial_entries) {
          statement.financial_entries.forEach(entry => {
            if (!entriesBySection[entry.section]) {
              entriesBySection[entry.section] = [];
            }
            entriesBySection[entry.section].push({
              id: entry.id,
              label: entry.label,
              amount: entry.amount,
              is_total: entry.is_total,
              parent_section: entry.parent_section,
              sort_order: entry.sort_order,
              created_at: entry.created_at
            });
          });

          // Sort entries within each section
          Object.keys(entriesBySection).forEach(section => {
            entriesBySection[section].sort((a, b) => a.sort_order - b.sort_order);
          });
        }

        // Format reference files and get their URLs if not already present
        const referenceFiles = statement.reference_files?.map(ref => {
          const fileUrl = ref.file_url || (() => {
            const { data: { publicUrl } } = supabase
              .storage
              .from('financial-statements')
              .getPublicUrl(ref.file_path);
            return publicUrl;
          })();

          return {
            id: ref.id,
            file_name: ref.file_name,
            file_path: ref.file_path,
            file_url: fileUrl,
            created_at: ref.created_at,
            updated_at: ref.updated_at
          };
        }) || [];

        // Add statement to the appropriate type
        groupedStatements[item.statement_type] = {
          id: statement.id,
          file_name: statement.file_name,
          file_path: statement.file_path,
          file_url: statement.file_url,
          status: statement.status,
          created_at: statement.uploaded_at,
          updated_at: statement.updated_at,
          analysis_result: statement.analysis_result,
          reference_file_id: statement.reference_file_id,
          entries: entriesBySection,
          reference_files: referenceFiles
        };
      }
    });

    // Return success with restructured data
    return {
      status: "success",
      data: {
        id: group.id,
        name: group.name,
        description: group.description,
        created_at: group.created_at,
        updated_at: group.updated_at,
        statements_count: Object.keys(groupedStatements).length,
        statements: groupedStatements
      }
    };

  } catch (error) {
    console.error('Get Group Error:', error);
    
    return {
      status: "error",
      message: error.message || "An error occurred while fetching the group"
    };
  }
}); 