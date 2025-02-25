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
    const body = await readBody(event);
    const { id, name, description, statements, organization_id } = body;

    // Validate request
    if (!name || !statements || !Array.isArray(statements) || statements.length === 0) {
      throw createError({
        statusCode: 400,
        message: "Name and statements array are required"
      });
    }

    if (!organization_id) {
      throw createError({
        statusCode: 400,
        message: "Organization ID is required"
      });
    }

    // Verify organization exists and user has access
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, organization_type')
      .eq('id', organization_id)
      .eq('created_by', CONSTANTS.DEFAULT_USER_ID)
      .single();

    if (orgError || !organization) {
      throw createError({
        statusCode: 404,
        message: "Organization not found or access denied"
      });
    }

    // Verify organization is of type 'child'
    if (organization.organization_type !== CONSTANTS.ORGANIZATION_TYPE.CHILD) {
      throw createError({
        statusCode: 400,
        message: "Financial statements can only be uploaded for child organizations",
      });
    }

    // Validate statement types
    const validTypes = ['kunci_kira_kira', 'imbangan_duga', 'ledger', 'bank_reconciliation'];
    const statementTypes = statements.map(s => s.type);
    const invalidTypes = statementTypes.filter(type => !validTypes.includes(type));
    if (invalidTypes.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Invalid statement types: ${invalidTypes.join(', ')}`
      });
    }

    // Check for duplicate statement types
    if (new Set(statementTypes).size !== statementTypes.length) {
      throw createError({
        statusCode: 400,
        message: "Duplicate statement types are not allowed"
      });
    }

    // Verify all statements exist and belong to the organization
    const statementIds = statements.map(s => s.statement_id);
    const { data: existingStatements, error: statementsError } = await supabase
      .from('financial_statements')
      .select('id, statement_type, organization_id')
      .in('id', statementIds)
      .eq('organization_id', organization_id);

    if (statementsError) {
      throw createError({
        statusCode: 500,
        message: `Failed to verify statements: ${statementsError.message}`
      });
    }

    if (existingStatements.length !== statementIds.length) {
      throw createError({
        statusCode: 400,
        message: "One or more statements not found or do not belong to the organization"
      });
    }

    let group;

    // If ID is provided, update existing group
    if (id) {
      // First, verify the group exists and belongs to the organization
      const { data: existingGroup, error: existingError } = await supabase
        .from('statement_groups')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organization_id)
        .single();

      if (existingError || !existingGroup) {
        throw createError({
          statusCode: 404,
          message: "Group not found or does not belong to the organization"
        });
      }

      // Update the group
      const { data: updatedGroup, error: updateError } = await supabase
        .from('statement_groups')
        .update({
          name,
          description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw createError({
          statusCode: 500,
          message: `Failed to update group: ${updateError.message}`
        });
      }

      group = updatedGroup;

      // Delete existing group items
      const { error: deleteError } = await supabase
        .from('statement_group_items')
        .delete()
        .eq('group_id', id);

      if (deleteError) {
        throw createError({
          statusCode: 500,
          message: `Failed to update group items: ${deleteError.message}`
        });
      }
    } else {
      // Create new group
      const { data: newGroup, error: groupError } = await supabase
        .from('statement_groups')
        .insert({
          name,
          description,
          organization_id,
          user_id: CONSTANTS.DEFAULT_USER_ID
        })
        .select()
        .single();

      if (groupError) {
        throw createError({
          statusCode: 500,
          message: `Failed to create group: ${groupError.message}`
        });
      }

      group = newGroup;
    }

    // Create group items
    const groupItems = statements.map(statement => ({
      group_id: group.id,
      statement_id: statement.statement_id,
      statement_type: statement.type
    }));

    const { error: itemsError } = await supabase
      .from('statement_group_items')
      .insert(groupItems);

    if (itemsError) {
      // If this is a new group, clean it up
      if (!id) {
        await supabase
          .from('statement_groups')
          .delete()
          .eq('id', group.id);
      }

      throw createError({
        statusCode: 500,
        message: `Failed to add statements to group: ${itemsError.message}`
      });
    }

    // Update all statements status to 'confirmed'
    const { error: statusError } = await supabase
      .from('financial_statements')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .in('id', statementIds);

    if (statusError) {
      console.error('Failed to update statements status:', statusError);
      // Don't throw error, just log it and continue
    }

    // Return success with group details
    return {
      status: "success",
      data: {
        group_id: group.id,
        name: group.name,
        description: group.description,
        organization_id: group.organization_id,
        created_at: group.created_at,
        updated_at: group.updated_at,
        statements_count: statements.length,
        statements_confirmed: !statusError,
        is_update: !!id
      }
    };

  } catch (error) {
    console.error('Create/Update Group Error:', error);
    
    return {
      status: "error",
      message: error.message || "An error occurred while creating/updating the group"
    };
  }
}); 