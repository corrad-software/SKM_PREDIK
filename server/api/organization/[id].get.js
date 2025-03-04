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

// Define document types to check
const DOCUMENT_TYPES = {
  KUNCI_KIRA: 'kunci_kira_kira',
  IMBANGAN_DUGA: 'imbangan_duga',
  LEDGER: 'ledger',
  BANK_RECON: 'bank_reconciliation'
};

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params.id;

    // Get organization details with relationships, financial statements, and current year
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        description,
        bank_account,
        organization_type,
        status,
        created_at,
        updated_at,
        children:organization_relationships!parent_id (
          child:organizations!child_id (
            id,
            name,
            description,
            bank_account,
            organization_type,
            status,
            created_at,
            updated_at
          )
        ),
        parent:organization_relationships!child_id (
          parent:organizations!parent_id (
            id,
            name,
            description,
            bank_account,
            organization_type,
            status
          )
        ),
        financial_statements (
          id,
          file_name,
          file_path,
          statement_type,
          status,
          uploaded_at,
          updated_at,
          analysis_result,
          year_current,
          year_previous,
          reference_file:reference_files!financial_statements_reference_file_id_fkey (
            id,
            file_name,
            file_path,
            file_url
          )
        )
      `)
      .eq('id', id)
      .eq('created_by', CONSTANTS.DEFAULT_USER_ID)
      .single();

    if (orgError) {
      throw createError({
        statusCode: orgError.code === 'PGRST116' ? 404 : 500,
        message: orgError.code === 'PGRST116' ? 'Organization not found' : `Failed to fetch organization: ${orgError.message}`
      });
    }

    // Process the organization data
    const parent = organization.parent?.[0]?.parent || null;
    const children = organization.children?.map(child => ({
      id: child.child.id,
      name: child.child.name,
      description: child.child.description,
      bank_account: child.child.bank_account,
      organization_type: child.child.organization_type,
      status: child.child.status,
      created_at: child.child.created_at,
      updated_at: child.child.updated_at
    })) || [];

    // Get the most recent year from financial statements
    const currentYear = organization.financial_statements?.reduce((latest, stmt) => {
      return stmt.year_current > latest ? stmt.year_current : latest;
    }, 0) || new Date().getFullYear();

    // Process financial statements
    const statements = (organization.financial_statements || []).map(stmt => {
      // Get public URL for the statement file
      const { data: { publicUrl: statementUrl } } = supabase
        .storage
        .from('financial-statements')
        .getPublicUrl(stmt.file_path);

      // Process reference file if exists
      const referenceFile = stmt.reference_file ? {
        id: stmt.reference_file.id,
        file_name: stmt.reference_file.file_name,
        file_url: stmt.reference_file.file_url || supabase.storage.from('financial-statements').getPublicUrl(stmt.reference_file.file_path).data.publicUrl
      } : null;

      return {
        id: stmt.id,
        file_name: stmt.file_name,
        file_url: statementUrl,
        statement_type: stmt.statement_type,
        status: stmt.status,
        uploaded_at: stmt.uploaded_at,
        updated_at: stmt.updated_at,
        analysis_result: stmt.analysis_result,
        year_current: stmt.year_current,
        year_previous: stmt.year_previous,
        reference_file: referenceFile
      };
    });

    // Check document upload status
    const uploadedDocuments = {
      [DOCUMENT_TYPES.KUNCI_KIRA]: statements.some(s => s.statement_type === DOCUMENT_TYPES.KUNCI_KIRA),
      [DOCUMENT_TYPES.IMBANGAN_DUGA]: statements.some(s => s.statement_type === DOCUMENT_TYPES.IMBANGAN_DUGA),
      [DOCUMENT_TYPES.LEDGER]: statements.some(s => s.statement_type === DOCUMENT_TYPES.LEDGER),
      [DOCUMENT_TYPES.BANK_RECON]: statements.some(s => s.statement_type === DOCUMENT_TYPES.BANK_RECON)
    };

    return {
      status: "success",
      data: {
        id: organization.id,
        name: organization.name,
        description: organization.description,
        bank_account: organization.bank_account,
        organization_type: organization.organization_type,
        status: organization.status,
        created_at: organization.created_at,
        updated_at: organization.updated_at,
        current_year: currentYear,
        parent,
        children,
        statements: {
          items: statements,
          total: statements.length,
          by_type: statements.reduce((acc, stmt) => {
            acc[stmt.statement_type] = (acc[stmt.statement_type] || 0) + 1;
            return acc;
          }, {}),
          uploaded_documents: uploadedDocuments
        }
      }
    };

  } catch (error) {
    console.error('Get Organization Error:', error);
    
    return {
      status: "error",
      message: error.message || "An error occurred while fetching the organization"
    };
  }
}); 