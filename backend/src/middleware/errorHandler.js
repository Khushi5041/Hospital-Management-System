export const errorHandler = (err, req, res, next) => {
  if (err.name === 'MulterError') {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be 2MB or smaller'
        : err.message || 'Upload failed';
    return res.status(400).json({ message: msg });
  }
  if (
    err.message === 'Only JPEG, PNG, GIF, or WebP images are allowed' ||
    err.message === 'Only PDF or JPEG/PNG/WebP images are allowed'
  ) {
    return res.status(400).json({ message: err.message });
  }
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
