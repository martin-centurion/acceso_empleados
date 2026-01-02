const app = require('../server/src/app');

module.exports = (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const forwardedPath = url.searchParams.get('path');

  if (forwardedPath !== null) {
    url.searchParams.delete('path');
    const query = url.searchParams.toString();
    req.url = `/api/${forwardedPath}${query ? `?${query}` : ''}`;
  }

  return app(req, res);
};
