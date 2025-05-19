import { validateSubscriptionDto } from "../validate.dto";
import httpMocks from "node-mocks-http";

describe("validateSubscriptionDto middleware", () => {
  const next = jest.fn();

  beforeEach(() => {
    next.mockClear();
  });

  it("calls next() for valid email subscription", () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        email: "test@example.com",
        city: "Kyiv",
        frequency: "daily",
      },
    });
    const res = httpMocks.createResponse();
    validateSubscriptionDto(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
  });

  it("calls next() for valid webhook subscription", () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        webhookUrl: "https://webhook.site/123",
        city: "Kyiv",
        frequency: "hourly",
      },
    });
    const res = httpMocks.createResponse();
    validateSubscriptionDto(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
  });

  it("returns 400 if city is missing", () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { frequency: "daily" },
    });
    const res = httpMocks.createResponse();
    validateSubscriptionDto(req, res, next);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData().error).toBe("city is required");
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 if frequency is invalid", () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { city: "Kyiv", frequency: "weekly" },
    });
    const res = httpMocks.createResponse();
    validateSubscriptionDto(req, res, next);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData().error).toBe(
      "frequency must be either hourly or daily"
    );
    expect(next).not.toHaveBeenCalled();
  });
});
