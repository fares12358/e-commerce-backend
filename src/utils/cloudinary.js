import cloudinary from '../config/cloudinary.js';
import sharp from 'sharp';

/* ================= UPLOAD IMAGE (WEBP + COMPRESS) ================= */
export const uploadImage = async (file, folder) => {
  if (!file) return null;

  // Convert to webp + compress
  const buffer = await sharp(file.buffer)
    .resize(800) // max width (auto height)
    .webp({ quality: 80 }) // compression
    .toBuffer();

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        format: 'webp'
      },
      (error, result) => {
        if (error) return reject(error);

        resolve({
          url: result.secure_url,
          public_id: result.public_id
        });
      }
    ).end(buffer);
  });
};

/* ================= DELETE IMAGE ================= */
export const deleteImage = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};

/* ================= UPDATE IMAGE ================= */
export const updateImage = async (oldPublicId, newFile, folder) => {
  if (!newFile) return null;

  if (oldPublicId) {
    await deleteImage(oldPublicId);
  }

  return await uploadImage(newFile, folder);
};
