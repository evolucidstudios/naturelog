"use client";

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
  scientificName: string;
  category: string;
  note: string;
  tags: string[];
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

type AdminEntryEditorProps = {
  mode: "create" | "edit";
  initialEntry?: AdminEntryDraft;
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

export function AdminEntryEditor({
  mode,
  initialEntry = createEmptyAdminDraft(),
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

  const visibleExistingImages = useMemo(
    () => draft.existingImages.filter((image) => !removedPaths.includes(image.path)),
    [draft.existingImages, removedPaths],
  );
  const selectedFilePreviews = useMemo(
    () => selectedFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [selectedFiles],
  );

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

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      return [];
    }

    const uploadedPaths: string[] = [];

    for (const file of selectedFiles) {
      const path = `entries/${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const { error } = await supabase.storage.from("nature-images").upload(path, file, {
        upsert: false,
      });

      if (error) {
        throw new Error(error.message);
      }

      uploadedPaths.push(path);
    }

    return uploadedPaths;
  };

  const handleAnalyze = () => {
    if (selectedFiles.length === 0) {
      setMessage("Choose at least one image first so I have something to analyze.");
      return;
    }

    setMessage(null);
    startAnalysisTransition(async () => {
      const formData = new FormData();
      formData.append("image", selectedFiles[0]);

      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { analysis?: AnalyzeResult; error?: string };

      if (!response.ok || !payload.analysis) {
        setMessage(payload.error ?? "Analysis failed.");
        return;
      }

      const { analysis } = payload;
      setDraft((current) => ({
        ...current,
        commonName: analysis.commonName || current.commonName,
        scientificName: analysis.scientificName || current.scientificName,
        category: analysis.category || current.category,
        note: analysis.note || current.note,
        tags: analysis.tags.length > 0 ? analysis.tags : current.tags,
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
      setMessage("AI analysis applied. Review anything that looks off before saving.");
    });
  };

  const handleSave = () => {
    setMessage(null);

    startTransition(async () => {
      try {
        const uploadedPaths = await uploadFiles();
        const imagePaths = [
          ...visibleExistingImages.map((image) => image.path),
          ...uploadedPaths,
        ];
        const payload = buildEntryPayloadFromDraft(draft, imagePaths);
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
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analysisPending}
            className="rounded-full border border-bark/10 bg-sand/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-bark transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
          >
            {analysisPending ? "Analyzing..." : "Analyze with AI"}
          </button>
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

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Photos
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
            className="mt-2 block w-full text-sm text-bark/72"
          />
          <p className="mt-2 text-xs leading-5 text-ink/56">
            Upload one or more photos. The first one is used for AI analysis and becomes the
            lead image unless you reorder later.
          </p>
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
              <div key={`${preview.file.name}-${preview.file.lastModified}`} className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  className="h-28 w-24 rounded-[18px] object-cover"
                />
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
