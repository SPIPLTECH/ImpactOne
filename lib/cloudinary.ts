import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadBase64(dataUrl: string, folder: string) {
  const res = await cloudinary.uploader.upload(dataUrl, {
    folder,
    resource_type: "image",
  });
  return res.secure_url;
}

export async function uploadVideoBuffer(buffer: Buffer, folder: string, filename: string) {
  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "video", public_id: filename },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export default cloudinary;
