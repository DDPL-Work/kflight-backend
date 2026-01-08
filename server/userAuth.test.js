const jwt = require("jsonwebtoken");
const Redis = require("ioredis");
const userAuth = require("../userAuth");

// Mock dependencies
jest.mock("jsonwebtoken");

// Mock the ioredis library.
// This mock replaces the Redis constructor with a mock function that returns an object
// with a mock `get` method. We also expose the `get` mock to control it in tests.
jest.mock("ioredis", () => {
  const get = jest.fn();
  const Redis = jest.fn(() => ({
    get,
  }));
  Redis.get = get; // Expose the mock function for test setup
  return Redis;
});

describe("userAuth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks and mock Express objects before each test
    jest.clearAllMocks();

    req = {
      headers: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    // Set the required environment variable for the middleware
    process.env.SECRET_KEY = "test-secret-key";
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.SECRET_KEY;
  });

  it("should call next() and set req.user for a valid token", async () => {
    const token = "valid-token";
    const decodedPayload = { id: "user123", email: "test@example.com" };
    req.headers["authorization"] = `Bearer ${token}`;

    jwt.verify.mockReturnValue(decodedPayload);
    Redis.get.mockResolvedValue(token);

    await userAuth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(token, process.env.SECRET_KEY);
    expect(Redis.get).toHaveBeenCalledWith(`user:${decodedPayload.id}:token`);
    expect(req.user).toEqual({ id: "user123", email: "test@example.com" });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should correctly set req.user when decoded token has no email", async () => {
    const token = "valid-token-no-email";
    const decodedPayload = { id: "user456" };
    req.headers["authorization"] = `Bearer ${token}`;

    jwt.verify.mockReturnValue(decodedPayload);
    Redis.get.mockResolvedValue(token);

    await userAuth(req, res, next);

    expect(req.user).toEqual({ id: "user456" });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should return 401 if no authorization header is provided", async () => {
    await userAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "No token provided, authorization denied.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if token is not in the header", async () => {
    req.headers["authorization"] = "Bearer ";

    await userAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "No token provided, authorization denied.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 for an invalid token (JWT verification fails)", async () => {
    const token = "invalid-token";
    req.headers["authorization"] = `Bearer ${token}`;
    const error = new Error("Invalid signature");
    jwt.verify.mockImplementation(() => {
      throw error;
    });

    await userAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid token, authorization denied.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 for an expired token", async () => {
    const token = "expired-token";
    req.headers["authorization"] = `Bearer ${token}`;
    const error = new Error("Token has expired");
    error.name = "TokenExpiredError";
    jwt.verify.mockImplementation(() => {
      throw error;
    });

    await userAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Token expired, please login again.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if token is not found in Redis", async () => {
    const token = "valid-but-not-in-redis-token";
    const decodedPayload = { id: "user123" };
    req.headers["authorization"] = `Bearer ${token}`;

    jwt.verify.mockReturnValue(decodedPayload);
    Redis.get.mockResolvedValue(null); // Simulate token not found in Redis

    await userAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Token invalidated or not recognized.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if token in Redis does not match provided token", async () => {
    const oldToken = "old-token";
    const decodedPayload = { id: "user123" };
    req.headers["authorization"] = `Bearer ${oldToken}`;

    jwt.verify.mockReturnValue(decodedPayload);
    Redis.get.mockResolvedValue("a-different-newer-token"); // A new token was issued

    await userAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Token invalidated or not recognized.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 500 if an unexpected error occurs", async () => {
    const token = "valid-token";
    req.headers["authorization"] = `Bearer ${token}`;
    const error = new Error("Redis connection failed");
    jwt.verify.mockReturnValue({ id: "user123" });
    Redis.get.mockRejectedValue(error); // Simulate a DB error

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await userAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Server error during authorization.",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Auth middleware error:", error);
    expect(next).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

