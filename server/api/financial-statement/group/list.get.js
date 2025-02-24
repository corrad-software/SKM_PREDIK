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
    // Get all groups with their statement items
    const { data: groups, error: groupsError } = await supabase
      .from('statement_groups')
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        statement_group_items (
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
        )
      `)
      .order('created_at', { ascending: false });

    if (groupsError) {
      throw createError({
        statusCode: 500,
        message: `Failed to fetch statement groups: ${groupsError.message}`
      });
    }

    // Process and format the response
    const formattedGroups = groups.map(group => {
      // Count statements by type and status
      const statementStats = {
        total: 0,
        by_type: {},
        by_status: {},
        has_issues: false
      };

      // Calculate total issues across all statements
      let totalMajorIssues = 0;
      let totalMinorIssues = 0;

      group.statement_group_items?.forEach(item => {
        const statement = item.financial_statements;
        if (statement) {
          // Increment total
          statementStats.total++;

          // Count by type
          statementStats.by_type[item.statement_type] = 
            (statementStats.by_type[item.statement_type] || 0) + 1;

          // Count by status
          statementStats.by_status[statement.status] = 
            (statementStats.by_status[statement.status] || 0) + 1;

          // Check for issues in analysis result
          if (statement.analysis_result) {
            totalMajorIssues += statement.analysis_result.total_major_issues || 0;
            totalMinorIssues += statement.analysis_result.total_minor_issues || 0;
            if ((statement.analysis_result.total_major_issues || 0) > 0 ||
                (statement.analysis_result.total_minor_issues || 0) > 0) {
              statementStats.has_issues = true;
            }
          }
        }
      });

      // Add issue counts if any issues exist
      if (totalMajorIssues > 0 || totalMinorIssues > 0) {
        statementStats.issues = {
          total_major_issues: totalMajorIssues,
          total_minor_issues: totalMinorIssues
        };
      }

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        created_at: group.created_at,
        updated_at: group.updated_at,
        statements: statementStats
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