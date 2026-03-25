const { cloudinary, hasCloudinaryConfig } = require('../config/cloudinary');
const User = require('../models/User');

const uploadBufferToCloudinary = (buffer, folder, resourceType = 'auto') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });

class DocumentService {
  static async getUserDocuments(userId) {
    const user = await User.findById(userId).select('travelDocuments');
    if (!user) {
      throw new Error('User not found');
    }

    return user.travelDocuments.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }

  static async uploadUserDocument(userId, file, metadata) {
    if (!hasCloudinaryConfig()) {
      throw new Error('Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Backend/.env.');
    }

    if (!file?.buffer) {
      throw new Error('Document file is required');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const uploadResult = await uploadBufferToCloudinary(file.buffer, 'voyager/travel-documents');
    const documentEntry = {
      documentType: metadata.documentType,
      label: metadata.label,
      fileName: file.originalname,
      mimeType: file.mimetype,
      cloudinaryResourceType: uploadResult.resource_type,
      fileSize: file.size,
      cloudinaryPublicId: uploadResult.public_id,
      secureUrl: uploadResult.secure_url,
      uploadedAt: new Date(),
    };

    user.travelDocuments.unshift(documentEntry);
    await user.save();

    return user.travelDocuments[0];
  }

  static async deleteUserDocument(userId, documentId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const document = user.travelDocuments.id(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    if (hasCloudinaryConfig() && document.cloudinaryPublicId) {
      const inferredResourceType = document.cloudinaryResourceType
        || (String(document.mimeType || '').startsWith('image/') ? 'image' : 'raw');
      await cloudinary.uploader.destroy(document.cloudinaryPublicId, { resource_type: inferredResourceType });
    }

    user.travelDocuments = user.travelDocuments.filter(
      (item) => String(item._id) !== String(documentId),
    );
    await user.save();
  }
}

module.exports = DocumentService;
