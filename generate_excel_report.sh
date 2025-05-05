#!/bin/bash

# Change to the excel_generator directory
cd excel_generator

# Check if Python dependencies are installed
if ! python3 -c "import pandas, openpyxl" &> /dev/null; then
    echo "Installing required dependencies..."
    python3 -m pip install -r requirements.txt
fi

# Run the generator script
echo "Generating Excel report..."
python3 generate_excel.py

# Return to original directory
cd ..

echo "Done!" 