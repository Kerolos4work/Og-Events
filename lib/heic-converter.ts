/**
 * Utility to convert HEIC/HEIF images to JPEG format
 * Uses heic2any library for client-side conversion
 */

export async function convertHeicToJpeg(file: File): Promise<File> {
  // Check if file is HEIC/HEIF
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    // Import heic2any dynamically to avoid SSR issues
    const heic2any = (await import('heic2any')).default;

    // Convert HEIC to JPEG blob
    const jpegBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.95 // 95% quality for JPEG compression
    });

    // Create a new File object with the JPEG blob
    const jpegFile = new File(
      [jpegBlob as Blob],
      file.name.replace(/\.(heic|heif)$/i, '.jpg'),
      { type: 'image/jpeg' }
    );

    return jpegFile;
  } catch (error) {
    throw new Error(
      `Failed to convert HEIC image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if a file is HEIC/HEIF format
 */
export function isHeicFile(file: File): boolean {
  const heicMimeTypes = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];
  const heicExtensions = ['.heic', '.heif'];

  const isMimeTypeHeic = heicMimeTypes.includes(file.type);
  const isExtensionHeic = heicExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

  return isMimeTypeHeic || isExtensionHeic;
}

/**
 * Get accepted file types for image upload
 */
export function getAcceptedImageTypes(): string {
  return 'image/*,.pdf';
}
