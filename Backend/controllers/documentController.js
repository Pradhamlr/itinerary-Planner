const DocumentService = require('../services/documentService');

exports.getDocuments = async (req, res) => {
  try {
    const documents = await DocumentService.getUserDocuments(req.user.userId);
    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch documents',
    });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const { documentType, label } = req.body;

    if (!documentType || !label?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Document type and label are required',
      });
    }

    const document = await DocumentService.uploadUserDocument(req.user.userId, req.file, {
      documentType,
      label: label.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document,
    });
  } catch (error) {
    const statusCode = error.message?.includes('configured') ? 503 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to upload document',
    });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    await DocumentService.deleteUserDocument(req.user.userId, req.params.documentId);
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    const statusCode = error.message === 'Document not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete document',
    });
  }
};
