<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { ShareStep, SharePlatform, TaskStep } from "@/api/models";
import { formatSize } from "./fileKinds";

/**
 * What a task asks before the proof, one step at a time. A share step sends
 * its post through the phone's share sheet in one tap, files and all, or opens
 * a platform with the text filled in. An open step is a link under the
 * button the team named. Ticks are kept in this browser only.
 */
const props = defineProps<{ steps: TaskStep[]; token: string }>();

const PLATFORMS: Record<SharePlatform, { name: string; icon: string; color: string }> = {
  whatsapp: { name: "WhatsApp", icon: "fa-whatsapp", color: "bg-[#25D366]" },
  x: { name: "X", icon: "fa-x-twitter", color: "bg-black" },
  facebook: { name: "Facebook", icon: "fa-facebook-f", color: "bg-[#1877F2]" },
  linkedin: { name: "LinkedIn", icon: "fa-linkedin-in", color: "bg-[#0A66C2]" },
  instagram: { name: "Instagram", icon: "fa-instagram", color: "bg-[#E1306C]" },
  telegram: { name: "Telegram", icon: "fa-telegram", color: "bg-[#229ED9]" },
};

const DONE_KEY = `linkskool-task-steps:${props.token}`;
const readDone = (): number[] => {
  try {
    return JSON.parse(localStorage.getItem(DONE_KEY) ?? "[]");
  } catch {
    return [];
  }
};
const done = ref<number[]>(readDone());
const markDone = (i: number) => {
  if (done.value.includes(i)) return;
  done.value = [...done.value, i];
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify(done.value));
  } catch {
    // Ticked for this visit.
  }
};

/**
 * The share sheet must open on the tap itself, so files are fetched ahead of
 * it. Until they are in, Share waits and shows how far along they are, so a
 * tap never sends the caption without the video. If they can't come, Share
 * says it sends the caption only.
 */
const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
const ready = ref<Record<number, File[]>>({});
const loading = ref<Record<number, number>>({});
const failed = ref<Record<number, "error" | "unsupported">>({});

/** What the step's files are, as the person would call them. */
const what = (step: ShareStep) =>
  step.files.some((f) => f.type.startsWith("video/"))
    ? "video"
    : step.files.length === 1 && step.files[0]!.type.startsWith("image/")
      ? "picture"
      : "files";

/** A file by its type: "video", "picture", "PDF"; numbered when the step has more than one of that type. */
const kindOf = (f: ShareStep["files"][number]) => {
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  if (f.type.startsWith("video/")) return "video";
  if (f.type.startsWith("image/")) return "picture";
  if (f.type.startsWith("audio/")) return "audio";
  if (ext === "pdf") return "PDF";
  if (["doc", "docx"].includes(ext)) return "document";
  if (["ppt", "pptx"].includes(ext)) return "slides";
  if (["xls", "xlsx", "csv"].includes(ext)) return "spreadsheet";
  return "file";
};
const fileLabel = (step: ShareStep, n: number) => {
  const kind = kindOf(step.files[n]!);
  const same = step.files.filter((f) => kindOf(f) === kind);
  return same.length > 1 ? `${kind} ${same.indexOf(step.files[n]!) + 1}` : kind;
};

