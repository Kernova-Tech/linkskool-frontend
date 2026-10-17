<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { FormSession, MyTask } from "@/api/models";
import { ApiError } from "@/api/client";
import { formService } from "@/api/services";
import GoogleSignInButton from "@/components/form/GoogleSignInButton.vue";
import { useNoIndex } from "./leaderboard/useNoIndex";

/**
 * linkskool.com/tasks: every task the signed-in person is on, across the
 * organizations they work for. What to do first, then what is waiting, then
 * what is done, with the note when work came back and the card to share
 * once it is approved.
 */

// The same session the form pages keep, so coming from a task needs no second sign-in.
const SESSION_KEY = "linkskool-form-session";
const readSession = (): FormSession | null => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null");
  } catch {
    return null;
  }
};

const session = ref<FormSession | null>(readSession());
const tasks = ref<MyTask[]>([]);
const state = ref<"signed-out" | "loading" | "ready" | "error">(session.value ? "loading" : "signed-out");
const signingIn = ref(false);
const error = ref("");

const todo = computed(() => tasks.value.filter((t) => t.needsAction));
const waiting = computed(() => tasks.value.filter((t) => !t.needsAction && t.status === "pending"));
const done = computed(() => tasks.value.filter((t) => t.status === "approved"));
const missed = computed(() => tasks.value.filter((t) => !t.needsAction && (t.status === "not_started" || t.status === "rejected")));

const groups = computed(() =>
  [
    { key: "todo", title: "To do", items: todo.value },
    { key: "waiting", title: "Waiting for review", items: waiting.value },
    { key: "done", title: "Done", items: done.value },
    { key: "missed", title: "Closed", items: missed.value },
  ].filter((g) => g.items.length),
);

const status: Record<MyTask["status"], { text: string; tone: string }> = {
  not_started: { text: "Not sent", tone: "bg-slate-100 text-slate-700" },
  pending: { text: "Waiting for review", tone: "bg-sky-50 text-sky-800" },
  rejected: { text: "Please redo it", tone: "bg-red-50 text-red-800" },
  approved: { text: "Approved", tone: "bg-emerald-50 text-emerald-800" },
};

const due = (t: MyTask) => {
  if (!t.deadline) return "";
  const at = new Date(`${t.deadline.replace(" ", "T")}Z`);
  const ms = at.getTime() - Date.now();
  const when = at.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  if (ms < 0) return `Closed ${when}`;
  const hours = Math.round(ms / 3_600_000);
  return hours < 48 ? `Due ${when} · ${hours}h left` : `Due ${when}`;
};

const whatsApp = (t: MyTask) =>
  `https://wa.me/?text=${encodeURIComponent(`✅ I completed “${t.title}” for ${t.organization}! ${t.shareUrl}`)}`;

const load = async () => {
  if (!session.value) return;
  state.value = "loading";
  try {
    tasks.value = await formService.mine(session.value.accessToken);
    state.value = "ready";
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      signOut();
      error.value = "Please sign in again.";
      return;
    }
    error.value = e instanceof Error && e.message ? e.message : "We could not load your tasks.";
    state.value = "error";
  }
};

const signIn = async (idToken: string) => {
  signingIn.value = true;
  error.value = "";
  try {
    session.value = await formService.signIn(idToken);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session.value));
    } catch {
      // Kept in memory for this page.
    }
    await load();
  } catch (e) {
    error.value = e instanceof Error && e.message ? e.message : "We could not sign you in. Please try again.";
  } finally {
    signingIn.value = false;
  }
};

const signOut = () => {
  session.value = null;
  tasks.value = [];
  state.value = "signed-out";
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing kept.
  }
};

const { add, remove } = useNoIndex();
onMounted(() => {
  add();
  document.title = "Your tasks · Linkskool";
  load();
});
onUnmounted(remove);
</script>

<template>
  <div class="min-h-dvh bg-brand-soft px-3 py-6 font-sans sm:py-10">
    <main class="mx-auto w-full max-w-[680px] space-y-4">
      <header class="flex items-end justify-between gap-3">
        <div>
          <p class="text-sm text-slate-500">Linkskool</p>
          <h1 class="font-display text-2xl font-bold text-slate-900">Your tasks</h1>
        </div>
        <p v-if="session" class="text-right text-xs text-slate-500">
          {{ session.email }}<br />
          <button type="button" class="cursor-pointer font-medium text-brand hover:underline" @click="signOut">Sign out</button>
        </p>
      </header>

      <section v-if="state === 'signed-out'" class="rounded-2xl bg-white px-6 py-8 text-center shadow-sm ring-1 ring-slate-200">
        <i class="fa-solid fa-list-check text-3xl text-brand" aria-hidden="true"></i>
        <h2 class="mt-3 font-display text-lg font-semibold text-slate-900">See every task you are on</h2>
        <p class="mx-auto mt-1 max-w-sm text-sm text-slate-600">
          Sign in with the Google account your organization registered you with.
        </p>
        <div class="mt-5" :class="{ 'pointer-events-none opacity-60': signingIn }">
          <GoogleSignInButton @credential="signIn" />
        </div>
        <p v-if="signingIn" class="mt-3 text-sm text-slate-500">Signing you in…</p>
        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
      </section>

      <p v-else-if="state === 'loading'" class="py-16 text-center text-sm text-slate-500">Loading your tasks…</p>

      <p v-else-if="state === 'error'" class="rounded-2xl bg-white px-6 py-8 text-center text-sm text-red-700 shadow-sm ring-1 ring-slate-200">
        {{ error }}
        <button type="button" class="ml-2 cursor-pointer font-medium underline" @click="load">Try again</button>
      </p>

      <template v-else>
        <p v-if="!tasks.length" class="rounded-2xl bg-white px-6 py-10 text-center text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
          No tasks for {{ session?.email }} yet. If you expected some, check that you signed in with the
          email your organization has.
        </p>

        <section v-for="g in groups" :key="g.key" class="space-y-2">
          <h2 class="px-1 text-sm font-semibold text-slate-700">
            {{ g.title }} <span class="font-normal text-slate-500">· {{ g.items.length }}</span>
          </h2>
          <article
            v-for="t in g.items"
            :key="t.link"
            class="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200"
          >
            <div class="flex items-start gap-3">
              <img v-if="t.logoUrl" :src="t.logoUrl" :alt="t.organization" class="h-10 w-10 shrink-0 rounded-lg object-contain" />
              <div class="min-w-0 flex-1">
                <p class="text-xs text-slate-500">{{ t.organization }}</p>
                <p class="font-semibold text-slate-900">{{ t.title }}</p>
                <p v-if="t.deadline" class="mt-0.5 text-xs text-slate-500">{{ due(t) }}</p>
              </div>
              <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium" :class="status[t.status].tone">
                {{ status[t.status].text }}
              </span>
            </div>

            <p v-if="t.status === 'rejected' && t.note" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              “{{ t.note }}”
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
              <a
                v-if="t.needsAction"
                :href="t.link"
                class="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-ink"
              >
                {{ t.status === "rejected" ? "Send it again" : "Do it now" }}
                <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </a>
              <a
                v-else-if="t.status === 'pending' && t.open"
                :href="t.link"
                class="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Open
              </a>
              <template v-if="t.status === 'approved' && t.shareUrl">
                <a
                  :href="whatsApp(t)"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"
                >
                  <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Share in the group
                </a>
                <a
                  :href="t.shareUrl"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  See your card
                </a>
              </template>
            </div>
          </article>
        </section>
      </template>
    </main>
  </div>
</template>
