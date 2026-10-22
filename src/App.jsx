import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import useFetchPhotos from "./hooks/useFetchPhotos.js";

const STORAGE_KEY = "still_gallery_favourites";

function readSavedFavourites() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function favouritesReducer(favourites, action) {
  switch (action.type) {
    case "toggle": {
      const isSaved = favourites.includes(action.id);
      return isSaved
        ? favourites.filter((id) => id !== action.id)
        : [...favourites, action.id];
    }
    default:
      return favourites;
  }
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m20 20-3.5-3.5" />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    </svg>
  );
}

function Header() {
  return (
    <header className="border-b border-subtle">
      <div className="page-width flex items-baseline justify-between py-5 sm:py-6">
        <a className="flex items-baseline gap-3 text-charcoal" href="/" aria-label="Still Photo Archive home">
          <span className="font-serif text-2xl tracking-tight sm:text-3xl">STILL</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone">
            Photo Archive
          </span>
        </a>
        <p className="hidden text-sm text-stone sm:block">A collection of moments</p>
      </div>
    </header>
  );
}

function PhotoCard({ photo, displayNumber, isFavourite, onToggleFavourite }) {
  const imageUrl = `https://picsum.photos/id/${encodeURIComponent(photo.id)}/600/750`;

  function useOriginalImage(event) {
    if (event.currentTarget.dataset.fallback !== "true" && photo.download_url) {
      event.currentTarget.dataset.fallback = "true";
      event.currentTarget.src = photo.download_url;
    }
  }

  return (
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[10px] border border-subtle/70 bg-[#ECEAE3]">
        <img
          className="photo-image h-full w-full object-cover"
          src={imageUrl}
          alt={`Photograph by ${photo.author}`}
          loading="lazy"
          onError={useOriginalImage}
        />
        <button
          type="button"
          className={`heart-button absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full shadow-sm backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
            isFavourite
              ? "bg-white/95 text-terracotta"
              : "bg-white/85 text-charcoal hover:bg-white hover:text-terracotta"
          }`}
          onClick={() => onToggleFavourite(photo.id)}
          aria-label={`${isFavourite ? "Remove" : "Add"} ${photo.author}'s photograph ${isFavourite ? "from" : "to"} favourites`}
          aria-pressed={isFavourite}
        >
          <HeartIcon filled={isFavourite} />
        </button>
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2 px-0.5">
        <h2 className="truncate text-sm font-medium text-charcoal">{photo.author}</h2>
        <span className="font-mono text-[11px] text-stone/80">#{displayNumber}</span>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center py-24 text-center sm:py-32" role="status" aria-live="polite">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-subtle border-t-terracotta" />
      <p className="mt-4 text-sm font-medium tracking-wide text-stone">Loading photographs...</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center" role="alert">
      <h2 className="text-lg font-medium text-charcoal">We couldn't load the photographs.</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone">{message}</p>
      <p className="mt-3 text-xs text-stone">Refresh the page to try again.</p>
    </div>
  );
}

function EmptySearchState({ onClear }) {
  return (
    <div className="mx-auto max-w-sm px-4 py-20 text-center">
      <h2 className="font-serif text-2xl sm:text-3xl">No photographers found</h2>
      <p className="mt-2 text-sm text-stone">Try a different name.</p>
      <button
        className="mt-5 text-sm font-medium text-terracotta underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        onClick={onClear}
        type="button"
      >
        Clear search
      </button>
    </div>
  );
}

export default function App() {
  const { photos, loading, error } = useFetchPhotos();
  const [favourites, dispatch] = useReducer(
    favouritesReducer,
    undefined,
    readSavedFavourites,
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favourites));
    } catch {
      // The gallery still works for this session if browser storage is unavailable.
    }
  }, [favourites]);

  const handleSearchChange = useCallback((event) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleToggleFavourite = useCallback((id) => {
    dispatch({ type: "toggle", id });
  }, []);

  const filteredPhotos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return photos;
    return photos.filter((photo) => photo.author.toLowerCase().includes(query));
  }, [photos, searchQuery]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="page-width w-full flex-1 pb-16 sm:pb-20">
        <section className="pb-8 pt-9 sm:pb-10 sm:pt-14">
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-charcoal sm:text-6xl md:text-7xl">
            Moments, collected.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone sm:mt-4 sm:text-base">
            A quiet collection of photographs from different perspectives.
          </p>
        </section>

        <section
          className="flex flex-col justify-between gap-4 border-b border-subtle/80 pb-7 sm:flex-row sm:items-center sm:pb-9"
          aria-label="Search photographs"
        >
          <label className="relative block w-full sm:max-w-md">
            <span className="sr-only">Search by photographer</span>
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-stone">
              <SearchIcon />
            </span>
            <input
              className="w-full rounded-md border border-subtle bg-white py-3 pl-10 pr-16 text-sm text-charcoal placeholder:text-stone/70 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/40"
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by photographer..."
              autoComplete="off"
            />
            {searchQuery && (
              <button
                className="absolute inset-y-0 right-3 text-xs font-medium uppercase tracking-wider text-stone hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </label>
          {!loading && !error && (
            <p className="text-xs font-medium uppercase tracking-wider text-stone" aria-live="polite">
              {filteredPhotos.length} {filteredPhotos.length === 1 ? "photograph" : "photographs"}
            </p>
          )}
        </section>

        <section className="pt-8 sm:pt-10" aria-label="Photo gallery">
          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} />}
          {!loading && !error && filteredPhotos.length === 0 && (
            <EmptySearchState onClear={handleClearSearch} />
          )}
          {!loading && !error && filteredPhotos.length > 0 && (
            <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4">
              {filteredPhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  displayNumber={photos.findIndex((item) => item.id === photo.id) + 1}
                  isFavourite={favourites.includes(photo.id)}
                  onToggleFavourite={handleToggleFavourite}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <footer className="mt-auto border-t border-subtle py-7">
        <div className="page-width flex flex-col items-center justify-between gap-2 text-xs text-stone sm:flex-row">
          <p>STILL Photo Archive</p>
          <p className="font-mono text-[11px]">30 photographs via Picsum</p>
        </div>
      </footer>
    </div>
  );
}
