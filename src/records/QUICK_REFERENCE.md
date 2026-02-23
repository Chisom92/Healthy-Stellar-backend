# Records API - Quick Reference

## Endpoint

```
GET /records
```

## Query Parameters

| Parameter | Type | Default | Range | Example |
|-----------|------|---------|-------|---------|
| page | number | 1 | ≥1 | `?page=2` |
| limit | number | 20 | 1-100 | `?limit=50` |
| recordType | enum | - | See below | `?recordType=LAB_RESULT` |
| patientId | string | - | - | `?patientId=patient-123` |
| fromDate | ISO 8601 | - | - | `?fromDate=2024-01-01T00:00:00Z` |
| toDate | ISO 8601 | - | - | `?toDate=2024-12-31T23:59:59Z` |
| sortBy | enum | createdAt | See below | `?sortBy=createdAt` |
| order | enum | desc | asc/desc | `?order=desc` |

## Record Types

- `MEDICAL_REPORT`
- `LAB_RESULT`
- `PRESCRIPTION`
- `IMAGING`
- `CONSULTATION`

## Sort Fields

- `createdAt` (default)
- `recordType`
- `patientId`

## Response Format

```json
{
  "data": [{ record objects }],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Quick Examples

```bash
# Default (first 20 records, newest first)
GET /records

# Page 2, 50 items
GET /records?page=2&limit=50

# Lab results only
GET /records?recordType=LAB_RESULT

# Patient's records
GET /records?patientId=patient-123

# Date range
GET /records?fromDate=2024-01-01T00:00:00Z&toDate=2024-12-31T23:59:59Z

# Oldest first
GET /records?sortBy=createdAt&order=asc

# Combined
GET /records?page=2&limit=50&recordType=PRESCRIPTION&sortBy=createdAt&order=desc
```

## Validation Rules

- ✅ page ≥ 1
- ✅ 1 ≤ limit ≤ 100
- ✅ recordType must be valid enum
- ✅ Dates must be ISO 8601
- ✅ sortBy must be valid field
- ✅ order must be asc or desc

## Error Response

```json
{
  "statusCode": 400,
  "message": ["validation error"],
  "error": "Bad Request"
}
```

## See Also

- [Complete Guide](./PAGINATION_GUIDE.md)
- [Implementation Summary](../../RECORDS_PAGINATION_IMPLEMENTATION.md)
