// Request timeout middleware
export const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(408).json({ error: 'Request timeout' });
      }
    });
    next();
  };
};

// Different timeouts for different endpoints
export const authTimeout = requestTimeout(10000); // 10 seconds for auth
export const apiTimeout = requestTimeout(30000); // 30 seconds for API
export const uploadTimeout = requestTimeout(300000); // 5 minutes for uploads
export const processingTimeout = requestTimeout(600000); // 10 minutes for processing

