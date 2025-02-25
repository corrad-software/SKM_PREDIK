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
    // Get request body
    const body = await readBody(event);
    
    // Validate required fields
    if (!body.name) {
      throw createError({
        statusCode: 400,
        message: "Organization name is required"
      });
    }

    // If parent_id is provided, verify parent organization exists and is of type 'parent'
    if (body.parent_id) {
      const { data: parentOrg, error: parentError } = await supabase
        .from('organizations')
        .select('organization_type')
        .eq('id', body.parent_id)
        .eq('created_by', CONSTANTS.DEFAULT_USER_ID)
        .single();

      if (parentError) {
        throw createError({
          statusCode: 404,
          message: "Parent organization not found"
        });
      }

      if (parentOrg.organization_type !== CONSTANTS.ORGANIZATION_TYPE.PARENT) {
        throw createError({
          statusCode: 400,
          message: "Child organizations cannot create sub-organizations"
        });
      }
    }

    // Create organization with appropriate type
    const { data: organization, error: orgCreateError } = await supabase
      .from('organizations')
      .insert({
        name: body.name,
        description: body.description,
        bank_account: body.bank_account,
        created_by: CONSTANTS.DEFAULT_USER_ID,
        status: CONSTANTS.ORGANIZATION_STATUS.ACTIVE,
        organization_type: body.parent_id ? CONSTANTS.ORGANIZATION_TYPE.CHILD : CONSTANTS.ORGANIZATION_TYPE.PARENT
      })
      .select()
      .single();

    if (orgCreateError) {
      throw createError({
        statusCode: 500,
        message: `Failed to create organization: ${orgCreateError.message}`
      });
    }

    // If parent_id is provided, create relationship
    if (body.parent_id) {
      const { error: relationError } = await supabase
        .from('organization_relationships')
        .insert({
          parent_id: body.parent_id,
          child_id: organization.id
        });

      if (relationError) {
        // If relationship creation fails, delete the organization
        await supabase
          .from('organizations')
          .delete()
          .eq('id', organization.id);

        throw createError({
          statusCode: 500,
          message: `Failed to create organization relationship: ${relationError.message}`
        });
      }
    }

    return {
      status: "success",
      data: organization
    };

  } catch (error) {
    console.error('Create Organization Error:', error);
    
    return {
      status: "error",
      message: error.message || "An error occurred while creating the organization"
    };
  }
}); 