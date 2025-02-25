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
    const id = event.context.params.id;
    const body = await readBody(event);

    if (!body.status) {
      throw createError({
        statusCode: 400,
        message: 'Status is required'
      });
    }

    // Validate status
    const validStatuses = ['draft', 'confirmed', 'deleted'];
    if (!validStatuses.includes(body.status)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid status. Must be one of: draft, confirmed, deleted'
      });
    }

    // Update the status
    const { data: statement, error: updateError } = await supabase
      .from('financial_statements')
      .update({ 
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw createError({
        statusCode: 500,
        message: `Failed to update status: ${updateError.message}`
      });
    }

    return {
      status: "success",
      data: statement
    };

  } catch (error) {
    console.error('Update Status Error:', error);
    
    return {
      status: "error",
      message: error.message || "An error occurred while updating the status"
    };
  }
}); 