import axios from 'axios';

/**
 * Download a file from an authenticated API endpoint.
 * Uses axios so the JWT Authorization header is automatically included.
 *
 * @param {string} url        - API endpoint (e.g. /api/reports/:id/export/pdf)
 * @param {string} filename   - Suggested filename for the download
 */
export async function downloadFile(url, filename) {
  try {
    const response = await axios.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error('Download failed:', err);
    throw new Error(err.response?.data?.message || 'Download failed. Please try again.');
  }
}
