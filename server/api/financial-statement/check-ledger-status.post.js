import { createClient } from "@supabase/supabase-js";

export default defineLazyEventHandler(async () => {
  const config = useRuntimeConfig();

  // Function to sanitize error message
  const sanitizeErrorMessage = (error) => {
    if (!error) return "Unknown error occurred";

    // Handle schema validation errors
    if (error.includes("No object generated: response did not match schema")) {
      return "Failed to generate ledger structure. Please try again.";
    }

    // Handle other common error messages
    const commonErrors = {
      "Failed to fetch group data": "Invalid group data",
      "Failed to fetch statements": "No statements found for processing",
      "Job not found": "Generation job not found",
      "No generation jobs found for this group": "No generation process found for this group"
    };

    for (const [key, value] of Object.entries(commonErrors)) {
      if (error.includes(key)) return value;
    }

    // For other errors, return a generic message
    return "An error occurred during the generation process";
  };

  return defineEventHandler(async (event) => {
    try {
      const { job_id, group_id } = await readBody(event);

      if (!job_id && !group_id) {
        throw createError({
          statusCode: 400,
          message: "Either job_id or group_id is required",
        });
      }

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

      let query = supabase
        .from("ledger_generation_jobs")
        .select("*");

      // Apply the appropriate filter based on provided parameter
      if (job_id) {
        query = query.eq("id", job_id);
      } else {
        query = query
          .eq("group_id", group_id)
          .order("created_at", { ascending: false })
          .limit(1);
      }

      const { data: jobs, error: jobError } = await query;

      if (jobError) {
        throw createError({
          statusCode: 500,
          message: sanitizeErrorMessage(jobError.message),
        });
      }

      if (!jobs || jobs.length === 0) {
        throw createError({
          statusCode: 404,
          message: sanitizeErrorMessage(
            job_id 
              ? "Job not found" 
              : "No generation jobs found for this group"
          ),
        });
      }

      const job = jobs[0];

      // Handle cases where the job failed due to AI generation or schema validation
      if (job.status === "failed") {
        return {
          status: "error",
          data: {
            job_id: job.id,
            group_id: job.group_id,
            status: job.status,
            error: sanitizeErrorMessage(job.error),
            created_at: job.created_at,
            updated_at: job.updated_at
          }
        };
      }

      // For successful or in-progress jobs
      return {
        status: job.status === "completed" ? "success" : "pending",
        data: {
          job_id: job.id,
          group_id: job.group_id,
          status: job.status,
          result: job.status === "completed" ? job.result : null,
          error: null,
          created_at: job.created_at,
          updated_at: job.updated_at
        }
      };

    } catch (error) {
      console.error("Check Status Error:", error);
      throw createError({
        statusCode: error.statusCode || 500,
        message: sanitizeErrorMessage(error.message),
      });
    }
  });
}); 