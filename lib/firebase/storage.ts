import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getFirebaseStorage, isFirebaseConfigured } from "./client";
import { validateReceiptFile } from "@/lib/validations";

/**
 * Compresses an image file on the client using HTML5 Canvas before upload.
 * Keeps free-tier storage consumption minimal (typically reduces 3-5MB camera
 * photos down to 60-140KB WebP/JPEG).
 */
export async function compressReceiptImage(
  file: File,
  options: { maxDimension?: number; quality?: number } = {}
): Promise<{ blob: Blob; dataUrl: string; contentType: string }> {
  const maxDimension = options.maxDimension ?? 1100;
  const quality = options.quality ?? 0.76;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read receipt image file."));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image file."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Browser canvas is unavailable for image compression."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const outputType = "image/webp";
        const compressedDataUrl = canvas.toDataURL(outputType, quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress receipt image."));
              return;
            }
            resolve({
              blob,
              dataUrl: compressedDataUrl,
              contentType: blob.type || outputType,
            });
          },
          outputType,
          quality
        );
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Validates, compresses, and uploads a receipt image to:
 *   `receipts/{messId}/{monthId}/{expenseId}`
 *
 * Includes an automatic compressed client-side fallback if the Firebase project
 * is running on a Spark (no-billing-card) tier without Cloud Storage provisioned.
 */
export async function uploadExpenseReceipt(params: {
  file: File;
  messId: string;
  monthId: string;
  expenseId: string;
}): Promise<string> {
  const { file, messId, monthId, expenseId } = params;

  const validation = validateReceiptFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid receipt file.");
  }

  // Compress image on the client before uploading
  const compressed = await compressReceiptImage(file, {
    maxDimension: 1000,
    quality: 0.75,
  });

  if (!isFirebaseConfigured) {
    // When running in local/Spark preview without Firebase Storage, return compact WebP data URL
    const sparkFallback = await compressReceiptImage(file, {
      maxDimension: 720,
      quality: 0.65,
    });
    return sparkFallback.dataUrl;
  }

  const storage = getFirebaseStorage();
  if (!storage) {
    const sparkFallback = await compressReceiptImage(file, {
      maxDimension: 720,
      quality: 0.65,
    });
    return sparkFallback.dataUrl;
  }

  const storagePath = `receipts/${messId}/${monthId}/${expenseId}`;
  const storageRef = ref(storage, storagePath);

  try {
    const uploadTask = await uploadBytes(storageRef, compressed.blob, {
      contentType: compressed.contentType,
      customMetadata: {
        messId,
        monthId,
        expenseId,
        originalName: file.name,
      },
    });
    return await getDownloadURL(uploadTask.ref);
  } catch {
    // Fallback for Firebase Spark accounts where Cloud Storage bucket isn't enabled
    const sparkFallback = await compressReceiptImage(file, {
      maxDimension: 720,
      quality: 0.62,
    });
    return sparkFallback.dataUrl;
  }
}

export async function deleteExpenseReceipt(params: {
  messId: string;
  monthId: string;
  expenseId: string;
  receiptUrl?: string | null;
}): Promise<void> {
  const { messId, monthId, expenseId, receiptUrl } = params;
  if (!receiptUrl || receiptUrl.startsWith("data:")) return;
  if (!isFirebaseConfigured) return;

  const storage = getFirebaseStorage();
  if (!storage) return;

  try {
    const storagePath = `receipts/${messId}/${monthId}/${expenseId}`;
    await deleteObject(ref(storage, storagePath));
  } catch {
    // Ignore if already deleted or stored as fallback
  }
}
