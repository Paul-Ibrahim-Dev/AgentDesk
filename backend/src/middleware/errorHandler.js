export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found.' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  // Always log full detail server-side.
  // eslint-disable-next-line no-console
  console.error(`[error] ${req.method} ${req.originalUrl} ->`, err);

  // Never expose stack traces, DB errors, or API-key-related messages to clients.
  const safeMessage =
    status === 400 || status === 401 || status === 403 || status === 404
      ? err.message || 'Request could not be processed.'
      : 'Something went wrong on our end. Please try again shortly.';

  res.status(status).json({ error: safeMessage });
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
