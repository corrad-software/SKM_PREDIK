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
    // Get all organizations
    const { data: organizations, error: orgError } = await supabase
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
            name
          )
        ),
        financial_statements (
          id,
          file_name,
          statement_type,
          status,
          uploaded_at
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

    // Process organizations to create a hierarchical structure
    const processedOrgs = organizations.map(org => {
      // Get parent info if exists
      const parent = org.parent?.[0]?.parent || null;

      // Process children
      const children = org.children?.map(child => ({
        id: child.child.id,
        name: child.child.name,
        description: child.child.description,
        bank_account: child.child.bank_account,
        status: child.child.status,
        created_at: child.child.created_at,
        updated_at: child.child.updated_at
      })) || [];

      // Process financial statements
      const statements = {
        total: org.financial_statements?.length || 0,
        by_type: (org.financial_statements || []).reduce((acc, stmt) => {
          acc[stmt.statement_type] = (acc[stmt.statement_type] || 0) + 1;
          return acc;
        }, {})
      };

      return {
        id: org.id,
        name: org.name,
        description: org.description,
        bank_account: org.bank_account,
        status: org.status,
        created_at: org.created_at,
        updated_at: org.updated_at,
        parent,
        children,
        statements
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