<template>
  <div class="w-screen h-screen flex flex-col gap-2 items-center justify-center">
    <div class="kant-circle flex text-center justify-center items-center flex-col mt-auto">
      <h1 class="text-4xl font-bold">Immanuel Kant</h1>
      <h3 class="text-2xl mb-4">Den Philosophen neu erleben</h3>
      <UButton @click="startConversation">Gespräch beginnen</UButton>
    </div>
    <span class="mt-auto mb-3 text-sm">Ein Projekt von Aaron Dewes</span>
  </div>
</template>

<script setup lang="ts">
async function startConversation() {
  const data = await $fetch("/api/conversation", {
    method: "POST"
  });
  const newId = data.new.conversation_id;
  await navigateTo(`/conversation/${newId}`);
}
</script>

<style scoped>

</style>