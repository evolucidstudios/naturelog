"use client";

import exifr from "exifr";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  buildEntryPayloadFromDraft,
  createEmptyAdminDraft,
  type AdminEntryDraft,
} from "@/lib/admin-entry-draft";

type AnalyzeResult = {
  commonName: string;
  pronunciation: string;
  scientificName: string;
  category: string;
  note: string;
  tags: string[];
  lifespan: string;
  edible: "edible" | "not-edible" | "unknown";
  edibleNote: string;
  uses: string[];
  culinaryIdeas: string[];
  goodFor: string[];
  funFacts: string[];
  care: {
    water: string;
    light: string;
    season: string;
  };
  location: {
    place: string;
    latitude: number | null;
    longitude: number | null;
  };
  confidence: number | null;
};

type AnalyzeResponse = {
  analysis?: AnalyzeResult;
  error?: string;
  model?: string;
};

type AdminEntryEditorProps = {
  mode: "create" | "edit";
  initialEntry?: AdminEntryDraft;
  knownEntries?: Array<{
    id: string;
    commonName: string;
    scientificName: string;
    category: string;
    tags: string[];
  }>;
};

type DuplicateMatch = {
  id: string;
  commonName: string;
  scientificName: string;
  category: string;
  tags: string[];
  score: number;
  reasons: string[];
};

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(values: string[]) {
  return values.join("\n");
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

function getSelectedFileKey(file: File) {
  return `${file.name}-${file.lastModified}-${file.size}`;
}

function createUploadId() {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeValue(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function scoreDuplicateCandidate(
  draft: AdminEntryDraft,
  candidate: NonNullable<AdminEntryEditorProps["knownEntries"]>[number],
) {
  const reasons: string[] = [];
  let score = 0;
  const draftCommon = normalizeValue(draft.commonName);
  const draftScientific = normalizeValue(draft.scientificName);
  const draftCategory = normalizeValue(draft.category);
  const candidateCommon = normalizeValue(candidate.commonName);
  const candidateScientific = normalizeValue(candidate.scientificName);
  const candidateCategory = normalizeValue(candidate.category);

  if (draftCommon && candidateCommon && draftCommon === candidateCommon) {
    score += 5;
    reasons.push("same common name");
  }

  if (draftScientific && candidateScientific && draftScientific === candidateScientific) {
    score += 6;
    reasons.push("same scientific name");
  }

  if (draftCategory && candidateCategory && draftCategory === candidateCategory) {
    score += 1;
    reasons.push("same category");
  }

  const draftTags = new Set(draft.tags.map(normalizeValue).filter(Boolean));
  const sharedTags = candidate.tags
    .map(normalizeValue)
    .filter((tag) => draftTags.has(tag));

  if (sharedTags.length > 0) {
    score += Math.min(sharedTags.length, 3);
    reasons.push(
      `${sharedTags.length} shared tag${sharedTags.length === 1 ? "" : "s"}`,
    );
  }

  if (score < 4) {
    return null;
  }

  return {
    ...candidate,
    score,
    reasons,
  } satisfies DuplicateMatch;
}

async function compressImageForAnalysis(file: File) {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Could not prepare this image for AI analysis."));
      nextImage.src = imageUrl;
    });

    const maxDimension = 1600;
    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);

    if (longestSide <= maxDimension && file.size <= 4 * 1024 * 1024) {
      return file;
    }

    const scale = Math.min(1, maxDimension / longestSide);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, width, height);

    const compressedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });

    if (!compressedBlob) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "analysis-image";
    return new File([compressedBlob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

async function extractGpsFromFile(file: File) {
  try {
    const gps = await exifr.parse(file, { gps: true });
    return {
      latitude: typeof gps?.latitude === "number" ? gps.latitude : null,
      longitude: typeof gps?.longitude === "number" ? gps.longitude : null,
    };
  } catch {
    return {
      latitude: null,
      longitude: null,
    };
  }
}

export function AdminEntryEditor({
  mode,
  initialEntry = createEmptyAdminDraft(),
  knownEntries = [],
}: AdminEntryEditorProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [draft, setDraft] = useState<AdminEntryDraft>(initialEntry);
  const [pending, startTransition] = useTransition();
  const [analysisPending, startAnalysisTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);
  const [coverImageKey, setCoverImageKey] = useState<string | null>(
    initialEntry.existingImages[0] ? `existing:${initialEntry.existingImages[0].path}` : null,
  );

  const visibleExistingImages = useMemo(
    () => draft.existingImages.filter((image) => !removedPaths.includes(image.path)),
    [draft.existingImages, removedPaths],
  );
  const selectedFilePreviews = useMemo(
    () =>
      selectedFiles.map((file) => ({
        file,
        key: `new:${getSelectedFileKey(file)}`,
        url: URL.createObjectURL(file),
      })),
    [selectedFiles],
  );
  const availableCoverKeys = useMemo(
    () => [
      ...visibleExistingImages.map((image) => `existing:${image.path}`),
      ...selectedFilePreviews.map((preview) => preview.key),
    ],
    [selectedFilePreviews, visibleExistingImages],
  );
  const activeCoverImageKey = useMemo(() => {
    if (availableCoverKeys.length === 0) {
      return null;
    }

    return coverImageKey && availableCoverKeys.includes(coverImageKey)
      ? coverImageKey
      : availableCoverKeys[0];
  }, [availableCoverKeys, coverImageKey]);
  const duplicateMatches = useMemo(() => {
    if (mode !== "create") {
      return [];
    }

    return knownEntries
      .map((candidate) => scoreDuplicateCandidate(draft, candidate))
      .filter((match): match is DuplicateMatch => Boolean(match))
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);
  }, [draft, knownEntries, mode]);

  useEffect(
    () => () => {
      selectedFilePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    },
    [selectedFilePreviews],
  );

  const updateDraft = (patch: Partial<AdminEntryDraft>) => {
    setDraft((current) => ({
      ...current,
      ...patch,
    }));
  };

  const runAnalysis = (modelTier: "fast" | "strong") => {
    if (selectedFiles.length === 0) {
      setMessage("Choose at least one image first so I have something to analyze.");
      return;
    }

    setMessage(null);
    startAnalysisTransition(async () => {
      try {
        const analysisFile = await compressImageForAnalysis(selectedFiles[0]);
        const gps = await extractGpsFromFile(selectedFiles[0]);
        const formData = new FormData();
        formData.append("image", analysisFile);
        formData.append("modelTier", modelTier);
        if (gps.latitude !== null) {
          formData.append("latitude", String(gps.latitude));
        }
        if (gps.longitude !== null) {
          formData.append("longitude", String(gps.longitude));
        }

        const response = await fetch("/api/ai/analyze", {
          method: "POST",
          body: formData,
        });
        const contentType = response.headers.get("content-type") ?? "";
        const payload = contentType.includes("application/json")
          ? ((await response.json()) as AnalyzeResponse)
          : { error: `Analysis failed with ${response.status}.` };

        if (!response.ok || !payload.analysis) {
          setMessage(payload.error ?? "Analysis failed.");
          return;
        }

        const { analysis } = payload;
        setDraft((current) => ({
          ...current,
          commonName: analysis.commonName || current.commonName,
          pronunciation: analysis.pronunciation || current.pronunciation,
          scientificName: analysis.scientificName || current.scientificName,
          category: analysis.category || current.category,
          note: analysis.note || current.note,
          tags: analysis.tags.length > 0 ? analysis.tags : current.tags,
          lifespan: analysis.lifespan || current.lifespan,
          edible: analysis.edible,
          edibleNote: analysis.edibleNote || current.edibleNote,
          uses: analysis.uses.length > 0 ? analysis.uses : current.uses,
          culinaryIdeas:
            analysis.culinaryIdeas.length > 0 ? analysis.culinaryIdeas : current.culinaryIdeas,
          goodFor: analysis.goodFor.length > 0 ? analysis.goodFor : current.goodFor,
          funFacts: analysis.funFacts.length > 0 ? analysis.funFacts : current.funFacts,
          care: {
            water: analysis.care.water || current.care.water,
            light: analysis.care.light || current.care.light,
            season: analysis.care.season || current.care.season,
          },
          location: {
            place: analysis.location.place || current.location.place,
            latitude: analysis.location.latitude ?? current.location.latitude,
            longitude: analysis.location.longitude ?? current.location.longitude,
          },
        }));

        const modelLabel = payload.model === "gpt-4.1" ? "stronger model" : "fast model";
        setMessage(`AI analysis applied from the ${modelLabel}. Review anything that looks off before saving.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Analysis failed.");
      }
    });
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      return [];
    }

    const uploadedFiles: Array<{ key: string; path: string }> = [];

    for (const file of selectedFiles) {
      const path = `entries/${Date.now()}-${createUploadId()}-${safeFileName(file.name)}`;
      const { error } = await supabase.storage.from("nature-images").upload(path, file, {
        upsert: false,
      });

      if (error) {
        throw new Error(error.message);
      }

      uploadedFiles.push({
        key: `new:${getSelectedFileKey(file)}`,
        path,
      });
    }

    return uploadedFiles;
  };

  const handleSave = () => {
    setMessage(null);

    startTransition(async () => {
      try {
        const uploadedFiles = await uploadFiles();
        const imagePaths = [
          ...visibleExistingImages.map((image) => ({
            key: `existing:${image.path}`,
            path: image.path,
          })),
          ...uploadedFiles,
        ];
        const orderedImagePaths =
          activeCoverImageKey && imagePaths.some((image) => image.key === activeCoverImageKey)
            ? [
                ...imagePaths.filter((image) => image.key === activeCoverImageKey),
                ...imagePaths.filter((image) => image.key !== activeCoverImageKey),
              ].map((image) => image.path)
            : imagePaths.map((image) => image.path);
        const payload = buildEntryPayloadFromDraft(draft, orderedImagePaths);
        const response = await fetch("/api/admin/entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const result = (await response.json()) as { id?: string; error?: string };

        if (!response.ok || !result.id) {
          setMessage(result.error ?? "Save failed.");
          return;
        }

        setMessage("Saved. Taking you back to the admin list.");
        router.push("/admin");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Save failed.");
      }
    });
  };

  const handleDelete = () => {
    if (!draft.id || !window.confirm("Delete this entry and all its uploaded images?")) {
      return;
    }

    setMessage(null);
    startDeleteTransition(async () => {
      const response = await fetch(`/api/admin/entries/${draft.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !payload.success) {
        setMessage(payload.error ?? "Delete failed.");
        return;
      }

      router.push("/admin");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 rounded-[30px] border border-white/70 bg-white/74 p-5 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-moss">
            {mode === "create" ? "New entry" : "Edit entry"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-bark">
            {mode === "create" ? "Create a new nature card" : draft.commonName || "Edit card"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === "create" ? (
            <>
              <button
                type="button"
                onClick={() => runAnalysis("fast")}
                disabled={analysisPending}
                className="rounded-full border border-bark/10 bg-sand/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-bark transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {analysisPending ? "Analyzing..." : "Analyze with AI"}
              </button>
              <button
                type="button"
                onClick={() => runAnalysis("strong")}
                disabled={analysisPending}
                className="rounded-full border border-[#4e6c74]/14 bg-[#eef6f7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2f535b] transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {analysisPending ? "Analyzing..." : "Retry with better model"}
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="rounded-full bg-bark px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-paper transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save entry"}
          </button>
          {mode === "edit" && draft.id ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deletePending}
              className="rounded-full border border-[#a45f54]/20 bg-[#fff1ee] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a4339] transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
            >
              {deletePending ? "Deleting..." : "Delete entry"}
            </button>
          ) : null}
        </div>
      </div>

      {message ? (
        <div className="rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-sm text-bark/76">
          {message}
        </div>
      ) : null}

      {duplicateMatches.length > 0 ? (
        <section className="rounded-[24px] border border-[#caa56f]/28 bg-[linear-gradient(180deg,#fff9ef,#f8eedc)] p-4 shadow-[0_10px_30px_rgba(88,73,37,0.05)] sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b6b35]">
            Possible duplicate
          </p>
          <p className="mt-2 text-sm leading-6 text-bark/74">
            This new card looks a lot like something already in your collection. You can still
            save a new one, but you may want to add photos to the existing card instead.
          </p>
          <div className="mt-4 grid gap-3">
            {duplicateMatches.map((match) => (
              <div
                key={match.id}
                className="rounded-[18px] border border-[#d7c29c]/45 bg-white/72 px-4 py-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-bark">{match.commonName}</p>
                    {match.scientificName ? (
                      <p className="mt-1 text-sm italic text-bark/58">{match.scientificName}</p>
                    ) : null}
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-bark/52">
                      {match.reasons.join(" · ")}
                    </p>
                  </div>
                  <Link
                    href={`/admin/entries/${match.id}`}
                    className="inline-flex items-center justify-center rounded-full border border-bark/10 bg-paper px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-bark transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    Edit existing
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[24px] border border-bark/10 bg-paper/70 p-4 shadow-[0_10px_30px_rgba(88,73,37,0.05)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
              Choose pictures first
            </p>
          <p className="mt-2 text-sm leading-6 text-ink/68">
            This is the first thing you’ll usually do. The first image powers AI analysis,
            and the full set gets saved to the card.
          </p>
          {mode === "edit" ? (
            <p className="mt-2 text-sm leading-6 text-ink/62">
              Adding more photos to an existing card will not rerun AI analysis. It will just
              attach the new images when you save.
            </p>
          ) : null}
        </div>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-bark px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-paper transition-transform duration-200 hover:-translate-y-0.5">
            Choose pictures
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                const nextFiles = Array.from(event.target.files ?? []);
                setSelectedFiles(nextFiles);
              }}
              className="sr-only"
            />
          </label>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Common name
          </span>
          <input
            value={draft.commonName}
            onChange={(event) => updateDraft({ commonName: event.target.value })}
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Pronunciation
          </span>
          <input
            value={draft.pronunciation}
            onChange={(event) => updateDraft({ pronunciation: event.target.value })}
            placeholder="Example: AN-uhz HUM-ing-bird"
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Scientific name
          </span>
          <input
            value={draft.scientificName}
            onChange={(event) => updateDraft({ scientificName: event.target.value })}
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Category
          </span>
          <input
            value={draft.category}
            onChange={(event) => updateDraft({ category: event.target.value })}
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Average lifespan
          </span>
          <input
            value={draft.lifespan}
            onChange={(event) => updateDraft({ lifespan: event.target.value })}
            placeholder="Example: 15 years in the wild"
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Edible status
          </span>
          <select
            value={draft.edible}
            onChange={(event) =>
              updateDraft({ edible: event.target.value as AdminEntryDraft["edible"] })
            }
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          >
            <option value="unknown">Unknown</option>
            <option value="edible">Edible</option>
            <option value="not-edible">Not edible</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
          Description
        </span>
        <textarea
          value={draft.note}
          onChange={(event) => updateDraft({ note: event.target.value })}
          rows={5}
          className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
        />
      </label>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Tags
          </span>
          <textarea
            value={joinLines(draft.tags)}
            onChange={(event) => updateDraft({ tags: splitLines(event.target.value) })}
            rows={6}
            placeholder="One tag per line"
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Good for
          </span>
          <textarea
            value={joinLines(draft.goodFor)}
            onChange={(event) => updateDraft({ goodFor: splitLines(event.target.value) })}
            rows={6}
            placeholder="One idea per line"
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Uses
          </span>
          <textarea
            value={joinLines(draft.uses)}
            onChange={(event) => updateDraft({ uses: splitLines(event.target.value) })}
            rows={5}
            placeholder="One use per line"
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Fun facts
          </span>
          <textarea
            value={joinLines(draft.funFacts)}
            onChange={(event) => updateDraft({ funFacts: splitLines(event.target.value) })}
            rows={5}
            placeholder="One fact per line"
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Edible note
          </span>
          <textarea
            value={draft.edibleNote}
            onChange={(event) => updateDraft({ edibleNote: event.target.value })}
            rows={4}
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Culinary ideas
          </span>
          <textarea
            value={joinLines(draft.culinaryIdeas)}
            onChange={(event) =>
              updateDraft({ culinaryIdeas: splitLines(event.target.value) })
            }
            rows={4}
            placeholder="One idea per line"
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Location place
          </span>
          <input
            value={draft.location.place}
            onChange={(event) =>
              updateDraft({
                location: { ...draft.location, place: event.target.value },
              })
            }
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Latitude
          </span>
          <input
            type="number"
            step="any"
            value={draft.location.latitude ?? ""}
            onChange={(event) =>
              updateDraft({
                location: {
                  ...draft.location,
                  latitude: event.target.value ? Number(event.target.value) : null,
                },
              })
            }
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Longitude
          </span>
          <input
            type="number"
            step="any"
            value={draft.location.longitude ?? ""}
            onChange={(event) =>
              updateDraft({
                location: {
                  ...draft.location,
                  longitude: event.target.value ? Number(event.target.value) : null,
                },
              })
            }
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Water
          </span>
          <input
            value={draft.care.water}
            onChange={(event) =>
              updateDraft({ care: { ...draft.care, water: event.target.value } })
            }
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Light
          </span>
          <input
            value={draft.care.light}
            onChange={(event) =>
              updateDraft({ care: { ...draft.care, light: event.target.value } })
            }
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Season
          </span>
          <input
            value={draft.care.season}
            onChange={(event) =>
              updateDraft({ care: { ...draft.care, season: event.target.value } })
            }
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>
      </div>

      {selectedFilePreviews.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            New uploads
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {selectedFilePreviews.map((preview) => (
              <div key={preview.key} className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  className="h-28 w-24 rounded-[18px] object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCoverImageKey(preview.key)}
                  className={`w-full rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                    activeCoverImageKey === preview.key
                      ? "bg-bark text-paper"
                      : "border border-bark/10 bg-paper text-bark"
                  }`}
                >
                  {activeCoverImageKey === preview.key ? "Cover image" : "Set as cover"}
                </button>
                <p className="max-w-24 text-center text-[11px] leading-4 text-bark/66">
                  {preview.file.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {visibleExistingImages.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Existing images
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {visibleExistingImages.map((image) => (
              <div key={image.path} className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt=""
                  className="h-28 w-24 rounded-[18px] object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCoverImageKey(`existing:${image.path}`)}
                  className={`w-full rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                    activeCoverImageKey === `existing:${image.path}`
                      ? "bg-bark text-paper"
                      : "border border-bark/10 bg-paper text-bark"
                  }`}
                >
                  {activeCoverImageKey === `existing:${image.path}` ? "Cover image" : "Set as cover"}
                </button>
                <button
                  type="button"
                  onClick={() => setRemovedPaths((current) => [...current, image.path])}
                  className="w-full rounded-full border border-bark/10 bg-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-bark"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
