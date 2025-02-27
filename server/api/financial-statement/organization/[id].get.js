import { createClient } from "@supabase/supabase-js";

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
    const organizationId = event.context.params.id;

    // First get the latest statement IDs for each type
    const { data: latestStatements, error: latestError } = await supabase
      .from('financial_statements')
      .select('id, statement_type')
      .eq('organization_id', organizationId)
      .order('uploaded_at', { ascending: false });

    if (latestError) {
      throw createError({
        statusCode: 500,
        message: `Error fetching statements: ${latestError.message}`
      });
    }

    // If no statements found, return empty data structure
    if (!latestStatements || latestStatements.length === 0) {
      return {
        status: 'success',
        data: {
          kunci_kira_kira: {
            id: null,
            statementFile: {
              name: '',
              path: ''
            },
            referenceFile: null,
            uploadedAt: null,
            yearCurrent: null,
            yearPrevious: null,
            analysis: null,
            status: null,
            analyzingStatus: false
          },
          imbangan_duga: {
            id: null,
            statementFile: {
              name: '',
              path: ''
            },
            referenceFile: null,
            uploadedAt: null,
            yearCurrent: null,
            yearPrevious: null,
            analysis: null,
            status: null,
            analyzingStatus: false
          },
          ledger: {
            id: null,
            statementFile: {
              name: '',
              path: ''
            },
            referenceFile: null,
            uploadedAt: null,
            yearCurrent: null,
            yearPrevious: null,
            analysis: null,
            status: null,
            analyzingStatus: false
          },
          bank_reconciliation: {
            id: null,
            statementFile: {
              name: '',
              path: ''
            },
            referenceFile: null,
            uploadedAt: null,
            yearCurrent: null,
            yearPrevious: null,
            analysis: null,
            status: null,
            analyzingStatus: false
          }
        }
      };
    }

    // Get unique latest statement for each type
    const latestStatementIds = [];
    const seenTypes = new Set();
    
    latestStatements?.forEach(statement => {
      if (!seenTypes.has(statement.statement_type)) {
        seenTypes.add(statement.statement_type);
        latestStatementIds.push(statement.id);
      }
    });

    // Now fetch complete data for only the latest statements
    const { data: statements, error: statementsError } = await supabase
      .from('financial_statements')
      .select(`
        id,
        statement_type,
        file_name,
        file_path,
        status,
        uploaded_at,
        updated_at,
        year_current,
        year_previous,
        analysis_result,
        reference_files:reference_file_id (
          id,
          file_name,
          file_path,
          file_url
        )
      `)
      .in('id', latestStatementIds);

    if (statementsError) {
      throw createError({
        statusCode: 500,
        message: `Error fetching statement details: ${statementsError.message}`
      });
    }

    // Group statements by type with default values
    const groupedStatements = {
      kunci_kira_kira: {
        id: null,
        statementFile: {
          name: '',
          path: ''
        },
        referenceFile: null,
        uploadedAt: null,
        yearCurrent: null,
        yearPrevious: null,
        analysis: null,
        status: null,
        analyzingStatus: false
      },
      imbangan_duga: {
        id: null,
        statementFile: {
          name: '',
          path: ''
        },
        referenceFile: null,
        uploadedAt: null,
        yearCurrent: null,
        yearPrevious: null,
        analysis: null,
        status: null,
        analyzingStatus: false
      },
      ledger: {
        id: null,
        statementFile: {
          name: '',
          path: ''
        },
        referenceFile: null,
        uploadedAt: null,
        yearCurrent: null,
        yearPrevious: null,
        analysis: null,
        status: null,
        analyzingStatus: false
      },
      bank_reconciliation: {
        id: null,
        statementFile: {
          name: '',
          path: ''
        },
        referenceFile: null,
        uploadedAt: null,
        yearCurrent: null,
        yearPrevious: null,
        analysis: null,
        status: null,
        analyzingStatus: false
      }
    };

    // Map the statements to their types
    statements?.forEach(statement => {
      groupedStatements[statement.statement_type] = {
        id: statement.id,
        statementFile: {
          name: statement.file_name || '',
          path: statement.file_path || ''
        },
        referenceFile: statement.reference_files ? {
          name: statement.reference_files.file_name || '',
          path: statement.reference_files.file_path || '',
          url: statement.reference_files.file_url || ''
        } : null,
        uploadedAt: statement.uploaded_at,
        yearCurrent: statement.year_current,
        yearPrevious: statement.year_previous,
        analysis: statement.analysis_result || null,
        status: statement.status,
        analyzingStatus: false
      };
    });

    return {
      status: 'success',
      data: groupedStatements
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}); 