/** Fetches a file, telling how many bytes have come so far. */
const download = async (url: string, onBytes: (n: number) => void): Promise<Blob> => {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status})`);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    onBytes(value.length);
  }
  return new Blob(chunks as BlobPart[]);
};

onMounted(() => {
  if (!canShare) return;
  props.steps.forEach(async (step, i) => {
    if (step.kind !== "share" || !step.files.length) return;
    const total = step.files.reduce((sum, f) => sum + f.size, 0) || 1;
    let got = 0;
    loading.value = { ...loading.value, [i]: 0 };
    try {
      const files = await Promise.all(
        step.files.map(
          async (f) =>
            new File(
              [
                await download(f.url, (n) => {
                  got += n;
                  loading.value = { ...loading.value, [i]: Math.min(99, Math.floor((got / total) * 100)) };
                }),
              ],
              f.name,
              { type: f.type },
            ),
        ),
      );
      if (navigator.canShare?.({ files })) ready.value = { ...ready.value, [i]: files };
      else failed.value = { ...failed.value, [i]: "unsupported" };
    } catch {
      failed.value = { ...failed.value, [i]: "error" };
    } finally {
      const rest = { ...loading.value };
      delete rest[i];
      loading.value = rest;
    }
  });
});

const note = ref<Record<number, string>>({});
const share = async (step: ShareStep, i: number) => {
  if (loading.value[i] !== undefined) return;
  const files = ready.value[i];
  if (step.files.length && !files?.length) {
    note.value = {
      ...note.value,
      [i]:
        failed.value[i] === "unsupported"
          ? `This browser can’t share the ${what(step)}, so only the caption goes. Save the ${what(step)} below and attach it.`
          : `The ${what(step)} didn’t load, so only the caption goes. Save it below and attach it, or reload the page to try again.`,
    };
  }
  // Some apps keep only the picture, so the caption is on the clipboard to paste.
  if (files?.length && step.text) {
    try {
      await navigator.clipboard.writeText(step.text);
      note.value = { ...note.value, [i]: "Caption copied. Paste it if the app leaves it out." };
    } catch {
      // The share carries it.
    }
  }
  try {
    await navigator.share(files?.length ? { text: step.text, files } : { text: step.text });
    markDone(i);
  } catch (e) {
    // Closing the sheet is no failure; anything else falls back to the buttons below.
    if ((e as Error).name !== "AbortError") note.value = { ...note.value, [i]: "Use one of the buttons below instead." };
  }
};

/**
 * Puts the caption and the step's first picture on the clipboard together:
 * the picture as PNG (the one image type every browser copies), the caption as
 * text, and both as HTML for apps that paste rich content. Each app pastes
 * what it understands. Without picture support it falls back to the caption.
 */
const canCopy = typeof navigator !== "undefined" && !!navigator.clipboard;
const copied = ref<number | null>(null);

const asPng = async (blob: Blob): Promise<Blob> => {
  if (blob.type === "image/png") return blob;
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No image"))), "image/png"),
  );
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const copyPost = async (step: ShareStep, i: number) => {
  const text = step.text ?? "";
  const image = step.files.find((f) => f.type.startsWith("image/"));
  const flash = (message: string) => {
    note.value = { ...note.value, [i]: message };
    copied.value = i;
    setTimeout(() => {
      if (copied.value === i) copied.value = null;
    }, 2500);
  };

  if (image && typeof ClipboardItem !== "undefined") {
    // Started on the tap itself: Safari only allows the write while the tap is fresh,
    // so the item takes promises that finish once the picture is in.
    const png = fetch(image.url)
      .then((r) => r.blob())
      .then(asPng);
    const html = png.then(
      (b) =>
        new Promise<Blob>((resolve) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve(
              new Blob(
                [
                  `<img src="${reader.result}" alt="${escapeHtml(image.name)}">` +
                    text
                      .split("\n")
                      .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
                      .join(""),
                ],
                { type: "text/html" },
              ),
            );
          reader.readAsDataURL(b);
        }),
    );
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": png,
          ...(text ? { "text/plain": new Blob([text], { type: "text/plain" }), "text/html": html } : {}),
        }),
      ]);
      flash(step.files.length > 1 ? "Copied with the first picture. Paste it where you’re posting." : "Copied. Paste it where you’re posting.");
      return;
    } catch {
      // Some browsers take only text; the caption still goes.
    }
  }

  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    flash(
      image
        ? "Caption copied. Your browser can’t copy the picture, so save it below and attach it."
        : step.files.length
          ? "Caption copied. Save the file below and add it to your post."
          : "Copied. Paste it where you’re posting.",
    );
  } catch {
    note.value = { ...note.value, [i]: "Copying isn’t allowed here. Select the caption and copy it." };
  }
};

/**
 * On an iPhone a download lands in Files, where WhatsApp's picker doesn't look,
 * so the file goes through the share sheet instead: its Save Video and Save
 * Image put it in Photos. Elsewhere the link downloads as usual.
 */
const isIos =
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

const save = async (e: MouseEvent, i: number, n: number) => {
  const file = ready.value[i]?.[n];
  if (!isIos || !file || !navigator.canShare?.({ files: [file] })) return;
  e.preventDefault();
  try {
    await navigator.share({ files: [file] });
  } catch (err) {
    if ((err as Error).name !== "AbortError") window.location.href = (e.currentTarget as HTMLAnchorElement).href;
  }
};

/**
 * Instagram takes no caption from a link and drops shared text, so the caption
 * goes on the clipboard first. With the files in, the share sheet carries them
 * alone (Instagram shows up for pictures and videos); otherwise Instagram
 * opens and the person pastes.
 */
const instagram = (e: MouseEvent, step: ShareStep, i: number) => {
  markDone(i);
  const files = ready.value[i];
  const paste = step.text ? "Caption copied. Paste it into your Instagram post." : "";
  if (step.text) navigator.clipboard?.writeText(step.text).catch(() => {});
  if (!files?.length) {
    note.value = {
      ...note.value,
      [i]: step.files.length ? `${paste} Save the ${what(step)} below and add it to the post.`.trim() : paste,
    };
    return; // The link opens Instagram.
  }
  e.preventDefault();
  note.value = { ...note.value, [i]: `Pick Instagram in the list. ${paste}`.trim() };
  navigator.share({ files }).catch((err: Error) => {
    if (err.name !== "AbortError") window.open("https://www.instagram.com/", "_blank", "noopener");
  });
};

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
</script>

<template>
  <ol class="space-y-3">
    <li
      v-for="(step, i) in steps"
      :key="i"
      class="rounded-xl px-4 py-4 ring-1 transition"
      :class="done.includes(i) ? 'bg-emerald-50/60 ring-emerald-200' : 'bg-white ring-slate-200'"
    >
      <div class="flex items-start gap-3">
        <span
          class="flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm font-semibold"
          :class="done.includes(i) ? 'bg-emerald-600 text-white' : 'bg-brand-soft text-brand'"
          aria-hidden="true"
        >
          <i v-if="done.includes(i)" class="fa-solid fa-check text-xs"></i>
          <template v-else>{{ i + 1 }}</template>
        </span>
        <div class="min-w-0 flex-1 space-y-3">
          <p class="text-sm font-semibold text-slate-900">
            {{ step.instruction || (step.kind === "share" ? "Share this post" : `${step.label} on ${host(step.url)}`) }}
            <span v-if="done.includes(i)" class="sr-only">(done)</span>
          </p>

          <template v-if="step.kind === 'share'">
            <!-- What goes out, as the person's followers will see it. -->
            <div class="overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-200">
              <div v-if="step.files.length" class="flex gap-2 overflow-x-auto p-2">
                <template v-for="f in step.files" :key="f.file">
                  <img
                    v-if="f.type.startsWith('image/')"
                    :src="f.url"
                    :alt="f.name"
                    class="h-28 w-auto flex-none rounded-md object-cover"
                    loading="lazy"
                  />
                  <span
                    v-else
                    class="flex h-28 w-28 flex-none flex-col items-center justify-center gap-1 rounded-md bg-white px-2 text-center text-xs text-slate-600 ring-1 ring-slate-200"
                  >
                    <i class="fa-solid fa-file text-lg text-slate-400" aria-hidden="true"></i>
                    <span class="line-clamp-2 break-all">{{ f.name }}</span>
                  </span>
                </template>
              </div>
              <p v-if="step.text" class="line-clamp-4 whitespace-pre-line px-3 py-2 text-sm text-slate-700">{{ step.text }}</p>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row">
              <button
                v-if="canShare"
                type="button"
                class="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 font-medium text-white hover:bg-brand-ink disabled:cursor-wait disabled:opacity-70 sm:w-auto"
                :disabled="loading[i] !== undefined"
                @click="share(step, i)"
              >
                <template v-if="loading[i] !== undefined">
                  <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                  Getting the {{ what(step) }} ready… {{ loading[i] }}%
                </template>
                <template v-else>
                  <i class="fa-solid fa-share-nodes" aria-hidden="true"></i>
                  {{ failed[i] ? "Share caption only" : "Share" }}
                </template>
              </button>
              <button
                v-if="canCopy && (step.text || step.files.some((f) => f.type.startsWith('image/')))"
                type="button"
                class="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 font-medium text-brand ring-1 ring-slate-300 hover:bg-slate-50 sm:w-auto"
                @click="copyPost(step, i)"
              >
                <i class="fa-solid" :class="copied === i ? 'fa-check' : 'fa-copy'" aria-hidden="true"></i>
                {{ copied === i ? "Copied" : "Copy" }}
              </button>
            </div>
            <p v-if="note[i]" class="text-xs text-slate-500">{{ note[i] }}</p>

            <div v-if="step.shareLinks.length" class="space-y-1.5">
              <p v-if="canShare || step.files.length" class="text-xs text-slate-500">
                Or post straight to<template v-if="step.files.length">
                  (these send the caption only; add the {{ what(step) }} yourself)</template
                >
              </p>
              <div class="flex flex-wrap gap-2">
                <a
                  v-for="l in step.shareLinks"
                  :key="l.platform"
                  :href="l.url"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium text-white hover:opacity-90"
                  :class="PLATFORMS[l.platform].color"
                  @click="l.platform === 'instagram' ? instagram($event, step, i) : markDone(i)"
                >
                  <i class="fa-brands" :class="PLATFORMS[l.platform].icon" aria-hidden="true"></i>
                  {{ PLATFORMS[l.platform].name }}
                </a>
              </div>
            </div>
            <!--
              Saved to the phone, for what neither share nor copy reaches: a WhatsApp
              broadcast list, or a video, which no browser puts on the clipboard.
            -->
            <div v-if="step.files.length" class="space-y-1.5">
              <p class="text-xs text-slate-500">Save to your {{ isIos || canShare ? "phone" : "computer" }}:</p>
              <div class="flex flex-wrap gap-2">
                <a
                  v-for="(f, n) in step.files"
                  :key="f.file"
                  :href="f.url"
                  :download="f.name"
                  :title="f.name"
                  class="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-brand ring-1 ring-slate-300 hover:bg-slate-50"
                  @click="save($event, i, n)"
                >
                  <i class="fa-solid fa-download" aria-hidden="true"></i>
                  Download {{ fileLabel(step, n) }}
                  <span class="text-xs font-normal text-slate-400">{{ formatSize(f.size) }}</span>
                </a>
              </div>
              <p v-if="canShare" class="text-xs text-slate-400">
                For a broadcast list: save the files, tap Copy for the caption, then send both from WhatsApp.
              </p>
            </div>
          </template>

          <a
            v-else
            :href="step.url"
            target="_blank"
            rel="noopener"
            class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 font-medium text-white hover:bg-brand-ink sm:w-auto"
            @click="markDone(i)"
          >
            {{ step.label }}
            <i class="fa-solid fa-arrow-up-right-from-square text-xs" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </li>
  </ol>
</template>
