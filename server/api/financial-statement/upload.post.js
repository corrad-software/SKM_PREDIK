import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";
import { CONSTANTS } from "~/server/utils/constants";
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

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

// Helper function to save base64 to temp file
const saveBase64ToTemp = async (base64Data, extension) => {
  const tempDir = os.tmpdir();
  const fileName = `${uuidv4()}.${extension}`;
  const filePath = path.join(tempDir, fileName);
  
  // Remove data:application/... prefix if present
  const base64Content = base64Data.split(';base64,').pop();
  const buffer = Buffer.from(base64Content, 'base64');
  
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
};

// Helper function to clean up temp files
const cleanupTempFiles = async (files) => {
  for (const file of files) {
    try {
      await fs.promises.unlink(file);
    } catch (error) {
      console.error(`Error deleting temp file ${file}:`, error);
    }
  }
};

// Helper function to parse numeric values
function parseNumericValue(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // Remove currency symbols, commas and convert to number
    return parseFloat(value.replace(/[^0-9.-]+/g, "")) || 0;
  }
  return 0;
}

// Add helper function to extract year from date string
function extractYear(dateString) {
  if (!dateString) return null;
  // Handle both full date strings and year strings
  const year = new Date(dateString).getFullYear();
  return isNaN(year) ? null : year;
}

// Add statement type validation
const VALID_STATEMENT_TYPES = {
  'kunci_kira_kira': 'kunci_kira_kira',
  'imbangan_duga': 'imbangan_duga',
  'ledger': 'ledger',
  'bank_reconciliation': 'bank_reconciliation'
};

function validateStatementType(type) {
  const validType = VALID_STATEMENT_TYPES[type];
  if (!validType) {
    throw createError({
      statusCode: 400,
      message: `Invalid statement type. Must be one of: ${Object.keys(VALID_STATEMENT_TYPES).join(', ')}`
    });
  }
  return validType;
}

export default defineEventHandler(async (event) => {
  console.log('🚀 API Called: /api/financial-statement/upload');
  const tempFiles = []; // Track temp files for cleanup

  try {
    // Read the request body
    const body = await readBody(event);
    
    // Validate statement type first
    const validatedType = validateStatementType(body.type);
    
    // Convert date strings to years before processing
    const yearCurrent = extractYear(body.year_current);
    const yearPrevious = extractYear(body.year_previous);

    if (!yearCurrent || !yearPrevious) {
      throw createError({
        statusCode: 400,
        message: "Invalid year format provided"
      });
    }

    // Validate required fields
    const requiredFields = [
      'type',
      'organization_id',
      'state',
      'audited_by',
      'reviewed_by',
      'statement_file'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        console.log('❌ Validation failed: Missing required field:', field);
        throw createError({
          statusCode: 400,
          message: `Missing required field: ${field}`
        });
      }
    }

    // Check if a statement of this type already exists for this organization
    const { data: existingStatement, error: existingError } = await supabase
      .from('financial_statements')
      .select('id')
      .eq('organization_id', body.organization_id)
      .eq('statement_type', validatedType)
      .single();

    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking existing statement:', existingError);
      throw createError({
        statusCode: 500,
        message: 'Error checking existing statement'
      });
    }

    // Save files to temp directory
    console.log('💾 Saving statement file to temp directory');
    const statementTempPath = await saveBase64ToTemp(body.statement_file, 'xlsx');
    tempFiles.push(statementTempPath);
    console.log('✅ Statement file saved to:', statementTempPath);

    let referenceTempPath = null;
    if (body.reference_file) {
      console.log('💾 Saving reference file to temp directory');
      referenceTempPath = await saveBase64ToTemp(body.reference_file, 'txt');
      tempFiles.push(referenceTempPath);
      console.log('✅ Reference file saved to:', referenceTempPath);
    }

    // Generate unique filenames for storage
    const statementFileName = `${Date.now()}-statement.xlsx`;
    const statementFilePath = `${validatedType}/${statementFileName}`;
    console.log('📝 Generated statement file path:', statementFilePath);
    
    let referenceData = null;
    
    // Upload statement file to Supabase Storage
    console.log('⬆️ Uploading statement file to Supabase');
    const statementFileBuffer = await fs.promises.readFile(statementTempPath);
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('financial-statements')
      .upload(statementFilePath, statementFileBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Storage Error:', uploadError);
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
    if (referenceTempPath) {
      const referenceFileName = `${Date.now()}-reference.txt`;
      const referenceFilePath = `references/${referenceFileName}`;
      const referenceFileBuffer = await fs.promises.readFile(referenceTempPath);

      const { data: refUploadData, error: refUploadError } = await supabase
        .storage
        .from('financial-statements')
        .upload(referenceFilePath, referenceFileBuffer, {
          contentType: 'text/plain',
          cacheControl: '3600',
          upsert: true
        });

      if (refUploadError) {
        console.error('Reference File Storage Error:', refUploadError);
        throw createError({
          statusCode: 500,
          message: `Failed to upload reference file: ${refUploadError.message}`,
        });
      }

      // Create or update reference file record
      const { data: refData, error: refError } = await supabase
        .from('reference_files')
        .upsert({
          id: existingStatement?.reference_file_id,
          file_name: referenceFileName,
          file_path: referenceFilePath,
          file_url: refUploadData.publicUrl
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

    // Create or update the financial statement record
    const statementData = {
      file_name: statementFileName,
      file_path: statementFilePath,
      statement_type: validatedType,
      status: 'draft',
      organization_id: body.organization_id,
      created_by: CONSTANTS.DEFAULT_USER_ID,
      reference_file_id: referenceData?.id || null,
      state: body.state,
      year_current: yearCurrent,
      year_previous: yearPrevious,
      audited_by: body.audited_by,
      reviewed_by: body.reviewed_by
    };

    if (existingStatement) {
      // Update existing record
      const { data: updatedStatement, error: updateError } = await supabase
        .from('financial_statements')
        .update(statementData)
        .eq('id', existingStatement.id)
        .select()
        .single();

      if (updateError) {
        throw createError({
          statusCode: 500,
          message: `Failed to update financial statement record: ${updateError.message}`,
        });
      }

      // Delete old entries
      await supabase
        .from('financial_entries')
        .delete()
        .eq('statement_id', existingStatement.id);

      statementData.id = existingStatement.id;
    } else {
      // Create new record
      const { data: newStatement, error: insertError } = await supabase
        .from('financial_statements')
        .insert(statementData)
        .select()
        .single();

      if (insertError) {
        throw createError({
          statusCode: 500,
          message: `Failed to create financial statement record: ${insertError.message}`,
        });
      }

      statementData.id = newStatement.id;
    }

    // Read the Excel file using exceljs
    console.log('📊 Starting Excel file processing');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(statementTempPath);
    console.log('✅ Excel file loaded successfully');

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

    // Insert new entries
    const { error: entriesError } = await supabase
      .from('financial_entries')
      .insert(entries);

    if (entriesError) {
      console.error('❌ Failed to insert entries:', entriesError);
      throw createError({
        statusCode: 500,
        message: "Failed to insert financial entries",
      });
    }

    // Clean up temp files
    console.log('🧹 Cleaning up temporary files');
    await cleanupTempFiles(tempFiles);

    console.log('🎉 Upload process completed successfully');
    return {
      status: "success",
      data: {
        statement_id: statementData.id,
        organization_id: body.organization_id,
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
    // Clean up temp files in case of error
    console.error('❌ Error occurred during upload process:', error);
    await cleanupTempFiles(tempFiles);
    
    return {
      status: "error",
      message: error.message || "An error occurred while processing the file",
    };
  }
});
