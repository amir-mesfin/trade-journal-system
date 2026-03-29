const cloudinary = require('cloudinary').v2;

function configured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function configure() {
  if (!configured()) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function uploadImageBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'trade-journal/trades',
        resource_type: 'image',
      },
      (err, result) => {
        if (err) reject(err);
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

async function uploadMany(files) {
  const out = [];
  for (const file of files) {
    if (!file?.buffer) continue;
    // eslint-disable-next-line no-await-in-loop
    const meta = await uploadImageBuffer(file.buffer);
    out.push(meta);
  }
  return out;
}

/** Best-effort public_id from a Cloudinary HTTPS URL (legacy rows that only stored url string). */
function publicIdFromUrl(url) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return null;
  const idx = url.indexOf('/upload/');
  if (idx === -1) return null;
  let rest = url.slice(idx + '/upload/'.length);
  const parts = rest.split('/').filter(Boolean);
  while (parts.length && parts[0].includes(',')) parts.shift();
  if (parts.length && /^v\d+$/i.test(parts[0])) parts.shift();
  if (!parts.length) return null;
  const joined = parts.join('/');
  return joined.replace(/\.(jpe?g|png|gif|webp)$/i, '');
}

async function destroy(publicId) {
  if (!publicId || !configured()) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    /* ignore */
  }
}

module.exports = {
  configured,
  configure,
  uploadMany,
  publicIdFromUrl,
  destroy,
};
