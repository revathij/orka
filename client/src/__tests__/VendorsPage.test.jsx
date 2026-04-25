import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VendorsPage from "../pages/VendorsPage.jsx";
import {
  createServiceType,
  createVendor,
  deleteServiceType,
  deleteVendor,
  getServiceTypes,
  getVendors
} from "../api.js";

vi.mock("../api.js", () => ({
  createServiceType: vi.fn(),
  createVendor: vi.fn(),
  deleteServiceType: vi.fn(),
  deleteVendor: vi.fn(),
  getServiceTypes: vi.fn(),
  getVendors: vi.fn()
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  createServiceType.mockReset();
  createVendor.mockReset();
  deleteServiceType.mockReset();
  deleteVendor.mockReset();
  getServiceTypes.mockReset();
  getVendors.mockReset();
});

describe("VendorsPage", () => {
  it("creates service type and vendor", async () => {
    getServiceTypes
      .mockResolvedValueOnce({ serviceTypes: [{ id: "s1", name: "Photography" }] })
      .mockResolvedValueOnce({ serviceTypes: [{ id: "s1", name: "Photography" }, { id: "s2", name: "Lighting" }] });
    getVendors.mockResolvedValue({ vendors: [] });
    createServiceType.mockResolvedValue({ serviceType: { id: "s2", name: "Lighting" } });
    createVendor.mockResolvedValue({ vendor: { id: "v1" } });

    render(
      <MemoryRouter>
        <VendorsPage />
      </MemoryRouter>
    );

    fireEvent.change(await screen.findByLabelText("Service type name"), {
      target: { value: "Lighting" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add service type" }));

    await waitFor(() => expect(createServiceType).toHaveBeenCalledWith({ name: "Lighting" }));

    fireEvent.change(await screen.findByLabelText("Vendor name"), {
      target: { value: "Blue Hour Photography" }
    });
    fireEvent.change(screen.getByLabelText("Service type"), {
      target: { value: "Lighting" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save vendor" }));

    await waitFor(() =>
      expect(createVendor).toHaveBeenCalledWith(expect.objectContaining({
        name: "Blue Hour Photography",
        serviceType: "Lighting",
        photoUrl: ""
      }))
    );
  });
});
