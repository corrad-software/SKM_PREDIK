import ExcelJS from "exceljs";
import { getRequestHeaders, createError } from "h3";
import { createClient } from "@supabase/supabase-js";
import { CONSTANTS } from "~/server/utils/constants";

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

    // Find file, type and organization_id from form data
    let statementFile = null;
    let referenceFile = null;
    let statementType = "kunci_kira_kira"; // default value
    let organizationId = null;
    let yearCurrent = null;
    let yearPrevious = null;
    let state = null;
    let auditedBy = null;
    let reviewedBy = null;

    for (const part of formData) {
      if (part.name === "statement_file" && part.filename) {
        statementFile = part;
      } else if (part.name === "reference_file" && part.filename) {
        referenceFile = part;
      } else if (part.name === "type") {
        statementType = part.data.toString().trim();
      } else if (part.name === "organization_id") {
        organizationId = part.data.toString().trim();
      } else if (part.name === "year_current") {
        yearCurrent = parseInt(part.data.toString().trim());
      } else if (part.name === "year_previous") {
        yearPrevious = parseInt(part.data.toString().trim());
      } else if (part.name === "state") {
        state = part.data.toString().trim();
      } else if (part.name === "audited_by") {
        auditedBy = part.data.toString().trim();
      } else if (part.name === "reviewed_by") {
        reviewedBy = part.data.toString().trim();
      }
    }

    // Validate required fields
    if (!organizationId) {
      throw createError({
        statusCode: 400,
        message: "Organization ID is required",
      });
    }

    if (!yearCurrent || !yearPrevious) {
      throw createError({
        statusCode: 400,
        message: "Both current year and previous year are required",
      });
    }

    // Verify organization exists and user has access
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, organization_type')
      .eq('id', organizationId)
      .eq('created_by', CONSTANTS.DEFAULT_USER_ID)
      .single();

    if (orgError || !organization) {
      throw createError({
        statusCode: 404,
        message: "Organization not found or access denied",
      });
    }

    // Verify organization is of type 'child'
    if (organization.organization_type !== CONSTANTS.ORGANIZATION_TYPE.CHILD) {
      throw createError({
        statusCode: 400,
        message: "Financial statements can only be uploaded for child organizations",
      });
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
        organization_id: organizationId,
        created_by: CONSTANTS.DEFAULT_USER_ID,
        reference_file_id: referenceData?.id || null,
        state: state,
        year_current: yearCurrent,
        year_previous: yearPrevious,
        audited_by: auditedBy,
        reviewed_by: reviewedBy
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
      // Get values from columns A, B, and C
      const values = [
        row.getCell(1).value, // Column A - Label
        row.getCell(2).value, // Column B - Previous year amount
        row.getCell(3).value  // Column C - Current year amount
      ];
      rawData.push(values);
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
      const previousYearValue = row[1] !== null ? String(row[1]).trim() : "";
      const currentYearValue = row[2] !== null ? String(row[2]).trim() : "";
      sortOrder++;

      // Check if this is a main section (when value is '#')
      if (previousYearValue === "#" || currentYearValue === "#") {
        currentSection = label;
        entries.push({
          statement_id: statementData.id,
          section: label,
          label: label,
          amount_current: null,
          amount_previous: null,
          year_current: yearCurrent,
          year_previous: yearPrevious,
          is_total: false,
          parent_section: null,
          sort_order: sortOrder,
        });
        continue;
      }

      const previousValue = parseNumericValue(previousYearValue);
      const currentValue = parseNumericValue(currentYearValue);
      const isTotal = label.toLowerCase().startsWith("jumlah");

      // Add entry
      entries.push({
        statement_id: statementData.id,
        section: currentSection || "uncategorized",
        label: label,
        amount_current: currentValue,
        amount_previous: previousValue,
        year_current: yearCurrent,
        year_previous: yearPrevious,
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
        organization_id: organizationId,
        year_current: yearCurrent,
        year_previous: yearPrevious,
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
