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
    // Get all organizations
    const { data: organizations, error: orgError } = await supabase
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
            updated_at,
            financial_statements (
              id,
              file_name,
              file_path,
              statement_type,
              status,
              uploaded_at,
              updated_at,
              analysis_result,
              reference_file_id
            )
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
          reference_file_id
        )
      `)
      .eq('created_by', CONSTANTS.DEFAULT_USER_ID)
      .eq('status', CONSTANTS.ORGANIZATION_STATUS.ACTIVE);

    if (orgError) {
      throw createError({
        statusCode: 500,
        message: `Failed to fetch organizations: ${orgError.message}`
      });
    }

    // Get all reference files for the organizations
    const referenceFileIds = organizations.flatMap(org => [
      ...org.financial_statements.map(stmt => stmt.reference_file_id),
      ...org.children.flatMap(child => 
        child.child.financial_statements.map(stmt => stmt.reference_file_id)
      )
    ]).filter(id => id !== null);

    let referenceFiles = {};
    if (referenceFileIds.length > 0) {
      const { data: refFiles } = await supabase
        .from('reference_files')
        .select('*')
        .in('id', referenceFileIds);

      referenceFiles = (refFiles || []).reduce((acc, file) => {
        acc[file.id] = file;
        return acc;
      }, {});
    }

    // Process organizations to create a hierarchical structure
    const processedOrgs = organizations.map(org => {
      // Get parent info if exists
      const parent = org.parent?.[0]?.parent || null;

      // Process financial statements for the main organization
      const statements = (org.financial_statements || []).map(stmt => {
        // Get public URL for the statement file
        const { data: { publicUrl: statementUrl } } = supabase
          .storage
          .from('financial-statements')
          .getPublicUrl(stmt.file_path);

        // Process reference file if exists
        const referenceFile = stmt.reference_file_id && referenceFiles[stmt.reference_file_id] ? {
          id: referenceFiles[stmt.reference_file_id].id,
          file_name: referenceFiles[stmt.reference_file_id].file_name,
          file_url: referenceFiles[stmt.reference_file_id].file_url || 
            supabase.storage.from('financial-statements').getPublicUrl(referenceFiles[stmt.reference_file_id].file_path).data.publicUrl
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
          reference_file: referenceFile
        };
      });

      // Check document upload status for main organization
      const uploadedDocuments = {
        [DOCUMENT_TYPES.KUNCI_KIRA]: statements.some(s => s.statement_type === DOCUMENT_TYPES.KUNCI_KIRA),
        [DOCUMENT_TYPES.IMBANGAN_DUGA]: statements.some(s => s.statement_type === DOCUMENT_TYPES.IMBANGAN_DUGA),
        [DOCUMENT_TYPES.LEDGER]: statements.some(s => s.statement_type === DOCUMENT_TYPES.LEDGER),
        [DOCUMENT_TYPES.BANK_RECON]: statements.some(s => s.statement_type === DOCUMENT_TYPES.BANK_RECON)
      };

      // Process children with their financial statements
      const children = org.children?.map(child => {
        const childStatements = (child.child.financial_statements || []).map(stmt => {
          const { data: { publicUrl: statementUrl } } = supabase
            .storage
            .from('financial-statements')
            .getPublicUrl(stmt.file_path);

          // Process reference file if exists
          const referenceFile = stmt.reference_file_id && referenceFiles[stmt.reference_file_id] ? {
            id: referenceFiles[stmt.reference_file_id].id,
            file_name: referenceFiles[stmt.reference_file_id].file_name,
            file_url: referenceFiles[stmt.reference_file_id].file_url || 
              supabase.storage.from('financial-statements').getPublicUrl(referenceFiles[stmt.reference_file_id].file_path).data.publicUrl
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
            reference_file: referenceFile
          };
        });

        const childUploadedDocuments = {
          [DOCUMENT_TYPES.KUNCI_KIRA]: childStatements.some(s => s.statement_type === DOCUMENT_TYPES.KUNCI_KIRA),
          [DOCUMENT_TYPES.IMBANGAN_DUGA]: childStatements.some(s => s.statement_type === DOCUMENT_TYPES.IMBANGAN_DUGA),
          [DOCUMENT_TYPES.LEDGER]: childStatements.some(s => s.statement_type === DOCUMENT_TYPES.LEDGER),
          [DOCUMENT_TYPES.BANK_RECON]: childStatements.some(s => s.statement_type === DOCUMENT_TYPES.BANK_RECON)
        };

        return {
          id: child.child.id,
          name: child.child.name,
          description: child.child.description,
          bank_account: child.child.bank_account,
          organization_type: child.child.organization_type,
          status: child.child.status,
          created_at: child.child.created_at,
          updated_at: child.child.updated_at,
          statements: {
            items: childStatements,
            total: childStatements.length,
            by_type: childStatements.reduce((acc, stmt) => {
              acc[stmt.statement_type] = (acc[stmt.statement_type] || 0) + 1;
              return acc;
            }, {}),
            uploaded_documents: childUploadedDocuments
          }
        };
      }) || [];

      return {
        id: org.id,
        name: org.name,
        description: org.description,
        bank_account: org.bank_account,
        organization_type: org.organization_type,
        status: org.status,
        created_at: org.created_at,
        updated_at: org.updated_at,
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
      };
    });

    // Filter out organizations that are children (to get top-level orgs)
    const topLevelOrgs = processedOrgs.filter(org => !org.parent);

    return {
      status: "success",
      data: {
        organizations: topLevelOrgs
      }
    };

  } catch (error) {
    console.error('List Organizations Error:', error);
    
    return {
      status: "error",
      message: error.message || "An error occurred while fetching organizations"
    };
  }
}); 