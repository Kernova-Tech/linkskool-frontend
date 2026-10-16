<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import { leaderboardService, type BoardPeriod, type PublicBoard } from "@/api/services";
import { useNoIndex } from "./useNoIndex";

/** leaderboard.linkskool.com/l/{token}: how an organization's staff and branches did on its tasks. */
const token = String(useRoute().params.token ?? "");
const board = ref<PublicBoard | null>(null);
const state = ref<"loading" | "missing" | "ready">("loading");
const period = ref<BoardPeriod>("month");
const day = (at: string) =>
  new Date(at.replace(" ", "T") + "Z").toLocaleDateString(undefined, { day: "numeric", month: "short" });
const medal = (rank: number) => ["🥇", "🥈", "🥉"][rank - 1] ?? String(rank);

const load = async () => {
  state.value = "loading";
  try {
    board.value = await leaderboardService.board(token, period.value);
    document.title = `${board.value.organization} leaderboard`;
    state.value = "ready";
  } catch {
    state.value = "missing";
  }
};

const { add, remove } = useNoIndex();
onMounted(() => {
  add();
  load();
});
onUnmounted(remove);
</script>

<template>
  <div class="min-h-dvh bg-brand-soft px-3 py-6 font-sans sm:py-10">
    <main class="mx-auto w-full max-w-[680px] space-y-4">
      <p v-if="state === 'loading'" class="py-20 text-center text-sm text-slate-500">Loading…</p>
      <p v-else-if="state === 'missing'" class="py-20 text-center text-slate-600">
        This leaderboard is not available.
      </p>

      <template v-else-if="board">
        <header class="text-center">
          <img
            v-if="board.logoUrl"
            :src="board.logoUrl"
            :alt="board.organization"
            class="mx-auto mb-3 h-16 w-auto max-w-[200px] object-contain"
          />
          <p class="text-sm text-slate-500">{{ board.organization }}</p>
          <h1 class="font-display text-2xl font-bold text-slate-900">Leaderboard</h1>
          <select
            v-model="period"
            class="mt-3 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm"
            aria-label="Period"
            @change="load"
          >
            <option value="month">This month</option>
            <option value="last_month">Last month</option>
            <option value="all">All time</option>
          </select>
        </header>

        <p v-if="!board.tasks.length" class="rounded-lg bg-white px-4 py-10 text-center text-sm text-slate-500">
          No tasks yet for {{ board.periodLabel }}.
        </p>

        <template v-else>
          <section class="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <h2 class="px-4 pt-4 text-sm font-semibold text-slate-900">
              Tasks · {{ board.periodLabel }}
            </h2>
            <ul class="divide-y divide-slate-100">
              <li v-for="(t, i) in board.tasks" :key="i" class="flex items-center gap-3 px-4 py-3">
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-slate-800">{{ t.title }}</span>
                  <span v-if="t.deadline" class="block text-xs text-slate-500">Deadline {{ day(t.deadline) }}</span>
                </span>
                <span class="text-sm text-slate-600">{{ t.done }}/{{ t.assigned }} done</span>
              </li>
            </ul>
          </section>

          <section class="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <h2 class="px-4 pt-4 text-sm font-semibold text-slate-900">Branches</h2>
            <ol class="divide-y divide-slate-100">
              <li v-for="b in board.branches" :key="b.id ?? 0" class="flex items-center gap-3 px-4 py-3">
                <span class="w-7 text-center font-semibold">{{ medal(b.rank) }}</span>
                <span class="flex-1 text-slate-800">{{ b.name }}</span>
                <span class="text-right">
                  <span class="block font-semibold text-slate-900">{{ b.rate }}%</span>
                  <span class="block text-xs text-slate-500">{{ b.approved }}/{{ b.assigned }}</span>
                </span>
              </li>
            </ol>
          </section>

          <section class="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <h2 class="px-4 pt-4 text-sm font-semibold text-slate-900">Staff</h2>
            <ol class="divide-y divide-slate-100">
              <li v-for="(s, i) in board.staff" :key="i" class="flex items-center gap-3 px-4 py-3">
                <span class="w-7 text-center font-semibold">{{ medal(s.rank) }}</span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-slate-800">{{ s.name }}</span>
                  <span v-if="s.branch" class="block text-xs text-slate-500">{{ s.branch }}</span>
                </span>
                <span class="text-sm text-slate-600">{{ s.approved }} done</span>
              </li>
            </ol>
          </section>
        </template>
      </template>
    </main>
  </div>
</template>
