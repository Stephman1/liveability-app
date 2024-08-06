import pandas as pd

# Read the CSV file
df = pd.read_csv('us_avg_property_prices.csv')

# Format 'AvgPrice' to always have two decimal places
df['AvgPrice'] = df['AvgPrice'].apply(lambda x: f"{x:.2f}")

# Save the transformed DataFrame to a new CSV file
df.to_csv('formatted_us_avg_property_prices.csv', index=False)
