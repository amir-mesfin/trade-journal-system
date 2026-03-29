const fs = require('fs').promises;
const path = require('path');
const { uploadDir } = require('../middleware/upload');
const { configured, uploadMany, publicIdFromUrl, destroy } = require('./cloudinary');

async function filesToScreenshots(files) {
  if (!files?.length) return [];
  if (!configured()) {
    const err = new Error(
      'Image upload requires Cloudinary. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env'
    );
    err.statusCode = 503;
    throw err;
  }
  return uploadMany(files);
}

/** Persist shape: { url, publicId } or legacy string (local filename or full URL). */
function normalizeStoredShot(shot) {
  if (shot == null) return null;
  if (typeof shot === 'string') {
    if (shot.startsWith('http')) return { url: shot, publicId: null };
    return { url: shot, publicId: null, localName: shot };
  }
  if (typeof shot === 'object' && shot.url) return shot;
  return null;
}

async function removeStoredScreenshots(screenshots) {
  for (const raw of screenshots || []) {
    const shot = normalizeStoredShot(raw);
    if (!shot) continue;
    if (shot.publicId) {
      // eslint-disable-next-line no-await-in-loop
      await destroy(shot.publicId);
      continue;
    }
    if (shot.url?.startsWith('http') && shot.url.includes('res.cloudinary.com')) {
      const pid = publicIdFromUrl(shot.url);
      if (pid) {
        // eslint-disable-next-line no-await-in-loop
        await destroy(pid);
      }
      continue;
    }
    const name = shot.localName || (shot.url && !shot.url.startsWith('http') ? shot.url : null);
    if (name) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await fs.unlink(path.join(uploadDir, name));
      } catch {
        /* ignore */
      }
    }
  }
}

module.exports = {
  filesToScreenshots,
  normalizeStoredShot,
  removeStoredScreenshots,
};
