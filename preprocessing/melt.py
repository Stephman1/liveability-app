import pandas as pd

# Read the CSV file
df = pd.read_csv('us_house_prices.csv')

# Melt the DataFrame to long format
df_long = df.melt(id_vars=["ZipCode"], var_name="Date", value_name="AvgPrice")

# Remove rows where 'Value' is NaN
df_long = df_long.dropna(subset=['AvgPrice'])

# Add a new column 'Type' with all values set to 'sale'
df_long['Type'] = 'sale'

# Save the transformed DataFrame to a new CSV file
df_long.to_csv('us_avg_house_prices.csv', index=False)
