import pandas as pd

# Load the CSV files into DataFrames
life_expectancy_df = pd.read_csv('us_life_expectancy.csv', encoding='ISO-8859-1', dtype={'Census_Tract': str})
fips_df = pd.read_csv('fips-by-state.csv', encoding='ISO-8859-1', dtype={'fips': str})

# Ensure the Census Tract columns are in a consistent format for joining
life_expectancy_df['State'] = life_expectancy_df['State'].astype(str).str.strip()
life_expectancy_df['County'] = life_expectancy_df['County'].astype(str).str.strip()
fips_df['state'] = fips_df['state'].astype(str).str.strip()
fips_df['county'] = fips_df['county'].astype(str).str.strip()

# Merge the DataFrames on the State and County columns
merged_df = pd.merge(life_expectancy_df, fips_df, how='inner', left_on=['State', 'County'], right_on=['state', 'county'])

# Select the required columns
final_df = merged_df[['fips', 'Census_Tract', 'Life Expectancy', 'Life Expectancy Range', 'Life Expectancy Standard Error', 'County', 'State']].copy()

# Concatenate the fips and Census_Tract values to create a new column called CensusTract
final_df.loc[:, 'CensusTract'] = final_df['fips'].astype(str) + final_df['Census_Tract'].astype(str)

# Drop the fips and Census_Tract columns
final_df = final_df.drop(columns=['fips', 'Census_Tract'])

# Remove rows with missing values in the relevant columns
final_df = final_df.dropna(subset=['Life Expectancy'])

# Save the resulting DataFrame to a new CSV file
final_df.to_csv('merged_life_expectancy.csv', index=False)
