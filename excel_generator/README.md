# Excel Generator for Financial Reports

This folder contains scripts to generate Excel files from financial data in JSON format.

## Files

- `generate_excel.py` - The main Python script that converts JSON to Excel
- `requirements.txt` - List of Python dependencies required by the script

## Usage

1. Install the dependencies:
```bash
python3 -m pip install -r requirements.txt
```

2. Run the generator:
```bash
python3 generate_excel.py
```

This will create a `financial_report.xlsx` file in this directory, based on the JSON data in `pages/ahli-kooperasi/ledger-review/LEDGER.json`.

## Output

The generated Excel file will contain four sheets:
- Ledger - Financial data with all columns from the JSON
- Materiality - Materiality assessment data
- Audit Sampling - Audit sampling information
- Risk Assessment - Risk assessment details

## Customization

To change the source JSON file or output location, modify the paths in the `main()` function of `generate_excel.py`. 