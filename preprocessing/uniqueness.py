import pandas as pd

# Load your data into a DataFrame
data = pd.read_csv('us_life_expectancy.csv')

# Remove rows where either 'State' or 'Census_Tract' is missing
filtered_data = data.dropna(subset=['State', 'Census_Tract'])

# Combine 'State' and 'Census_Tract' into a new column to check for uniqueness
filtered_data['State_CensusTract'] = filtered_data['State'] + '_' + filtered_data['Census_Tract'].astype(str)

# Check for duplicate combinations
duplicates = filtered_data[filtered_data.duplicated(['State', 'Census_Tract'], keep=False)]

# Output the results
if not duplicates.empty:
    print("There are duplicate combinations of State and Census_Tract:")
    print(duplicates)
else:
    print("All combinations of State and Census_Tract are unique.")
