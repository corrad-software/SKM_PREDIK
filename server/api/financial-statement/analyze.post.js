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
    total_major_issues: z.number(),
    total_minor_issues: z.number(),
    total_ralat_dokumen: z.number(),
    sections_requiring_revisions: z.string(),
    detailed_analysis: z.object({
      major_issues: z.array(z.string()),
      minor_issues: z.array(z.string()),
      document_errors: z.array(z.string()),
      section_revisions: z.record(z.string()),
    }),
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
      const basePrompt = `Anda adalah pakar audit kewangan. Sila analisis penyata kewangan ini dan berikan:
1. Isu-isu major (masalah kritikal yang memerlukan perhatian segera)
2. Isu-isu minor (masalah kurang kritikal yang perlu ditangani)
3. Ralat dokumen (isu-isu format atau persembahan)
4. Bahagian yang memerlukan semakan

Fokus pada:
- Ketepatan matematik
- Pengkategorian yang betul
- Kelengkapan bahagian
- Baki dan penyesuaian
- Format dan persembahan yang betul

PENTING: Anda mesti memberikan respons dalam format yang tepat seperti berikut:
{
  "total_major_issues": <nombor isu major>,
  "total_minor_issues": <nombor isu minor>,
  "total_ralat_dokumen": <nombor ralat dokumen>,
  "sections_requiring_revisions": "<senarai nama bahagian yang dipisahkan dengan koma>",
  "detailed_analysis": {
    "major_issues": ["<isu major 1>", "<isu major 2>", ...],
    "minor_issues": ["<isu minor 1>", "<isu minor 2>", ...],
    "document_errors": ["<ralat 1>", "<ralat 2>", ...],
    "section_revisions": {
      "<nama_bahagian>": "<penerangan keperluan semakan>"
    }
  }
}

Pastikan:
1. Semua nombor adalah dalam format angka (bukan string)
2. sections_requiring_revisions adalah string dengan nama bahagian dipisahkan koma
3. Semua array mengandungi string
4. section_revisions adalah objek dengan kunci nama bahagian dan nilai penerangan
5. Semua teks dalam Bahasa Melayu yang formal dan profesional`;

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
