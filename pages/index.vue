<template>
  <div
    class="w-screen h-screen flex flex-col gap-2 items-center justify-center"
    id="main"
  >
    <div
      class="kant-circle flex text-center justify-center items-center flex-col mt-auto"
    >
      <img src="~/assets/badge_300_jahre_kant.png" class="w-48 mb-4" />
      <h1 class="text-4xl font-bold">Immanuel Kant</h1>
      <h3 class="text-2xl mb-4">
        Live-Chat zum 300. Geburtstag des großen Denkers
      </h3>
      <UButton
        @click="startConversation"
        size="xl"
        icon="i-heroicons-chat-bubble-left"
        :loading
        >Gespräch beginnen</UButton
      >
    </div>
    <span class="mt-auto mb-3 text-lg bg-slate-700/50 p-4 rounded-lg"
      >Ein Projekt von Aaron Dewes in Zusammenarbeit mit <DelphiLogo class="h-3 inline mr-1 my-auto" /><a
        href="https://delphi.ai"
        class="text-blue-500"
        >delphi.ai</a
      >.
    </span>
  </div>
</template>

<script setup lang="ts">
const loading = ref(false);

async function startConversation() {
  loading.value = true;
  const data = await $fetch("/api/conversation", {
    method: "POST",
  });
  const newId = data.new.conversation_id;
  await navigateTo(`/conversation/${newId}`);
}
</script>

<style scoped>
#main {
  background-image: url("/background.svg");
  background-size: cover;
}
</style>
