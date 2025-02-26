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

  // Define the analysis schema
  const analysisSchema = z.object({
    document_overview: z.array(z.object({
      issue_type: z.string(),
      issue_category: z.string(),
      issue_description: z.string(),
      expected_result: z.string(),
      correction_suggestion: z.string()
    })),
    summary: z.object({
      major_issues: z.number(),
      minor_issues: z.number(),
      document_revisions: z.number(),
      sections_needing_review: z.number(),
      sections_to_review: z.array(z.string())
    })
  });

  return defineEventHandler(async (event) => {
    try {
      const { statement_id } = await readBody(event);

      // Get financial statement data from Supabase
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

      // First fetch the financial statement and its entries
      const { data: statement, error: statementError } = await supabase
        .from("financial_statements")
        .select(
          `
          *,
          financial_entries (*)
        `
        )
        .eq("id", statement_id)
        .single();

      if (statementError) {
        throw createError({
          statusCode: 500,
          message: `Failed to fetch financial statement: ${statementError.message}`,
        });
      }

      // Then fetch the reference files separately
      const { data: referenceFiles, error: refError } = await supabase
        .from("reference_files")
        .select("*")
        .eq("statement_id", statement_id);

      if (refError) {
        console.error("Failed to fetch reference files:", refError);
        // Don't throw error, just continue without reference files
      } else {
        statement.reference_files = referenceFiles;
      }

      // Structure the data for analysis
      const structuredData = {
        statement_type: statement.statement_type,
        entries: statement.financial_entries.reduce((acc, entry) => {
          if (!acc[entry.section]) {
            acc[entry.section] = [];
          }
          acc[entry.section].push({
            label: entry.label,
            amount: entry.amount,
            is_total: entry.is_total,
          });
          return acc;
        }, {}),
      };

      // Get reference file content if it exists
      let referenceContent = null;
      if (statement.reference_files && statement.reference_files.length > 0) {
        const referenceFile = statement.reference_files[0];

        // Download the reference file content
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("financial-statements")
          .download(referenceFile.file_path);

        if (downloadError) {
          console.error("Reference File Download Error:", downloadError);
        } else {
          // Convert the downloaded blob to text
          referenceContent = await fileData.text();
        }
      }

      // Create the base prompt
      const basePrompt = `Anda adalah pakar audit kewangan. Sila analisis penyata kewangan ini dalam dua bahagian:

BAHAGIAN 1: GAMBARAN KESELURUHAN DOKUMEN
Senaraikan setiap isu yang ditemui dalam format berikut:
{
  "document_overview": [
    {
      "issue_type": "<Kecil Isu>",
      "issue_category": "<contoh: Data Tidak Lengkap, Ketidakkonsistenan Data>",
      "issue_description": "<Penerangan Isu - contoh: Nilai hilang di baris 5>",
      "expected_result": "<Hasil Yang Dijangka - contoh: Data kewangan lengkap di semua baris>",
      "correction_suggestion": "<Cadangan Pembetulan - contoh: Isi nilai yang hilang di baris 5>"
    }
  ],
  "summary": {
    "major_issues": <nombor isu utama>,
    "minor_issues": <nombor isu kecil>,
    "document_revisions": <nombor pembetulan dokumen>,
    "sections_needing_review": <nombor bahagian yang memerlukan semakan>,
    "sections_to_review": ["<nama bahagian 1>", "<nama bahagian 2>", ...]
  }
}

Pastikan:
1. Semua nombor adalah dalam format angka (bukan string)
2. Semua teks dalam Bahasa Melayu yang formal dan profesional
3. issue_type mesti salah satu dari: "Kecil Isu" atau "Isu Utama"
4. issue_category mesti deskriptif dan spesifik
5. Setiap isu mesti mempunyai penerangan yang jelas dan cadangan pembetulan yang praktikal`;

      // Combine with reference content if exists
      const systemPrompt = referenceContent
        ? `${basePrompt}\n\nPanduan tambahan dari pengguna:\n${referenceContent}\n\n`
        : basePrompt;

      try {
        const { object: analysis } = await generateObject({
          model: openai("gpt-4"),
          schema: analysisSchema,
          schemaDescription:
            "Analisis penyata kewangan yang mengandungi jumlah isu, senarai isu terperinci, dan keperluan semakan",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: `Sila analisis penyata kewangan ini: ${JSON.stringify(
                structuredData,
                null,
                2
              )}`,
            },
          ],
          temperature: 0.2,
          maxTokens: 2000,
          presencePenalty: 0,
          frequencyPenalty: 0,
          topP: 0.1,
        });

        // Store the analysis result in Supabase
        const { error: updateError } = await supabase
          .from("financial_statements")
          .update({
            analysis_result: analysis,
            updated_at: new Date().toISOString(),
          })
          .eq("id", statement_id);

        if (updateError) {
          console.error("Failed to store analysis:", updateError);
        }

        return {
          status: "success",
          data: analysis,
        };
      } catch (error) {
        console.error("Analysis Error:", error);
        throw createError({
          statusCode: 500,
          message: error.message || "Failed to analyze financial statement",
        });
      }
    } catch (error) {
      console.error("Analysis Error:", error);
      throw createError({
        statusCode: 500,
        message: error.message || "Failed to analyze financial statement",
      });
    }
  });
});
