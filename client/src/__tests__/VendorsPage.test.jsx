import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VendorsPage from "../pages/VendorsPage.jsx";
import {
  createVendor,
  deleteVendor,
  getVendors
} from "../api.js";

vi.mock("../api.js", () => ({
  createVendor: vi.fn(),
  deleteVendor: vi.fn(),
  getVendors: vi.fn()
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  createVendor.mockReset();
  deleteVendor.mockReset();
  getVendors.mockReset();
});

describe("VendorsPage", () => {
  it("creates vendor", async () => {
    getVendors.mockResolvedValue({ vendors: [] });
    createVendor.mockResolvedValue({ vendor: { id: "v1" } });

    render(
      <MemoryRouter>
        <VendorsPage />
      </MemoryRouter>
    );

    fireEvent.change(await screen.findByLabelText("Vendor name"), {
      target: { value: "Blue Hour Photography" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save vendor" }));

    await waitFor(() =>
      expect(createVendor).toHaveBeenCalledWith(expect.objectContaining({
        name: "Blue Hour Photography",
        photoUrl: ""
      }))
    );
  });
});
