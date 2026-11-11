<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import { certificateService, type CertificateCheck } from "@/api/services";
import { useNoIndex } from "./leaderboard/useNoIndex";

/**
 * linkskool.com/certificates/{code}: where a certificate's QR code leads, so
 * anyone handed one can see it is genuine and who it was given to.
 */
const code = String(useRoute().params.code ?? "").toUpperCase();
const cert = ref<CertificateCheck | null>(null);
const state = ref<"loading" | "missing" | "ready">("loading");

const issued = (at: string) =>
  new Date(at.replace(" ", "T")).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

const { add, remove } = useNoIndex();
onMounted(async () => {
  add();
  try {
    cert.value = await certificateService.verify(code);
    document.title = `${cert.value.recipient}: certificate | LinkSkool`;
    state.value = "ready";
  } catch {
    state.value = "missing";
  }
});
onUnmounted(remove);
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center bg-brand-soft px-4 py-10 font-sans">
    <p v-if="state === 'loading'" class="text-sm text-slate-500">Checking the certificate…</p>

    <main v-else-if="state === 'missing'" class="w-full max-w-sm rounded-2xl bg-white px-6 py-8 text-center shadow-sm">
      <i class="fa-solid fa-circle-xmark text-4xl text-red-500" aria-hidden="true"></i>
      <h1 class="mt-3 text-lg font-semibold text-slate-900">No certificate has this code</h1>
      <p class="mt-2 text-sm text-slate-600">
        <span class="font-mono">{{ code }}</span> was not issued by LinkSkool. Check the code against the one printed on the
        certificate.
      </p>
    </main>

    <main v-else-if="cert" class="w-full max-w-2xl space-y-4">
      <div class="rounded-2xl bg-white px-6 py-6 text-center shadow-sm">
        <p class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
          <i class="fa-solid fa-circle-check" aria-hidden="true"></i> Genuine LinkSkool certificate
        </p>
        <h1 class="mt-4 font-display text-2xl font-bold text-slate-900">{{ cert.recipient }}</h1>
        <p class="mt-1 text-slate-700">{{ cert.title }}</p>
        <dl class="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-slate-500">
          <div>
            <dt class="mr-1 inline">Issued</dt>
            <dd class="inline font-medium text-slate-700">{{ issued(cert.issuedAt) }}</dd>
          </div>
          <div>
            <dt class="mr-1 inline">Certificate ID</dt>
            <dd class="inline font-mono font-medium text-slate-700">{{ cert.code }}</dd>
          </div>
        </dl>
      </div>
      <img
        v-if="cert.imageUrl"
        :src="cert.imageUrl"
        :alt="`Certificate for ${cert.recipient}`"
        class="w-full rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
      />
    </main>
  </div>
</template>
