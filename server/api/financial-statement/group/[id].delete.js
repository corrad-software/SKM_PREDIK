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

    // First, verify the group exists and get its details
    const { data: group, error: groupError } = await supabase
      .from('statement_groups')
      .select(`
        *,
        statement_group_items (
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

    // Delete group items first (this should cascade, but we'll do it explicitly)
    const { error: itemsError } = await supabase
      .from('statement_group_items')
      .delete()
      .eq('group_id', group_id);

    if (itemsError) {
      throw createError({
        statusCode: 500,
        message: `Failed to delete group items: ${itemsError.message}`
      });
    }

    // Then delete the group itself
    const { error: deleteError } = await supabase
      .from('statement_groups')
      .delete()
      .eq('id', group_id);

    if (deleteError) {
      throw createError({
        statusCode: 500,
        message: `Failed to delete group: ${deleteError.message}`
      });
    }

    // Return success with details about what was deleted
    return {
      status: "success",
      message: "Statement group deleted successfully",
      data: {
        group_id: group.id,
        name: group.name,
        statements_deleted: group.statement_group_items?.length || 0
      }
    };

  } catch (error) {
    console.error('Delete Group Error:', error);
    
    return {
      status: "error",
      message: error.message || "An error occurred while deleting the group"
    };
  }
});