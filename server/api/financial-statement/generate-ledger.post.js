import { createClient } from "@supabase/supabase-js";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

export default defineLazyEventHandler(async () => {
  const config = useRuntimeConfig();
  if (!config.openaiApiKey) throw new Error("Missing OpenAI API key");

  const openai = createOpenAI({
    apiKey: config.openaiApiKey,
  });

  // Function to sanitize error message
  const sanitizeErrorMessage = (error) => {
    if (!error) return "Unknown error occurred";

    console.log("Original error:", error); // Add logging for debugging

    // Handle schema validation errors
    if (error.includes("No object generated: response did not match schema")) {
      return "Data structure tidak sesuai dengan format yang diperlukan. Sila cuba lagi.";
    }

    // Handle other common error messages
    const commonErrors = {
      "Failed to fetch group data": "Data kumpulan tidak sah",
      "Failed to fetch statements": "Tiada penyata dijumpai untuk pemprosesan",
      "Missing OpenAI API key": "Konfigurasi sistem tidak lengkap",
      "maxTokens": "Data terlalu besar untuk diproses",
      "rate_limit": "Sistem terlalu sibuk. Sila cuba sebentar lagi"
    };

    for (const [key, value] of Object.entries(commonErrors)) {
      if (error.includes(key)) return value;
    }

    // For other errors, return a generic message
    return "Ralat berlaku semasa penjanaan lejar";
  };

  // Define the schema for the ledger structure with more flexible validation
  const ledgerSchema = z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    columns: z.array(z.object({
      name: z.string().min(1),
      subColumns: z.array(z.string().min(1)).length(2)
    })).length(8),
    rows: z.array(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      type: z.enum(["header", "item"]),
      pic: z.string().default(""),
      values: z.record(z.object({
        debit: z.union([z.string(), z.number(), z.null()]).optional().transform(v => v?.toString() ?? ""),
        kredit: z.union([z.string(), z.number(), z.null()]).optional().transform(v => v?.toString() ?? ""),
        debitBg: z.boolean().default(false),
        kreditBg: z.boolean().default(false)
      }))
    })).min(1)
  }).transform(data => {
    // Ensure all rows have values for all columns
    const updatedRows = data.rows.map(row => {
      const values = {};
      data.columns.forEach(col => {
        if (!row.values[col.name]) {
          values[col.name] = {
            debit: "",
            kredit: "",
            debitBg: false,
            kreditBg: false
          };
        } else {
          values[col.name] = row.values[col.name];
        }
      });
      return { ...row, values };
    });
    return { ...data, rows: updatedRows };
  });

  // Create the base prompt with more explicit instructions
  const basePrompt = `Anda adalah pakar akaun koperasi. Sila jana struktur lejar berdasarkan data kewangan yang diberikan.

PENTING: Anda mesti mengikut format JSON yang tepat seperti berikut:

{
  "title": "[NAMA ORGANISASI]",
  "subtitle": "PENYATA KEWANGAN : 31 DISEMBER [TAHUN SEMASA]",
  "columns": [
    {
      "name": "AKAUN [TAHUN SEMASA + 1]",
      "subColumns": ["DEBIT RM", "KREDIT RM"]
    },
    {
      "name": "DRAF [TAHUN SEMASA]",
      "subColumns": ["DEBIT RM", "KREDIT RM"]
    },
    {
      "name": "PELARASAN",
      "subColumns": ["DEBIT RM", "KREDIT RM"]
    },
    {
      "name": "IMBANGAN DUGA",
      "subColumns": ["DEBIT RM", "KREDIT RM"]
    },
    {
      "name": "AKAUN PERNIAGAAN",
      "subColumns": ["DEBIT RM", "KREDIT RM"]
    },
    {
      "name": "AK UI BUDI",
      "subColumns": ["DEBIT RM", "KREDIT RM"]
    },
    {
      "name": "AK PEMBAHAGIAN",
      "subColumns": ["DEBIT RM", "KREDIT RM"]
    },
    {
      "name": "KUNCI KIRA-KIRA",
      "subColumns": ["DEBIT RM", "KREDIT RM"]
    }
  ],
  "rows": [
    {
      "code": "10000",
      "name": "NAMA SEKSYEN",
      "type": "header",
      "pic": "",
      "values": {
        "AKAUN [TAHUN SEMASA + 1]": {
          "debit": "",
          "kredit": "",
          "debitBg": false,
          "kreditBg": false
        },
        "DRAF [TAHUN SEMASA]": {
          "debit": "",
          "kredit": "",
          "debitBg": false,
          "kreditBg": false
        },
        "PELARASAN": {
          "debit": "",
          "kredit": "",
          "debitBg": false,
          "kreditBg": false
        },
        "IMBANGAN DUGA": {
          "debit": "",
          "kredit": "",
          "debitBg": false,
          "kreditBg": false
        },
        "AKAUN PERNIAGAAN": {
          "debit": "",
          "kredit": "",
          "debitBg": false,
          "kreditBg": false
        },
        "AK UI BUDI": {
          "debit": "",
          "kredit": "",
          "debitBg": false,
          "kreditBg": false
        },
        "AK PEMBAHAGIAN": {
          "debit": "",
          "kredit": "",
          "debitBg": false,
          "kreditBg": false
        },
        "KUNCI KIRA-KIRA": {
          "debit": "",
          "kredit": "",
          "debitBg": false,
          "kreditBg": false
        }
      }
    }
  ]
}

ARAHAN PENTING:
1. Gunakan data amount_current untuk DRAF [TAHUN SEMASA]
2. Gunakan data amount_previous untuk AKAUN [TAHUN SEMASA + 1]
3. Untuk lajur lain, gunakan nilai kosong ("")
4. Kod mesti bermula dengan 10000 untuk seksyen utama
5. Tambah 10 untuk setiap item dalam seksyen
6. Type mesti "header" untuk seksyen utama dan "item" untuk butiran
7. Setiap nilai lajur MESTI ada debitBg dan kreditBg (boolean)
8. Pastikan semua nama lajur dalam values tepat sama dengan nama dalam columns
9. Pastikan semua nilai debit/kredit adalah string kosong ("") jika tiada nilai
10. PENTING: Gunakan "kredit" dan "kreditBg" (bukan "credit" atau "creditBg")
11. PENTING: Semua nilai numeric mesti dalam format string
12. PENTING: Setiap row MESTI ada values untuk SEMUA columns yang didefinisikan`;

  // Function to generate ledger structure
  const generateLedgerStructure = async (supabase, groupId, jobId) => {
    try {
      // Update job status to processing
      await supabase
        .from("ledger_generation_jobs")
        .update({ 
          status: "processing",
          updated_at: new Date().toISOString()
        })
        .eq("id", jobId);

      // Get group and organization details
      const { data: groupData, error: groupError } = await supabase
        .from("statement_groups")
        .select(`
          *,
          organizations (
            name
          )
        `)
        .eq("id", groupId)
        .single();

      if (groupError) {
        throw new Error("Failed to fetch group data");
      }

      if (!groupData?.organizations?.name) {
        throw new Error("Organization data is missing or invalid");
      }

      // Get statements
      const { data: statements, error: statementsError } = await supabase
        .from("statement_group_items")
        .select(`
          statement_type,
          financial_statements (
            id,
            year_current,
            year_previous,
            financial_entries (
              section,
              label,
              amount_current,
              amount_previous,
              is_total,
              parent_section,
              sort_order
            )
          )
        `)
        .eq("group_id", groupId);

      if (statementsError) {
        throw new Error("Failed to fetch statements");
      }

      if (!statements || statements.length === 0) {
        throw new Error("No statements found for processing");
      }

      const structuredData = {
        organization: groupData.organizations.name,
        statements: statements.map(stmt => ({
          type: stmt.statement_type,
          entries: stmt.financial_statements?.financial_entries || [],
          year_current: stmt.financial_statements?.year_current,
          year_previous: stmt.financial_statements?.year_previous
        }))
      };

      console.log("Structured data:", JSON.stringify(structuredData, null, 2)); // Add logging

      // Generate ledger structure using AI with retries
      let attempts = 0;
      const maxAttempts = 3;
      let lastError = null;

      while (attempts < maxAttempts) {
        try {
          console.log(`Attempt ${attempts + 1} of ${maxAttempts}`); // Add logging

          const { object: ledgerStructure } = await generateObject({
            model: openai("gpt-4"),
            schema: ledgerSchema,
            schemaDescription: "Struktur lejar koperasi dengan lajur debit dan kredit serta latar belakang",
            messages: [
              {
                role: "system",
                content: basePrompt,
              },
              {
                role: "user",
                content: `Sila jana struktur lejar berdasarkan data berikut: ${JSON.stringify(
                  structuredData,
                  null,
                  2
                )}`,
              },
            ],
            temperature: 0.1, // Reduced temperature for more consistent output
            maxTokens: 4000,
            presencePenalty: 0,
            frequencyPenalty: 0,
            topP: 0.1,
          });

          console.log("Generated structure:", JSON.stringify(ledgerStructure, null, 2)); // Add logging

          // If successful, update job and return
          await supabase
            .from("ledger_generation_jobs")
            .update({ 
              status: "completed",
              result: ledgerStructure,
              updated_at: new Date().toISOString()
            })
            .eq("id", jobId);

          return;
        } catch (error) {
          console.error(`Attempt ${attempts + 1} failed:`, error); // Add logging
          lastError = error;
          attempts++;
          
          // If it's not the last attempt, wait before retrying
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
          }
        }
      }

      // If all attempts failed, throw the last error
      throw new Error(sanitizeErrorMessage(lastError.message));

    } catch (error) {
      console.error("Generation Error:", error);
      
      // Update job with sanitized error
      await supabase
        .from("ledger_generation_jobs")
        .update({ 
          status: "failed",
          error: sanitizeErrorMessage(error.message),
          updated_at: new Date().toISOString()
        })
        .eq("id", jobId);

      throw error;
    }
  };

  return defineEventHandler(async (event) => {
    try {
      const { group_id } = await readBody(event);

      if (!group_id) {
        throw createError({
          statusCode: 400,
          message: "Group ID is required",
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

      // Create a new job record
      const { data: job, error: jobError } = await supabase
        .from("ledger_generation_jobs")
        .insert({
          group_id: group_id,
          status: "pending"
        })
        .select()
        .single();

      if (jobError) {
        throw createError({
          statusCode: 500,
          message: sanitizeErrorMessage("Failed to create generation job"),
        });
      }

      // Start the generation process in the background
      generateLedgerStructure(supabase, group_id, job.id).catch(error => {
        console.error("Background Generation Error:", error);
      });

      // Return immediately with the job ID
      return {
        status: "success",
        message: "Generation started",
        data: {
          job_id: job.id,
          status: "pending"
        }
      };

    } catch (error) {
      console.error("API Error:", error);
      throw createError({
        statusCode: error.statusCode || 500,
        message: sanitizeErrorMessage(error.message),
      });
    }
  });
}); 