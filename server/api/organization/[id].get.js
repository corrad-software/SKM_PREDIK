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

    // Get organization details with relationships and financial statements
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        description,
        bank_account,
        status,
        created_at,
        updated_at,
        children:organization_relationships!parent_id (
          child:organizations!child_id (
            id,
            name,
            description,
            bank_account,
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
      status: child.child.status,
      created_at: child.child.created_at,
      updated_at: child.child.updated_at
    })) || [];

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
        reference_file: referenceFile
      };
    });

    return {
      status: "success",
      data: {
        id: organization.id,
        name: organization.name,
        description: organization.description,
        bank_account: organization.bank_account,
        status: organization.status,
        created_at: organization.created_at,
        updated_at: organization.updated_at,
        parent,
        children,
        statements: {
          items: statements,
          total: statements.length,
          by_type: statements.reduce((acc, stmt) => {
            acc[stmt.statement_type] = (acc[stmt.statement_type] || 0) + 1;
            return acc;
          }, {})
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