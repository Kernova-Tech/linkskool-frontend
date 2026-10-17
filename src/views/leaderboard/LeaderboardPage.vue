<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { leaderboardService, type BoardPeriod, type BoardRow, type PublicBoard } from "@/api/services";
import { useNoIndex } from "./useNoIndex";

/**
 * leaderboard.linkskool.com/l/{token}: how an organization's staff or its
 * branches did on its tasks, one at a time. Both rank the same way: how much
 * of what was assigned was approved, then how much was on time.
 */
const route = useRoute();
const router = useRouter();
const token = String(route.params.token ?? "");
const board = ref<PublicBoard | null>(null);
const state = ref<"loading" | "missing" | "ready">("loading");

// What is shown lives in the address, so a shared link opens on the same view.
const scope = ref<"staff" | "branches">(route.query.by === "branches" ? "branches" : "staff");
const period = ref<BoardPeriod>((["month", "last_month", "all"] as const).find((p) => p === route.query.period) ?? "month");
const task = ref(typeof route.query.task === "string" ? route.query.task : "");
/** The period's tasks stay pickable while one of them is chosen. */
const taskOptions = ref<PublicBoard["tasks"]>([]);

const rows = computed<BoardRow[]>(() => (scope.value === "staff" ? (board.value?.staff ?? []) : (board.value?.branches ?? [])));
const podium = computed(() => rows.value.filter((r) => r.rank <= 3 && r.approved > 0).slice(0, 3));
const rest = computed(() => rows.value.filter((r) => !podium.value.includes(r)));
// Second, first, third: the winner in the middle, raised.
const podiumOrder = computed(() => {
  const [first, second, third] = podium.value;
  return [second, first, third].filter((r): r is BoardRow => !!r);
});

const scopes = [
  { key: "staff", label: "Staff" },
  { key: "branches", label: "Branches" },
] as const;
const tasksSummary = computed(() => {
  const tasks = board.value?.tasks ?? [];
  return tasks.length === 1 ? tasks[0]!.title : `${tasks.length} tasks · ${board.value?.periodLabel ?? ""}`;
});

const medal = (rank: number) => ["🥇", "🥈", "🥉"][rank - 1] ?? String(rank);
const sub = (r: BoardRow) => (scope.value === "staff" ? (r.branch ?? "") : `${r.staff} ${r.staff === 1 ? "person" : "people"}`);
const barTone = (rate: number) => (rate >= 80 ? "bg-emerald-500" : rate >= 40 ? "bg-brand" : "bg-amber-500");

const load = async () => {
  state.value = board.value ? "ready" : "loading";
  try {
    board.value = await leaderboardService.board(token, period.value, task.value || undefined);
    if (!task.value) taskOptions.value = board.value.tasks;
    document.title = `${board.value.organization} leaderboard`;
    state.value = "ready";
  } catch {
    state.value = "missing";
  }
};

watch([scope, period, task], () =>
  router.replace({
    query: {
      by: scope.value === "branches" ? "branches" : undefined,
      period: period.value === "month" ? undefined : period.value,
      task: task.value || undefined,
    },
  }),
);
watch(period, () => {
  task.value = "";
  load();
});
watch(task, load);

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
      <p v-else-if="state === 'missing'" class="py-20 text-center text-slate-600">This leaderboard is not available.</p>

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

          <div class="mt-4 inline-flex rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200" role="tablist" aria-label="Rank">
            <button
              v-for="s in scopes"
              :key="s.key"
              type="button"
              role="tab"
              :aria-selected="scope === s.key"
              class="cursor-pointer rounded-full px-5 py-1.5 text-sm font-semibold transition"
              :class="scope === s.key ? 'bg-brand text-white' : 'text-slate-600 hover:text-slate-900'"
              @click="scope = s.key"
            >
              {{ s.label }}
            </button>
          </div>
          <div class="mt-3 flex flex-wrap justify-center gap-2">
            <select v-model="period" class="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm" aria-label="Period">
              <option value="month">This month</option>
              <option value="last_month">Last month</option>
              <option value="all">All time</option>
            </select>
            <select
              v-if="taskOptions.length > 1"
              v-model="task"
              class="max-w-[16rem] rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm"
              aria-label="Task"
            >
              <option value="">All tasks</option>
              <option v-for="t in taskOptions" :key="t.token" :value="t.token">{{ t.title }}</option>
            </select>
          </div>
        </header>

        <p v-if="!board.tasks.length" class="rounded-lg bg-white px-4 py-10 text-center text-sm text-slate-500">
          No tasks yet for {{ board.periodLabel }}.
        </p>

        <template v-else>
          <!-- The top three -->
          <ol v-if="podium.length" class="grid grid-cols-3 items-end gap-2 sm:gap-3">
            <li
              v-for="r in podiumOrder"
              :key="`${scope}-${r.rank}-${r.name}`"
              class="rounded-2xl bg-white px-2 pb-4 text-center shadow-sm ring-1"
              :class="r.rank === 1 ? 'pt-6 ring-amber-300' : 'pt-4 ring-slate-200'"
            >
              <span class="block text-3xl sm:text-4xl" aria-hidden="true">{{ medal(r.rank) }}</span>
              <span class="mt-2 block truncate text-sm font-semibold text-slate-900">{{ r.name }}</span>
              <span class="block min-h-4 truncate text-xs text-slate-500">{{ sub(r) }}</span>
              <span class="mt-2 block font-display text-2xl font-bold text-slate-900">{{ r.rate }}%</span>
              <span class="block text-xs text-slate-500">{{ r.approved }}/{{ r.assigned }} done</span>
            </li>
          </ol>

          <!-- Everyone else -->
          <section v-if="rest.length" class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <ol class="divide-y divide-slate-100">
              <li v-for="r in rest" :key="`${scope}-${r.rank}-${r.name}`" class="flex items-center gap-3 px-4 py-3">
                <span class="w-7 text-center text-sm font-semibold text-slate-500">{{ r.rank }}</span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-slate-800">{{ r.name }}</span>
                  <span v-if="sub(r)" class="block truncate text-xs text-slate-500">{{ sub(r) }}</span>
                </span>
                <span class="hidden h-2 w-24 overflow-hidden rounded-full bg-slate-100 sm:block">
                  <span class="block h-full rounded-full" :class="barTone(r.rate)" :style="{ width: `${r.rate}%` }"></span>
                </span>
                <span class="w-16 text-right">
                  <span class="block font-semibold text-slate-900">{{ r.rate }}%</span>
                  <span class="block text-xs text-slate-500">{{ r.approved }}/{{ r.assigned }}</span>
                </span>
              </li>
            </ol>
          </section>

          <details class="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
            <summary class="cursor-pointer text-sm font-semibold text-slate-900">{{ tasksSummary }}</summary>
            <ul class="mt-2 divide-y divide-slate-100">
              <li v-for="t in board.tasks" :key="t.token" class="flex items-center gap-3 py-2 text-sm">
                <span class="min-w-0 flex-1 truncate text-slate-800">{{ t.title }}</span>
                <span class="text-slate-500">{{ t.done }}/{{ t.assigned }} done</span>
              </li>
            </ul>
          </details>
          <p class="text-center text-xs text-slate-500">
            Ranked by how much of what was assigned was approved, then how much was on time.
          </p>
        </template>
      </template>
    </main>
  </div>
</template>
