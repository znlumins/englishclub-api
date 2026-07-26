export const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err.stack || err.message || err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: { message: err.message }
    });
  }

  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      success: false,
      error: { message: 'Unauthorized' }
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error'
    }
  });
};

// Wrap async handlers so we don't need try/catch everywhere
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
