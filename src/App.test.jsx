import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import App from "./App.jsx";
import useFetchPhotos from "./hooks/useFetchPhotos.js";

const samplePhotos = [
  {
    id: "1",
    author: "Alice Rivera",
    download_url: "https://picsum.photos/id/1/500/500",
  },
  {
    id: "2",
    author: "Bob Chen",
    download_url: "https://picsum.photos/id/2/500/500",
  },
  {
    id: "3",
    author: "Mina Patel",
    download_url: "https://picsum.photos/id/3/500/500",
  },
];

function mockPhotosResponse(photos = samplePhotos) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(photos),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    clear: () => values.clear(),
  };
}

describe("useFetchPhotos", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns loading state, fetches the required endpoint, and returns the photos", async () => {
    const fetchMock = mockPhotosResponse();
    const { result } = renderHook(() => useFetchPhotos());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://picsum.photos/v2/list?limit=30",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result.current.photos).toEqual(samplePhotos);
    expect(result.current.error).toBe(null);
  });

  it("returns an error and ends loading when the photo service fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );
    const { result } = renderHook(() => useFetchPhotos());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.photos).toEqual([]);
    expect(result.current.error).toContain("couldn't load the photographs");
  });
});

describe("photo gallery", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
    mockPhotosResponse();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("filters existing photos by author without another API request and clears search", async () => {
    const fetchMock = mockPhotosResponse();
    render(<App />);
    await screen.findByRole("heading", { name: "Alice Rivera" });

    const search = screen.getByRole("searchbox", {
      name: "Search by photographer",
    });
    fireEvent.change(search, { target: { value: "bOB" } });

    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Bob Chen" })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.change(search, { target: { value: "no matching author" } });
    expect(screen.getByRole("heading", { name: "No photographers found" })).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Clear search" })[0]);
    expect(screen.getAllByRole("article")).toHaveLength(samplePhotos.length);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("saves a favourite, restores it from localStorage, and removes it when toggled again", async () => {
    const { unmount } = render(<App />);
    await screen.findByRole("heading", { name: "Alice Rivera" });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add Alice Rivera's photograph to favourites",
      }),
    );

    await waitFor(() => {
      expect(localStorage.getItem("still_gallery_favourites")).toBe('["1"]');
    });

    unmount();
    render(<App />);
    const savedButton = await screen.findByRole("button", {
      name: "Remove Alice Rivera's photograph from favourites",
    });
    expect(savedButton.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(savedButton);
    await waitFor(() => {
      expect(localStorage.getItem("still_gallery_favourites")).toBe("[]");
    });
    expect(
      screen.getByRole("button", {
        name: "Add Alice Rivera's photograph to favourites",
      }).getAttribute("aria-pressed"),
    ).toBe("false");
  });
});
