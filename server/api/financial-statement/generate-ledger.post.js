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

    console.log("Original error:", error);

    if (error.includes("No object generated: response did not match schema")) {
      return "Data struktur tidak sesuai dengan format yang diperlukan. Sila cuba lagi.";
    }

    const commonErrors = {
      "Failed to fetch group data": "Data kumpulan tidak sah",
      "Failed to fetch statements": "Tiada penyata dijumpai untuk pemprosesan",
      "Missing OpenAI API key": "Konfigurasi sistem tidak lengkap",
      maxTokens: "Data terlalu besar untuk diproses",
      rate_limit: "Sistem terlalu sibuk. Sila cuba sebentar lagi",
    };

    for (const [key, value] of Object.entries(commonErrors)) {
      if (error.includes(key)) return value;
    }

    return "Ralat berlaku semasa penjanaan lejar";
  };

  // Define Zod schemas for each section
  const valueSchema = z.object({
    debit: z.string(),
    kredit: z.string(),
    debitBg: z.boolean(),
    kreditBg: z.boolean()
  }).required();

  const columnSchema = z.object({
    name: z.string(),
    subColumns: z.array(z.string())
  }).required();

  const rowSchema = z.object({
    code: z.string(),
    name: z.string(),
    type: z.enum(["header", "item"]),
    pic: z.string(),
    values: z.object({}).catchall(valueSchema)
  }).required();

  const ledgerSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    columns: z.array(columnSchema),
    rows: z.array(rowSchema)
  }).required();

  const categoryBaseSchema = z.object({
    name: z.string(),
    level: z.enum(["HIGH", "MEDIUM", "LOW"]),
    description: z.string(),
    recommendations: z.array(z.string()),
    isOpen: z.boolean()
  }).required();

  const riskCategorySchema = categoryBaseSchema.extend({
    status: z.enum(["NEED ATTENTION", "MONITORING", "ACCEPTABLE"])
  }).required();

  const riskAssessmentSchema = z.object({
    overallRisk: z.enum(["HIGH", "MEDIUM", "LOW"]),
    categories: z.array(riskCategorySchema)
  }).required();

  const materialitySchema = z.object({
    overallLevel: z.enum(["HIGH", "MEDIUM", "LOW"]),
    categories: z.array(categoryBaseSchema)
  }).required();

  const auditSamplingSchema = z.object({
    overallLevel: z.enum(["HIGH", "MEDIUM", "LOW"]),
    categories: z.array(categoryBaseSchema)
  }).required();

  // Define the complete schema
  const completeSchema = z.object({
    ledger: ledgerSchema,
    riskAssessment: riskAssessmentSchema,
    materiality: materialitySchema,
    auditSampling: auditSamplingSchema
  }).required();

  // Function to handle data transformations after validation
  const transformResponse = (data) => {
    const transformedData = {
      ...data,
      ledger: {
        ...data.ledger,
        rows: data.ledger.rows.map((row) => ({
          ...row,
          pic: row.pic || "",
          values: Object.fromEntries(
            Object.entries(row.values).map(([key, value]) => [
              key,
              {
                debit: value.debit || "",
                kredit: value.kredit || "",
                debitBg: value.debitBg || false,
                kreditBg: value.kreditBg || false,
              },
            ])
          ),
        })),
      },
      riskAssessment: {
        ...data.riskAssessment,
        categories: data.riskAssessment.categories.map((cat) => ({
          ...cat,
          isOpen: cat.isOpen || false,
        })),
      },
      materiality: {
        ...data.materiality,
        categories: data.materiality.categories.map((cat) => ({
          ...cat,
          isOpen: cat.isOpen || false,
        })),
      },
      auditSampling: {
        ...data.auditSampling,
        categories: data.auditSampling.categories.map((cat) => ({
          ...cat,
          isOpen: cat.isOpen || false,
        })),
      },
    };
    return transformedData;
  };

  // Create the base prompt with instructions for all sections
  const basePrompt = `Anda adalah pakar akaun koperasi. Sila jana struktur lejar dan penilaian berdasarkan data kewangan yang diberikan.

PENTING: Anda mesti mengikut format JSON yang tepat untuk semua bahagian.

BAHAGIAN LEJAR:
{
  "ledger": {
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
    "rows": [...]
  },
  "riskAssessment": {
    "overallRisk": "[MESTI salah satu: HIGH, MEDIUM, LOW]",
    "categories": [
      {
        "name": "Risiko Kewangan",
        "level": "[MESTI salah satu: HIGH, MEDIUM, LOW]",
        "status": "[MESTI salah satu: NEED ATTENTION, MONITORING, ACCEPTABLE]",
        "description": "Penerangan risiko",
        "recommendations": ["Cadangan 1", "Cadangan 2"],
        "isOpen": false
      }
    ]
  },
  "materiality": {
    "overallLevel": "[MESTI salah satu: HIGH, MEDIUM, LOW]",
    "categories": [
      {
        "name": "Materialiti Kewangan",
        "level": "[MESTI salah satu: HIGH, MEDIUM, LOW]",
        "description": "Penerangan materialiti",
        "recommendations": ["Cadangan 1", "Cadangan 2"],
        "isOpen": false
      }
    ]
  },
  "auditSampling": {
    "overallLevel": "[MESTI salah satu: HIGH, MEDIUM, LOW]",
    "categories": [
      {
        "name": "Persampelan Rawak",
        "level": "[MESTI salah satu: HIGH, MEDIUM, LOW]",
        "description": "Penerangan kaedah persampelan",
        "recommendations": ["Cadangan 1", "Cadangan 2"],
        "isOpen": false
      }
    ]
  }
}

ARAHAN PENTING UNTUK LEJAR:
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
12. PENTING: Setiap row MESTI ada values untuk SEMUA columns yang didefinisikan

ARAHAN UNTUK PENILAIAN RISIKO:
1. Nilai tahap risiko keseluruhan MESTI salah satu dari: HIGH, MEDIUM, LOW
2. Kenal pasti sekurang-kurangnya 3 kategori risiko utama
3. Berikan cadangan yang spesifik untuk setiap kategori
4. Status MESTI salah satu dari: NEED ATTENTION, MONITORING, ACCEPTABLE
5. Level MESTI salah satu dari: HIGH, MEDIUM, LOW

ARAHAN UNTUK MATERIALITI:
1. Nilai tahap materialiti keseluruhan MESTI salah satu dari: HIGH, MEDIUM, LOW
2. Kenal pasti sekurang-kurangnya 2 kategori materialiti
3. Berikan cadangan yang spesifik untuk setiap kategori
4. Level MESTI salah satu dari: HIGH, MEDIUM, LOW

ARAHAN UNTUK PERSAMPELAN AUDIT:
1. Tahap persampelan audit keseluruhan MESTI salah satu dari: HIGH, MEDIUM, LOW
2. Kenal pasti sekurang-kurangnya 2 kategori persampelan
3. Berikan cadangan yang spesifik untuk setiap kategori
4. Level MESTI salah satu dari: HIGH, MEDIUM, LOW`;

  // Function to generate complete structure
  const generateLedgerStructure = async (supabase, groupId, jobId) => {
    try {
      await supabase
        .from("ledger_generation_jobs")
        .update({
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      const { data: groupData, error: groupError } = await supabase
        .from("statement_groups")
        .select(
          `
          *,
          organizations (
            name
          )
        `
        )
        .eq("id", groupId)
        .single();

      if (groupError) {
        throw new Error("Failed to fetch group data");
      }

      if (!groupData?.organizations?.name) {
        throw new Error("Organization data is missing or invalid");
      }

      const { data: statements, error: statementsError } = await supabase
        .from("statement_group_items")
        .select(
          `
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
        `
        )
        .eq("group_id", groupId);

      if (statementsError) {
        throw new Error("Failed to fetch statements");
      }

      if (!statements || statements.length === 0) {
        throw new Error("No statements found for processing");
      }

      const structuredData = {
        organization: groupData.organizations.name,
        statements: statements.map((stmt) => ({
          type: stmt.statement_type,
          entries: stmt.financial_statements?.financial_entries || [],
          year_current: stmt.financial_statements?.year_current,
          year_previous: stmt.financial_statements?.year_previous,
        })),
      };

      // Function to process entries for a specific type
      const processEntriesForType = (type, data) => {
        // Only include relevant entries and summarize data
        return {
          type,
          organization: groupData.organizations.name,
          year_current: data.year_current,
          year_previous: data.year_previous,
          entries: data.entries.map((entry) => ({
            section: entry.section,
            label: entry.label,
            amount_current: entry.amount_current,
            amount_previous: entry.amount_previous,
            is_total: entry.is_total,
          })),
        };
      };

      // Group and process statements by type
      const statementsByType = {};
      statements.forEach((stmt) => {
        if (stmt.statement_type) {
          statementsByType[stmt.statement_type] = {
            entries: stmt.financial_statements?.financial_entries || [],
            year_current: stmt.financial_statements?.year_current,
            year_previous: stmt.financial_statements?.year_previous,
          };
        }
      });

      console.log(
        "Structured data by type:",
        JSON.stringify(statementsByType, null, 2)
      );

      let attempts = 0;
      const maxAttempts = 3;
      let lastError = null;

      while (attempts < maxAttempts) {
        try {
          console.log(`Attempt ${attempts + 1} of ${maxAttempts}`);

          // Create messages array with system prompt
          const messages = [
            {
              role: "system",
              content: basePrompt,
            },
          ];

          // Add processed data for each type
          Object.entries(statementsByType).forEach(([type, data]) => {
            const processedData = processEntriesForType(type, data);
            messages.push({
              role: "user",
              content: `Sila jana struktur ${type}: ${JSON.stringify(
                processedData
              )}`,
            });
          });
          
          const { object: generatedStructure } = await generateObject({
            model: openai("gpt-4o-2024-08-06", {
              structuredOutputs: true,
            }),
            schema: completeSchema,
            schemaDescription:
              "Struktur lengkap lejar koperasi dengan penilaian risiko, materialiti, dan persampelan audit",
            messages: messages,
            temperature: 0.1,
            maxTokens: 16384,
            presencePenalty: 0,
            frequencyPenalty: 0,
            topP: 0.1,
          });

          // Transform the response after validation
          const completeStructure = transformResponse(generatedStructure);

          console.log(
            "Generated structure:",
            JSON.stringify(completeStructure, null, 2)
          );

          await supabase
            .from("ledger_generation_jobs")
            .update({
              status: "completed",
              result: completeStructure,
              updated_at: new Date().toISOString(),
            })
            .eq("id", jobId);

          return;
        } catch (error) {
          console.error(`Attempt ${attempts + 1} failed:`, error);
          lastError = error;
          attempts++;

          if (attempts < maxAttempts) {
            await new Promise((resolve) =>
              setTimeout(resolve, 2000 * attempts)
            );
          }
        }
      }

      throw new Error(sanitizeErrorMessage(lastError.message));
    } catch (error) {
      console.error("Generation Error:", error);

      await supabase
        .from("ledger_generation_jobs")
        .update({
          status: "failed",
          error: sanitizeErrorMessage(error.message),
          updated_at: new Date().toISOString(),
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

      // Check for existing processing job
      const { data: existingJobs, error: existingJobError } = await supabase
        .from("ledger_generation_jobs")
        .select("*")
        .eq("group_id", group_id)
        .in("status", ["pending", "processing"])
        .order("created_at", { ascending: false })
        .limit(1);

      if (existingJobError) {
        throw createError({
          statusCode: 500,
          message: sanitizeErrorMessage("Failed to check existing jobs"),
        });
      }

      // If there's an existing processing job, return it
      if (existingJobs && existingJobs.length > 0) {
        return {
          status: "success",
          message: "Generation already in progress",
          data: {
            job_id: existingJobs[0].id,
            status: existingJobs[0].status,
          },
        };
      }

      // If no existing job, create a new one
      const { data: job, error: jobError } = await supabase
        .from("ledger_generation_jobs")
        .insert({
          group_id: group_id,
          status: "pending",
        })
        .select()
        .single();

      if (jobError) {
        throw createError({
          statusCode: 500,
          message: sanitizeErrorMessage("Failed to create generation job"),
        });
      }

      generateLedgerStructure(supabase, group_id, job.id).catch((error) => {
        console.error("Background Generation Error:", error);
      });

      return {
        status: "success",
        message: "Generation started",
        data: {
          job_id: job.id,
          status: "pending",
        },
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
