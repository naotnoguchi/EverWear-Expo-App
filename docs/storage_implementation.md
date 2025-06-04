# Supabase Storage Implementation for ClothesManagerApp

This document describes the implementation of Supabase Storage for handling image uploads in the ClothesManagerApp.

## Overview

The implementation allows users to:
- Upload images from their device's gallery
- Take photos with their device's camera
- Store images securely in Supabase Storage
- View their uploaded images
- Delete images when deleting clothing items

## Implementation Components

### 1. Storage Client (`lib/storageClient.ts`)

The storage client provides an interface to interact with Supabase Storage. It includes:
- A basic client for public operations
- An authenticated client for secure operations
- Functions to get private URLs for images

### 2. Image Utilities (`lib/imageUtils.ts`)

Helper functions for image handling:
- File format detection and handling
- Image picking from gallery and camera
- Image uploading to Supabase
- Image deletion from Supabase

### 3. ClothingService Updates

The ClothingService has been updated to:
- Accept image URIs during item creation and updates
- Upload images to Supabase Storage
- Delete images when items are deleted or images are replaced

### 4. UI Components

The UI has been updated to:
- Allow users to select images from gallery or camera
- Display selected images before upload
- Show uploaded images in item details

## Setup Instructions

### 1. Install Required Packages

```bash
npm install @supabase/storage-js expo-image-picker expo-file-system
```

### 2. Create Storage Bucket in Supabase

1. Go to the Supabase dashboard
2. Navigate to Storage
3. Create a new bucket named `clothing-images`
4. Set the bucket to private

### 3. Apply Storage Policies

Apply the SQL policies from `db/storage_policies.sql` to secure the storage bucket:

1. Go to the SQL Editor in the Supabase dashboard
2. Copy and paste the contents of `storage_policies.sql`
3. Run the SQL statements

These policies ensure:
- Only authenticated users can upload, view, and delete images
- Users can only access images in their own folder
- Images are organized by user ID

## Usage

### Uploading Images

```typescript
// In a component
import { showImagePickerOptions } from '../lib/imageUtils';
import { useClothing } from '../contexts/ClothingContext';

// ...

const { addItem } = useClothing();
const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

const handleSelectImage = async () => {
  const uri = await showImagePickerOptions();
  if (uri) {
    setSelectedImageUri(uri);
  }
};

const handleAddItem = async () => {
  // Create item object
  const newItem = {
    // ... item properties
  };
  
  // Add item with image
  await addItem(newItem, selectedImageUri);
};
```

### Displaying Images

Images are automatically displayed in the item details and edit screens when available.

## Security Considerations

- All images are stored in user-specific folders
- Access control is enforced through Row-Level Security policies
- Only authenticated users can access their own images
- Images are accessed via signed URLs that expire