// Client-side (browser) direct upload to Cloudinary using an UNSIGNED upload preset.
// This bypasses the Vercel serverless function entirely for large files (videos),
// which fixes FUNCTION_PAYLOAD_TOO_LARGE. Only the resulting Cloudinary URL is
// later sent to our Next.js API route.
//
// Requires these env vars (safe to expose to the browser, that's what NEXT_PUBLIC_ is for):
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
//   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET  (an UNSIGNED preset created in Cloudinary dashboard)

export async function uploadToCloudinaryDirect(
  blob: Blob,
  resourceType: "video" | "image",
  folder: string,
  publicId?: string
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary direct upload is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
    );
  }

  const form = new FormData();
  form.append("file", blob);
  form.append("upload_preset", uploadPreset);
  form.append("folder", folder);
  if (publicId) form.append("public_id", publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: form }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Cloudinary upload failed");
  }
  return data.secure_url as string;
}
