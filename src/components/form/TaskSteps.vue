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

/** The share sheet must open on the tap itself, so files are fetched ahead of it. */
const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
const ready = ref<Record<number, File[]>>({});
onMounted(() => {
  if (!canShare) return;
  props.steps.forEach(async (step, i) => {
    if (step.kind !== "share" || !step.files.length) return;
    try {
      const files = await Promise.all(
        step.files.map(async (f) => new File([await (await fetch(f.url)).blob()], f.name, { type: f.type })),
      );
      if (navigator.canShare?.({ files })) ready.value = { ...ready.value, [i]: files };
    } catch {
      // Shared without the files; they can still download them.
    }
  });
});

const note = ref<Record<number, string>>({});
const share = async (step: ShareStep, i: number) => {
  const files = ready.value[i];
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
    flash(image ? "Caption copied. Your browser can’t copy the picture, so attach it yourself." : "Copied. Paste it where you’re posting.");
  } catch {
    note.value = { ...note.value, [i]: "Copying isn’t allowed here. Select the caption and copy it." };
  }
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
                class="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 font-medium text-white hover:bg-brand-ink sm:w-auto"
                @click="share(step, i)"
              >
                <i class="fa-solid fa-share-nodes" aria-hidden="true"></i> Share
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
              <p v-if="canShare" class="text-xs text-slate-500">Or post straight to</p>
              <div class="flex flex-wrap gap-2">
                <a
                  v-for="l in step.shareLinks"
                  :key="l.platform"
                  :href="l.url"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium text-white hover:opacity-90"
                  :class="PLATFORMS[l.platform].color"
                  @click="markDone(i)"
                >
                  <i class="fa-brands" :class="PLATFORMS[l.platform].icon" aria-hidden="true"></i>
                  {{ PLATFORMS[l.platform].name }}
                </a>
              </div>
            </div>
            <!-- A platform link carries only text; without the share sheet, files are attached by hand. -->
            <p v-if="step.files.length && !ready[i]" class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
              <span>Attach with your post:</span>
              <a
                v-for="f in step.files"
                :key="f.file"
                :href="f.url"
                :download="f.name"
                class="font-medium text-brand hover:underline"
              >
                <i class="fa-solid fa-download mr-0.5" aria-hidden="true"></i>{{ f.name }} ({{ formatSize(f.size) }})
              </a>
            </p>
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
