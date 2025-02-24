import ExcelJS from "exceljs";
import { getRequestHeaders, createError } from "h3";
import { createClient } from "@supabase/supabase-js";

const ENV = useRuntimeConfig();

// Verify environment variables
if (!ENV.public.supabaseUrl || !ENV.supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

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
    // Check content type
    const headers = getRequestHeaders(event);
    const contentType = headers["content-type"] || "";
    if (!contentType.includes("multipart/form-data")) {
      throw createError({
        statusCode: 400,
        message: "Invalid request. Expected multipart/form-data",
      });
    }

    // Read the multipart form data
    const formData = await readMultipartFormData(event);
    if (!formData || !formData.length) {
      throw createError({
        statusCode: 400,
        message: "No file uploaded",
      });
    }    

    // Find file and type from form data
    let statementFile = null;
    let referenceFile = null;
    let statementType = "kunci_kira_kira"; // default value

    for (const part of formData) {
      if (part.name === "statement_file" && part.filename) {
        statementFile = part;
      } else if (part.name === "reference_file" && part.filename) {
        referenceFile = part;
      } else if (part.name === "type") {
        statementType = part.data.toString().trim();
      }
    }

    // Validate statement file
    if (!statementFile) {
      throw createError({
        statusCode: 400,
        message: "No statement file found in form data",
      });
    }

    // Validate statement file format
    if (!statementFile.filename.match(/\.(xlsx|xls)$/i)) {
      throw createError({
        statusCode: 400,
        message: "Invalid statement file format. Please upload an Excel file",
      });
    }

    // Validate reference file if provided
    if (referenceFile && !referenceFile.filename.match(/\.(txt)$/i)) {
      throw createError({
        statusCode: 400,
        message: "Invalid reference file format. Please upload a text file",
      });
    }

    // Generate unique filenames
    const statementFileName = `${Date.now()}-${statementFile.filename}`;
    const statementFilePath = `${statementType}/${statementFileName}`;
    
    let referenceData = null;
    
    // Upload statement file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('financial-statements')
      .upload(statementFilePath, statementFile.data, {
        contentType: statementFile.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage Error:', uploadError);
      throw createError({
        statusCode: 500,
        message: `Failed to upload statement file: ${uploadError.message}`,
      });
    }

    // Get public URL for the uploaded statement file
    const { data: { publicUrl: statementPublicUrl } } = supabase
      .storage
      .from('financial-statements')
      .getPublicUrl(statementFilePath);

    // Handle reference file upload if provided
    if (referenceFile) {
      const referenceFileName = `${Date.now()}-${referenceFile.filename}`;
      const referenceFilePath = `references/${referenceFileName}`;

      const { data: refUploadData, error: refUploadError } = await supabase
        .storage
        .from('financial-statements')
        .upload(referenceFilePath, referenceFile.data, {
          contentType: 'text/plain',
          cacheControl: '3600',
          upsert: false
        });

      if (refUploadError) {
        console.error('Reference File Storage Error:', refUploadError);
        throw createError({
          statusCode: 500,
          message: `Failed to upload reference file: ${refUploadError.message}`,
        });
      }

      // Get public URL for the reference file
      const { data: { publicUrl: referencePublicUrl } } = supabase
        .storage
        .from('financial-statements')
        .getPublicUrl(referenceFilePath);

      // Create reference file record
      const { data: refData, error: refError } = await supabase
        .from('reference_files')
        .insert({
          file_name: referenceFileName,
          file_path: referenceFilePath,
          file_url: referencePublicUrl
        })
        .select()
        .single();

      if (refError) {
        console.error('Reference File DB Error:', refError);
        throw createError({
          statusCode: 500,
          message: `Failed to create reference file record: ${refError.message}`,
        });
      }

      referenceData = refData;
    }

    // Create the financial statement record
    const { data: statementData, error: statementError } = await supabase
      .from("financial_statements")
      .insert({
        file_name: statementFileName,
        file_path: statementFilePath,
        statement_type: statementType,
        status: 'draft',
        reference_file_id: referenceData?.id || null
      })
      .select()
      .single();

    if (statementError) {
      console.error('Supabase Error:', statementError);
      throw createError({
        statusCode: 500,
        message: `Failed to create financial statement record: ${statementError.message}`,
      });
    }

    // Update reference file with statement_id
    if (referenceData) {
      const { error: updateRefError } = await supabase
        .from('reference_files')
        .update({ statement_id: statementData.id })
        .eq('id', referenceData.id);

      if (updateRefError) {
        console.error('Reference Update Error:', updateRefError);
        // Non-blocking error, continue with the process
      }
    }

    // Read the Excel file using exceljs
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(statementFile.data);

    // Get the first worksheet
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw createError({
        statusCode: 400,
        message: "No worksheet found in the Excel file",
      });
    }

    // Convert to array of rows
    const rawData = [];
    worksheet.eachRow((row, rowNumber) => {
      rawData.push(row.values.slice(1));
    });

    // Skip the first row (headers) and process the data
    const data = rawData.slice(1);
    let currentSection = null;
    let sortOrder = 0;
    const entries = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row[0] || String(row[0]).trim() === "") continue;

      const label = String(row[0]).trim();
      const rawValue = row[1] !== null ? String(row[1]).trim() : "";
      sortOrder++;

      // Check if this is a main section (when value is '#')
      if (rawValue === "#") {
        currentSection = label;
        entries.push({
          statement_id: statementData.id,
          section: label,
          label: label,
          amount: null,
          is_total: false,
          parent_section: null,
          sort_order: sortOrder,
        });
        continue;
      }

      const value = parseNumericValue(rawValue);
      const isTotal = label.toLowerCase().startsWith("jumlah");

      // Add entry
      entries.push({
        statement_id: statementData.id,
        section: currentSection || "uncategorized",
        label: label,
        amount: value,
        is_total: isTotal,
        parent_section: currentSection,
        sort_order: sortOrder,
      });
    }

    // Insert all entries
    const { error: entriesError } = await supabase
      .from("financial_entries")
      .insert(entries);

    if (entriesError) {
      throw createError({
        statusCode: 500,
        message: "Failed to insert financial entries",
      });
    }

    return {
      status: "success",
      data: {
        statement_id: statementData.id,
        statement_file: {
          name: statementFileName,
          path: statementFilePath,
          url: statementPublicUrl
        },
        reference_file: referenceData ? {
          name: referenceData.file_name,
          path: referenceData.file_path,
          url: referenceData.file_url
        } : null,
        entries_count: entries.length,
      },
    };
  } catch (error) {
    console.log(error);

    // Handle other errors
    return {
      status: "error",
      message: error.message || "An error occurred while processing the file",
    };
  }
});

// Helper function to convert string to camelCase
function convertToCamelCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^[A-Z]/, (chr) => chr.toLowerCase());
}

// Helper function to parse numeric values
function parseNumericValue(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // Remove currency symbols, commas and convert to number
    return parseFloat(value.replace(/[^0-9.-]+/g, "")) || 0;
  }
  return 0;
}
