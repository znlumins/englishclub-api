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

  // B-14: untuk error tak terduga (terutama 500), jangan pantulkan pesan internal
  // (bocor nama tabel Prisma, stack trace, dll) ke client. Log tetap lengkap di
  // server; client hanya dapat pesan generik. Error yang SUDAH membawa status
  // HTTP eksplisit (400/403/404 dari controller) memang membawa pesan ramah user.
  const status = err.status || 500;
  const isInternal = status >= 500;

  res.status(status).json({
    success: false,
    error: {
      message: isInternal
        ? 'Terjadi kesalahan di server. Tim sudah diberi notifikasi, coba lagi nanti.'
        : err.message || 'Terjadi kesalahan'
    }
  });
};

// Wrap async handlers so we don't need try/catch everywhere
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
