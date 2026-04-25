import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/db.js", () => ({ query: vi.fn() }));

const { query } = await import("../src/db.js");
const { createApp } = await import("../src/app.js");

const app = createApp();
const vendorId = "33333333-3333-4333-8333-333333333333";

function vendorRow() {
  return {
    id: vendorId,
    name: "Blue Hour Photography",
    service_type: "Photography",
    contact_name: "Priya Menon",
    phone: "+65 9000 1111",
    email: "priya@example.com",
    notes: "Available for full day",
    photo_url: "data:image/png;base64,AAA"
  };
}

beforeEach(() => {
  query.mockReset();
});

describe("vendor routes", () => {
  it("creates a vendor with photo", async () => {
    query.mockResolvedValueOnce({ rowCount: 1, rows: [vendorRow()] });

    const response = await request(app).post("/api/vendors").send({
      name: "Blue Hour Photography",
      serviceType: "Photography",
      photoUrl: "data:image/png;base64,AAA"
    });

    expect(response.status).toBe(201);
    expect(response.body.vendor.photoUrl).toBe("data:image/png;base64,AAA");
  });
});
