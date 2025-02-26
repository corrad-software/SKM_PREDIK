import { createClient } from "@supabase/supabase-js";
import { createError } from "h3";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const id = event.context.params.id;
    const body = await readBody(event);

    // Validate required fields
    if (!body.name) {
      throw createError({
        statusCode: 400,
        message: "Organization name is required",
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      config.public.supabaseUrl,
      config.supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Prepare update data
    const updateData = {
      name: body.name,
      bank_account: body.bank_account || null,
      updated_at: new Date().toISOString(),
    };

    // If organization_type is provided, include it in the update
    if (body.organization_type) {
      if (!['parent', 'child'].includes(body.organization_type)) {
        throw createError({
          statusCode: 400,
          message: "Invalid organization type. Must be 'parent' or 'child'",
        });
      }
      updateData.organization_type = body.organization_type;
    }

    // Update organization
    const { data, error } = await supabase
      .from("organizations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update Error:", error);
      throw createError({
        statusCode: 500,
        message: `Failed to update organization: ${error.message}`,
      });
    }

    return {
      status: "success",
      data: data,
    };
  } catch (error) {
    console.error("Update Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to update organization",
    });
  }
}); 