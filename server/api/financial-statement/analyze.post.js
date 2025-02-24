import { createClient } from "@supabase/supabase-js";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export default defineLazyEventHandler(async () => {
  const config = useRuntimeConfig();
  if (!config.openaiApiKey) throw new Error("Missing OpenAI API key");

  const openai = createOpenAI({
    apiKey: config.openaiApiKey,
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
        .select(`
          *,
          financial_entries (*)
        `)
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
- Format dan persembahan yang betul`;

      // Combine with reference content if exists
      const systemPrompt = referenceContent
        ? `${basePrompt}\n\nPanduan tambahan dari pengguna:\n${referenceContent}\n\n`
        : basePrompt;

      // Add response format instructions
      const fullPrompt = `${systemPrompt}\n\nBerikan respons dalam format JSON dengan struktur berikut:
{
  "total_major_issues": number,
  "total_minor_issues": number,
  "total_ralat_dokumen": number,
  "sections_requiring_revisions": "senarai nama bahagian yang dipisahkan dengan koma",
  "detailed_analysis": {
    "major_issues": ["senarai isu-isu major dalam Bahasa Melayu"],
    "minor_issues": ["senarai isu-isu minor dalam Bahasa Melayu"],
    "document_errors": ["senarai ralat dokumen dalam Bahasa Melayu"],
    "section_revisions": {
      "nama_bahagian": "penerangan keperluan semakan dalam Bahasa Melayu"
    }
  }
}

Pastikan semua teks dan penerangan diberikan dalam Bahasa Melayu yang formal dan profesional.`;

      console.log(fullPrompt);

      const result = streamText({
        model: openai("gpt-4"),
        messages: [
          {
            role: "system",
            content: fullPrompt,
          },
          {
            role: "user",
            content: `Please analyze this financial statement: ${JSON.stringify(
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
        stopSequences: ["```"],
        response_format: { type: "json_object" },
      });

      // Use the proper stream handling from the SDK
      const { textStream } = result;
      let fullResponse = "";

      for await (const chunk of textStream) {
        if (typeof chunk === "string") {
          fullResponse += chunk;
        }
      }

      try {
        // Parse and validate the response
        const analysis = JSON.parse(fullResponse);

        // Validate the required fields
        const requiredFields = [
          "total_major_issues",
          "total_minor_issues",
          "total_ralat_dokumen",
          "sections_requiring_revisions",
          "detailed_analysis",
        ];

        for (const field of requiredFields) {
          if (!(field in analysis)) {
            throw new Error(`Missing required field: ${field}`);
          }
        }

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
      } catch (parseError) {
        console.error(
          "Parse Error:",
          parseError,
          "Raw Response:",
          fullResponse
        );
        throw createError({
          statusCode: 500,
          message: "Failed to parse AI response",
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
