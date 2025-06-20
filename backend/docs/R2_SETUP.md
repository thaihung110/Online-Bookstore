# Cloudflare R2 Image Upload Setup

This document explains how to configure Cloudflare R2 for book cover image uploads in the Online Bookstore application.

## Overview

The application uses Cloudflare R2 (S3-compatible storage) for storing and serving book cover images. The implementation uses presigned URLs for secure, direct uploads from the frontend to R2.

## Required Environment Variables

Add the following environment variables to your `.env` file in the backend directory:

```env
# Cloudflare R2 Configuration
CF_R2_ACCESS_KEY=your_r2_access_key_here
CF_R2_SECRET_KEY=your_r2_secret_key_here
CF_R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
CF_BUCKET_NAME=your_bucket_name
CF_R2_REGION=auto
```

## Getting R2 Credentials

### 1. Create R2 Bucket
1. Log in to your Cloudflare dashboard
2. Navigate to R2 Object Storage
3. Create a new bucket (e.g., `bookstore-images`)
4. Note the bucket name for `CF_BUCKET_NAME`

### 2. Generate API Token
1. Go to "Manage R2 API tokens"
2. Create a new API token with:
   - **Permissions**: Object Read & Write
   - **Bucket**: Select your created bucket
3. Copy the Access Key ID → `CF_R2_ACCESS_KEY`
4. Copy the Secret Access Key → `CF_R2_SECRET_KEY`

### 3. Get Endpoint URL
1. In your R2 dashboard, find your Account ID
2. The endpoint format is: `https://[ACCOUNT_ID].r2.cloudflarestorage.com`
3. Use this for `CF_R2_ENDPOINT`

## Image Upload Flow

### Backend Flow
1. **Presigned URL Generation**: Admin requests upload URL via `POST /admin/books/upload-presigned-url`
2. **Direct Upload**: Frontend uploads file directly to R2 using presigned URL
3. **Book Creation/Update**: Frontend saves book data with S3 key instead of file

### Frontend Flow
1. **File Selection**: User selects image file (shows local preview)
2. **Form Submission**: On save, upload image to R2 first
3. **Book Save**: Save book data with returned S3 key

### Image URL Processing
- **Google Books URLs**: Returned as-is (e.g., `https://books.google.com/...`)
- **S3 Keys**: Converted to presigned download URLs (e.g., `book-covers/123456-image.jpg`)
- **Empty/Invalid**: Fallback to `/placeholder-book.jpg`

## API Endpoints

### Upload Presigned URL
```http
POST /admin/books/upload-presigned-url
Content-Type: application/json

{
  "fileName": "book-cover.jpg",
  "contentType": "image/jpeg"
}
```

**Response:**
```json
{
  "uploadUrl": "https://bucket.r2.cloudflarestorage.com/book-covers/123456-book-cover.jpg?signature=...",
  "s3Key": "book-covers/123456-book-cover.jpg",
  "expiresIn": 300
}
```

## Supported File Types

- **JPEG**: `image/jpeg`
- **PNG**: `image/png`
- **WebP**: `image/webp`

## File Size Limits

- **Maximum file size**: 5MB
- **Recommended dimensions**: 800x1200 pixels (2:3 ratio)

## Security Features

- **Presigned URLs**: Temporary, secure upload URLs (5 minutes expiry)
- **Content Type Validation**: Only image files allowed
- **File Size Validation**: Frontend validates before upload
- **S3 Key Generation**: Unique keys with timestamp prefix

## Troubleshooting

### Common Issues

1. **"Failed to generate upload URL"**
   - Check R2 credentials in environment variables
   - Verify bucket exists and API token has correct permissions

2. **"Failed to upload file"**
   - Check file size (must be < 5MB)
   - Verify file type is supported image format
   - Ensure presigned URL hasn't expired

3. **Images not displaying**
   - Check if S3 keys are being processed correctly
   - Verify R2 bucket is accessible
   - Check browser console for CORS errors

### Testing Configuration

You can test your R2 configuration by:

1. Starting the backend server
2. Going to the admin panel
3. Creating/editing a book
4. Uploading an image file
5. Checking that the image displays correctly

## CORS Configuration

To allow frontend uploads to R2, you need to configure CORS on your bucket:

### Automatic Setup (Recommended)

```bash
# Run the CORS setup script
npm run setup-r2-cors
```

This script will:
- ✅ Check your current CORS configuration
- ✅ Apply the necessary CORS rules for frontend uploads
- ✅ Verify the configuration was applied correctly

### Manual Setup (Alternative)

If you prefer to set up CORS manually through the Cloudflare dashboard:

1. Go to your R2 bucket settings
2. Navigate to the CORS section
3. Add the following CORS rule:

```json
{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],
  "AllowedOrigins": ["*"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3000
}
```

## Migration Notes

- **Existing Google Books URLs**: Will continue to work as-is
- **New uploads**: Will use R2 storage with presigned URLs
- **Mixed environment**: Application handles both URL types seamlessly
