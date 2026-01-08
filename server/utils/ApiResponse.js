/**
 * Standard API Response
 * Usage:
 *  return res.status(200).json(new ApiResponse(true, "Message", data));
 */
class ApiResponse {
  /**
   * @param {boolean} success - Whether the request succeeded
   * @param {string} message - Human-readable message
   * @param {object|null} data - Optional payload
   */
  constructor(success, message, data = null) {
    this.success = success;
    this.message = message;
    if (data !== null) {
      this.data = data;
    }
  }
}

module.exports = ApiResponse;
