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
    // Get organization_id from query params
    const query = getQuery(event);
    const { organization_id } = query;

    if (!organization_id) {
      throw createError({
        statusCode: 400,
        message: "Organization ID is required"
      });
    }

    // Verify organization exists and user has access
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organization_id)
      .eq('created_by', CONSTANTS.DEFAULT_USER_ID)
      .single();

    if (orgError || !organization) {
      throw createError({
        statusCode: 404,
        message: "Organization not found or access denied"
      });
    }

    // Get all groups with their statement items for the organization
    const { data: groups, error: groupsError } = await supabase
      .from('statement_groups')
      .select(`
        id,
        name,
        description,
        organization_id,
        created_at,
        updated_at,
        statement_group_items (
          id,
          statement_id,
          statement_type,
          financial_statements (
            id,
            file_name,
            statement_type,
            status,
            uploaded_at,
            updated_at,
            analysis_result
          )
        ),
        ledger_generation_jobs (
          id,
          status,
          result,
          created_at,
          updated_at
        )
      `)
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false });

    if (groupsError) {
      throw createError({
        statusCode: 500,
        message: `Failed to fetch statement groups: ${groupsError.message}`
      });
    }

    // Process and format the response
    const formattedGroups = groups.map(group => {
      // Process statement items
      const items = group.statement_group_items?.map(item => {
        const statement = item.financial_statements;
        return {
          id: item.id,
          type: item.statement_type,
          statement: statement ? {
            id: statement.id,
            fileName: statement.file_name,
            type: statement.statement_type,
            status: statement.status,
            uploadedAt: statement.uploaded_at,
            updatedAt: statement.updated_at,
            hasIssues: statement.analysis_result ? 
              (statement.analysis_result.total_major_issues > 0 || statement.analysis_result.total_minor_issues > 0) : 
              false,
            issues: statement.analysis_result ? {
              major: statement.analysis_result.total_major_issues || 0,
              minor: statement.analysis_result.total_minor_issues || 0
            } : null
          } : null
        };
      }) || [];

      // Get the latest successful ledger job
      const latestSuccessfulJob = group.ledger_generation_jobs?.find(job => 
        job.status === 'completed' && job.result
      );

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        organization_id: group.organization_id,
        created_at: group.created_at,
        updated_at: group.updated_at,
        items: items,
        summary: {
          total: items.length,
          has_issues: items.some(item => item.statement?.hasIssues),
          issues: {
            total_major_issues: items.reduce((sum, item) => 
              sum + (item.statement?.issues?.major || 0), 0),
            total_minor_issues: items.reduce((sum, item) => 
              sum + (item.statement?.issues?.minor || 0), 0)
          }
        },
        existing_ledger: latestSuccessfulJob ? {
          job_id: latestSuccessfulJob.id,
          generated_at: latestSuccessfulJob.updated_at,
          result: latestSuccessfulJob.result
        } : null
      };
    });

    return {
      status: "success",
      data: {
        total_groups: formattedGroups.length,
        groups: formattedGroups
      }
    };

  } catch (error) {
    console.error('List Groups Error:', error);
    
    return {
      status: "error",
      message: error.message || "An error occurred while fetching the groups list"
    };
  }
}); 