
export const validateFile = (file: File): string | null => {
  // File type validation
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return 'Please upload only JPEG, PNG, or WebP images';
  }

  // File size validation (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return 'Image size must be less than 5MB';
  }

  // File name validation
  if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
    return 'File name contains invalid characters';
  }

  return null;
};
