<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import { leaderboardService, type Badge } from "@/api/services";
import { useNoIndex } from "./useNoIndex";

/** leaderboard.linkskool.com/b/{code}: a reward's badge, made to be shared in the group. */
const code = String(useRoute().params.code ?? "");
const badge = ref<Badge | null>(null);
const state = ref<"loading" | "missing" | "ready">("loading");
const copied = ref(false);

const line = computed(() => (badge.value ? `🏆 ${badge.value.recipient} won ${badge.value.title}!` : ""));
const whatsApp = computed(() => `https://wa.me/?text=${encodeURIComponent(`${line.value} ${location.href}`)}`);

const copy = async () => {
  await navigator.clipboard.writeText(location.href);
  copied.value = true;
};

const { add, remove } = useNoIndex();
onMounted(async () => {
  add();
  try {
    badge.value = await leaderboardService.badge(code);
    document.title = line.value;
    state.value = "ready";
  } catch {
    state.value = "missing";
  }
});
onUnmounted(remove);
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center bg-brand-soft px-4 py-10 font-sans">
    <p v-if="state === 'loading'" class="text-sm text-slate-500">Loading…</p>
    <p v-else-if="state === 'missing'" class="text-slate-600">This badge is not available.</p>

    <main v-else-if="badge" class="w-full max-w-sm space-y-4 text-center">
      <div class="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white px-6 py-8 shadow-sm">
        <img
          v-if="badge.logoUrl"
          :src="badge.logoUrl"
          :alt="badge.organization"
          class="mx-auto mb-4 h-12 w-auto max-w-[160px] object-contain"
        />
        <div class="text-6xl">🏆</div>
        <p class="mt-4 text-sm text-slate-500">{{ badge.organization }}</p>
        <h1 class="mt-1 font-display text-2xl font-bold text-slate-900">{{ badge.recipient }}</h1>
        <p v-if="badge.branch" class="text-sm text-slate-500">{{ badge.branch }}</p>
        <p class="mt-4 text-lg font-semibold text-amber-700">{{ badge.title }}</p>
        <p v-if="badge.periodLabel" class="text-sm text-slate-500">{{ badge.periodLabel }}</p>
        <p v-if="badge.message" class="mt-4 whitespace-pre-line text-sm text-slate-700">{{ badge.message }}</p>
      </div>

      <div class="flex gap-2">
        <a
          :href="whatsApp"
          target="_blank"
          rel="noopener"
          class="flex-1 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white"
          >Share on WhatsApp</a
        >
        <button
          type="button"
          class="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          @click="copy"
        >
          {{ copied ? "Copied" : "Copy link" }}
        </button>
      </div>
    </main>
  </div>
</template>
