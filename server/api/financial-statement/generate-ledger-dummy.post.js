import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

export default defineLazyEventHandler(async () => {
  const config = useRuntimeConfig();
  if (!config.openaiApiKey) throw new Error("Missing OpenAI API key");

  const openai = createOpenAI({
    apiKey: config.openaiApiKey,
  });

  // Define the schema for the ledger structure
  const ledgerSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    columns: z.array(z.object({
      name: z.string(),
      subColumns: z.array(z.string())
    })),
    rows: z.array(z.object({
      code: z.string(),
      name: z.string(),
      type: z.enum(["header", "item"]),
      pic: z.string(),
      values: z.record(z.object({
        debit: z.number().or(z.string()),
        credit: z.number().or(z.string()),
        debitBg: z.boolean(),
        creditBg: z.boolean()
      }))
    }))
  });

  return defineEventHandler(async (event) => {
    try {
      // Sample data structure mimicking what we'd get from the database
      const dummyData = {
        organization: "KOPERASI ABC BERHAD",
        statements: [
          {
            type: "kunci_kira_kira",
            year_current: 2024,
            year_previous: 2023,
            entries: [
              {
                section: "Aset Tetap",
                label: "Nilai Buku Bersih - Tanah",
                amount_current: 54405,
                amount_previous: 50000,
                is_total: false,
                parent_section: "Aset Tetap",
                sort_order: 1
              },
              {
                section: "Aset Tetap",
                label: "Nilai Buku Bersih - Bangunan",
                amount_current: 33649,
                amount_previous: 30000,
                is_total: false,
                parent_section: "Aset Tetap",
                sort_order: 2
              }
            ]
          }
        ]
      };

      // Create the base prompt
      const basePrompt = `Anda adalah pakar akaun koperasi. Sila jana struktur lejar berdasarkan data kewangan yang diberikan.
Format yang diperlukan:
1. Tajuk menggunakan nama organisasi
2. Subtajuk dalam format "PENYATA KEWANGAN : 31 DISEMBER [TAHUN SEMASA]"
3. Lajur yang diperlukan:
   - AKAUN [TAHUN LEPAS]
   - DRAF [TAHUN SEMASA]
   - PELARASAN
   - IMBANGAN DUGA
   - AKAUN PERNIAGAAN
   - AK UI BUDI
   - AK PEMBAHAGIAN
   - KUNCI KIRA-KIRA
4. Setiap lajur mesti ada sub-lajur "DEBIT RM" dan "KREDIT RM"
5. Baris mesti:
   - Mempunyai kod bermula dengan 10000 untuk seksyen utama
   - Mempunyai kod +10 untuk setiap item
   - Type "header" untuk seksyen utama dan "item" untuk butiran
   - Nilai debit dan kredit untuk setiap lajur
   - Setiap nilai lajur mesti ada debitBg dan creditBg (boolean)

PENTING: 
1. Gunakan data amount_current untuk DRAF [TAHUN SEMASA]
2. Gunakan data amount_previous untuk AKAUN [TAHUN LEPAS]
3. Untuk lajur lain (PELARASAN, IMBANGAN DUGA, dll), jana nilai kosong ('')
4. Format nilai untuk setiap lajur mesti:
   {
     "debit": "",
     "credit": "",
     "debitBg": false,
     "creditBg": false
   }

Format nilai mesti:
{
  "title": "NAMA KOPERASI",
  "subtitle": "PENYATA KEWANGAN : 31 DISEMBER XXXX",
  "columns": [
    { "name": "AKAUN 20XX", "subColumns": ["DEBIT RM", "KREDIT RM"] },
    { "name": "DRAF 20XX", "subColumns": ["DEBIT RM", "KREDIT RM"] },
    { "name": "PELARASAN", "subColumns": ["DEBIT RM", "KREDIT RM"] },
    { "name": "IMBANGAN DUGA", "subColumns": ["DEBIT RM", "KREDIT RM"] },
    { "name": "AKAUN PERNIAGAAN", "subColumns": ["DEBIT RM", "KREDIT RM"] },
    { "name": "AK UI BUDI", "subColumns": ["DEBIT RM", "KREDIT RM"] },
    { "name": "AK PEMBAHAGIAN", "subColumns": ["DEBIT RM", "KREDIT RM"] },
    { "name": "KUNCI KIRA-KIRA", "subColumns": ["DEBIT RM", "KREDIT RM"] }
  ],
  "rows": [
    {
      "code": "10000",
      "name": "NAMA SEKSYEN",
      "type": "header",
      "pic": "",
      "values": {
        "AKAUN 20XX": { 
          "debit": "", 
          "credit": "", 
          "debitBg": false, 
          "creditBg": false 
        }
      }
    }
  ]
}`;

      try {
        console.log("=== DUMMY DATA ===");
        console.log(JSON.stringify(dummyData, null, 2));

        console.log("\n=== SCHEMA ===");
        console.log(JSON.stringify(ledgerSchema.shape, null, 2));

        console.log("\n=== BASE PROMPT ===");
        console.log(basePrompt);

        console.log("\n=== CALLING AI ===");
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
                dummyData,
                null,
                2
              )}`,
            },
          ],
          temperature: 0.2,
          maxTokens: 16384,
          presencePenalty: 0,
          frequencyPenalty: 0,
          topP: 0.1,
        });

        console.log("\n=== AI RESPONSE ===");
        console.log(JSON.stringify(ledgerStructure, null, 2));

        return {
          status: "success",
          data: ledgerStructure,
        };
      } catch (error) {
        console.error("\n=== AI ERROR ===");
        console.error("Error details:", error);
        console.error("Error message:", error.message);
        if (error.response) {
          console.error("API Response:", error.response);
        }
        throw createError({
          statusCode: 500,
          message: error.message || "Failed to generate ledger structure",
        });
      }
    } catch (error) {
      console.error("Generate Ledger Error:", error);
      throw createError({
        statusCode: error.statusCode || 500,
        message: error.message || "Failed to generate ledger structure",
      });
    }
  });
}); 