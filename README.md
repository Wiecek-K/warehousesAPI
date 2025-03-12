# Warehouse API Documentation

## Quick Start Commands

Below are the commands available to manage the Warehouse API system:

```bash
# Development server
npm run dev               # Start the development server with auto-reload

# Data fetching commands
npm run fetch:molos       # Fetch XML data from Molos warehouse
npm run fetch:action      # Fetch CSV data from Action warehouse
npm run fetch:apilo       # Fetch JSON data from Apilo warehouse

# Data parsing commands
npm run parse:molos       # Parse Molos XML data to JSON
npm run parse:action      # Parse Action CSV data to JSON
npm run parse:apilo       # Parse Apilo JSON data to structured format
npm run parse:all         # Parse and combine data from all warehouses

# Server commands
npm run server            # Start the API server
npm run build             # Build the application for production
npm run start             # Start the production server
```

## Project Overview

The Warehouse API is a system designed to aggregate product inventory data from multiple warehouse sources and provide a unified API for accessing this data. It handles different data formats (XML, CSV, JSON) and transforms them into a standardized JSON format.

### Key Features

- Fetches data from three warehouse systems (Molos, Action, Apilo)
- Processes data from different formats into a standardized structure
- Provides a RESTful API for querying product information
- Supports filtering products by EAN codes
- Maintains timestamps of data updates

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Molos Source   │     │  Action Source  │     │  Apilo Source   │
│    (XML Data)   │     │   (CSV Data)    │     │   (JSON Data)   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  fetchMolos.ts  │     │ fetchAction.ts  │     │  fetchApilo.ts  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  parseMolos.ts  │     │ parseAction.ts  │     │  parseApilo.ts  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────┬───────────────────────┬───────┘
                         │                       │
                         ▼                       ▼
                ┌─────────────────┐     ┌─────────────────┐
                │ parseAllStocks  │────►│  all-stocks.json│
                └────────┬────────┘     └─────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │    server.ts    │
                └─────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │      REST API   │
                └─────────────────┘
```

## Data Flow

1. **Data Fetching**:

   - Raw data is fetched from external warehouse APIs or file sources
   - Data is saved in source format (XML/CSV/JSON) with a timestamp
   - Files are stored in `src/data/warehouses/{source}/`

2. **Data Parsing**:

   - Each source's data is parsed into a common format
   - Data is validated and errors are handled
   - Processed files are saved in `src/data/processed/`

3. **Data Aggregation**:

   - All parsed data is combined into a single dataset
   - Stored as `all-stocks.json` for API consumption

4. **API Serving**:
   - Express server provides endpoints to query the data
   - Clients can filter products by EAN codes

## Data Structure

All warehouse data is standardized to the following structure:

```typescript
interface WarehouseItem {
  ean: string; // European Article Number (barcode)
  name: string; // Product name
  quantity: number; // Available stock
  priceNet: number; // Net price
  priceGross?: number; // Gross price (including VAT)
  vat: number; // VAT rate as decimal (e.g., 0.23 for 23%)
  source: string; // Warehouse source ("Molos", "Action", or "Apilo")
}
```

## API Endpoints

### `GET /productByEan`

Retrieves a single product matching the provided EAN code.

**Request URL**:

```
GET /productByEan?ean=1234567890123
```

**Response**:

```json
{
  "product": {
    "ean": "1234567890123",
    "name": "Product Name",
    "quantity": 42,
    "priceNet": 10.99,
    "priceGross": 13.52,
    "vat": 0.23,
    "source": "Molos"
  }
}
```

**Error Responses**:

- `400 Bad Request`: When no EAN parameter is provided

  ```json
  {
    "error": "Invalid request. Please provide an EAN number as a query parameter."
  }
  ```

- `404 Not Found`: When no product with the specified EAN exists
  ```json
  {
    "error": "Product with EAN 1234567890123 not found."
  }
  ```

### `POST /productsByEan`

Retrieves products matching the provided EAN codes.

**Request Body**:

```json
{
  "eans": ["1234567890123", "3456789012345"]
}
```

**Response**:

```json
{
  "products": [
    {
      "ean": "1234567890123",
      "name": "Product Name",
      "quantity": 42,
      "priceNet": 10.99,
      "priceGross": 13.52,
      "vat": 0.23,
      "source": "Molos"
    }
    // ...more products
  ],
  "total": 2
}
```

## Configuration

The application uses environment variables for configuration. Create a `.env` file with the following variables:

```
PORT=3000
MOLOS_WAREHOUSE_XML_URL=https://example.com/molos-feed.xml
ACTION_WAREHOUSE_CSV_URL=https://example.com/action-feed.csv
APILO_API_URL=https://example.com/apilo/api
APILO_ACCESS_TOKEN=your_api_token
```

## Development Guide

### Project Structure

```
/src
  /data
    /warehouses       # Raw data storage
      /molos
      /action
      /apilo
    /processed        # Processed JSON data
  /scripts            # Data fetching and processing scripts
  /types              # TypeScript type definitions
  server.ts           # Express API server
/dist                 # Compiled JavaScript
```

### Error Handling and Logging

The application uses a standardized logging format with emoji prefixes:

- `ℹ️` Information messages
- `✓` Success messages
- `⚠️` Warning messages
- `❌` Error messages

Example log patterns:

```
ℹ️ Started fetching data from [source]
✓ Successfully fetched data
⚠️ Found errors in the data
❌ Error fetching [source] data
```

## Troubleshooting

If you encounter issues:

1. Check the `.env` file for correct API endpoints and credentials
2. Verify network connectivity to the warehouse data sources
3. Examine the logs for specific error messages
4. Ensure the appropriate directories exist and are writable

## Future Enhancements

- Add authentication/authorization to the API
- Implement caching for improved performance
- Add more filtering options (by price, name, source)
- Create a web interface for data visualization
- Add scheduled updates through cron jobs
