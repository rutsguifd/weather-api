import { errorHandler } from "../error.handler";
import httpMocks from "node-mocks-http";

describe("errorHandler middleware", () => {
  it("returns 500 and generic message if no status/message provided", () => {
    const err = {};
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = jest.fn();
    errorHandler(err, req, res, next);
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData().error).toBe("Internal Server Error");
  });

  it("returns custom status and message if provided", () => {
    const err = { status: 404, message: "Not Found" };
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = jest.fn();
    errorHandler(err, req, res, next);
    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData().error).toBe("Not Found");
  });
});
