import pandas as pd
import numpy as np
from datetime import datetime
import json
import os

def generate_transaction_data():
    # Define the transactions from the image
    transactions = [
        {
            "NO_TRANSAKSI": "100",
            "TARIKH_TRANSAKSI": "2025-01-14",
            "JENIS_TRANSAKSI": "Kredit",
            "AMAUN_RM": 5373.09,
            "TERDAPAT_ISU": "Tidak"
        },
        {
            "NO_TRANSAKSI": "103",
            "TARIKH_TRANSAKSI": "2025-02-24",
            "JENIS_TRANSAKSI": "Kredit",
            "AMAUN_RM": 6352.77,
            "TERDAPAT_ISU": "Tidak"
        },
        {
            "NO_TRANSAKSI": "102",
            "TARIKH_TRANSAKSI": "2025-04-27",
            "JENIS_TRANSAKSI": "Kredit",
            "AMAUN_RM": 4067.60,
            "TERDAPAT_ISU": "Tidak"
        },
        {
            "NO_TRANSAKSI": "104",
            "TARIKH_TRANSAKSI": "2025-05-09",
            "JENIS_TRANSAKSI": "Kredit",
            "AMAUN_RM": 7922.78,
            "TERDAPAT_ISU": "Tidak"
        },
        {
            "NO_TRANSAKSI": "101",
            "TARIKH_TRANSAKSI": "2025-08-16",
            "JENIS_TRANSAKSI": "Debit",
            "AMAUN_RM": 8509.87,
            "TERDAPAT_ISU": "Tidak"
        }
    ]
    
    return transactions

def create_excel_report(output_path='transaction_report.xlsx'):
    """
    Create an Excel report with transaction data.
    """
    # Get transaction data
    transactions = generate_transaction_data()
    
    # Convert to DataFrame
    df = pd.DataFrame(transactions)
    
    # Create Excel writer object
    writer = pd.ExcelWriter(output_path, engine='xlsxwriter')
    
    # Write DataFrame to Excel
    df.to_excel(writer, sheet_name='Transactions', index=False)
    
    # Get workbook and worksheet objects
    workbook = writer.book
    worksheet = writer.sheets['Transactions']
    
    # Define formats
    header_format = workbook.add_format({
        'bold': True,
        'bg_color': '#D9D9D9',
        'border': 1,
        'align': 'center',
        'valign': 'vcenter'
    })
    
    cell_format = workbook.add_format({
        'border': 1,
        'align': 'center',
        'valign': 'vcenter'
    })
    
    amount_format = workbook.add_format({
        'border': 1,
        'num_format': '#,##0.00',
        'align': 'right',
        'valign': 'vcenter'
    })
    
    # Set column widths
    worksheet.set_column('A:A', 15)  # NO_TRANSAKSI
    worksheet.set_column('B:B', 20)  # TARIKH_TRANSAKSI
    worksheet.set_column('C:C', 20)  # JENIS_TRANSAKSI
    worksheet.set_column('D:D', 15)  # AMAUN_RM
    worksheet.set_column('E:E', 15)  # TERDAPAT_ISU
    
    # Format headers
    for col_num, value in enumerate(df.columns.values):
        worksheet.write(0, col_num, value, header_format)
    
    # Format data cells
    for row_num in range(len(df)):
        worksheet.write(row_num + 1, 0, df.iloc[row_num, 0], cell_format)  # NO_TRANSAKSI
        worksheet.write(row_num + 1, 1, df.iloc[row_num, 1], cell_format)  # TARIKH_TRANSAKSI
        worksheet.write(row_num + 1, 2, df.iloc[row_num, 2], cell_format)  # JENIS_TRANSAKSI
        worksheet.write(row_num + 1, 3, df.iloc[row_num, 3], amount_format)  # AMAUN_RM
        worksheet.write(row_num + 1, 4, df.iloc[row_num, 4], cell_format)  # TERDAPAT_ISU
    
    # Add title
    title_format = workbook.add_format({
        'bold': True,
        'font_size': 14,
        'align': 'center',
        'valign': 'vcenter'
    })
    worksheet.merge_range('A1:E1', 'LAPORAN TRANSAKSI KEWANGAN', title_format)
    
    # Move the data down to make room for the title
    worksheet.write_row('A2', df.columns, header_format)
    for row_num in range(len(df)):
        for col_num in range(len(df.columns)):
            if col_num == 3:  # AMAUN_RM column
                worksheet.write(row_num + 2, col_num, df.iloc[row_num, col_num], amount_format)
            else:
                worksheet.write(row_num + 2, col_num, df.iloc[row_num, col_num], cell_format)
    
    # Save the Excel file
    writer.close()
    
    print(f"Excel report has been generated: {output_path}")

def main():
    # Create the output directory if it doesn't exist
    output_dir = 'output'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Generate the Excel report
    output_path = os.path.join(output_dir, 'transaction_report.xlsx')
    create_excel_report(output_path)

if __name__ == "__main__":
    main() 