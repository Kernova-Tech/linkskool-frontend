<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import { leaderboardService, type CompletionCard } from "@/api/services";
import { useNoIndex } from "./useNoIndex";

/**
 * leaderboard.linkskool.com/d/{code}: an approved task, made to be shared in
 * the group. It says who did what, for whom; never what they sent.
 */
const code = String(useRoute().params.code ?? "");
const card = ref<CompletionCard | null>(null);
const state = ref<"loading" | "missing" | "ready">("loading");
const copied = ref(false);

const line = computed(() =>
  card.value ? `✅ ${card.value.name} completed “${card.value.task}” for ${card.value.organization}!` : "",
);
const whatsApp = computed(() => `https://wa.me/?text=${encodeURIComponent(`${line.value} ${location.href}`)}`);
const day = computed(() =>
  card.value?.approvedAt
    ? new Date(`${card.value.approvedAt.replace(" ", "T")}Z`).toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "",
);

const copy = async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    copied.value = true;
  } catch {
    window.prompt("Copy the link", location.href);
  }
};

const { add, remove } = useNoIndex();
onMounted(async () => {
  add();
  try {
    card.value = await leaderboardService.done(code);
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
    <p v-else-if="state === 'missing'" class="text-slate-600">This card is not available.</p>

    <main v-else-if="card" class="w-full max-w-sm space-y-4 text-center">
      <div class="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white px-6 py-8 shadow-sm">
        <img
          v-if="card.logoUrl"
          :src="card.logoUrl"
          :alt="card.organization"
          class="mx-auto mb-4 h-12 w-auto max-w-[160px] object-contain"
        />
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white">
          <i class="fa-solid fa-check" aria-hidden="true"></i>
        </div>
        <p class="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Task complete</p>
        <h1 class="mt-2 font-display text-xl font-bold text-slate-900">{{ card.task }}</h1>
        <p class="mt-3 text-slate-700">
          Done by <strong>{{ card.name }}</strong><template v-if="card.branch"> · {{ card.branch }}</template>
        </p>
        <p class="mt-1 text-sm text-slate-500">
          {{ card.organization }}<template v-if="day"> · approved {{ day }}</template>
        </p>
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
      <a v-if="card.leaderboardUrl" :href="card.leaderboardUrl" class="block text-sm font-medium text-brand hover:underline">
        See the leaderboard
      </a>
    </main>
  </div>
</template>
