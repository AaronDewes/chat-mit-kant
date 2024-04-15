<template>
  <div class="flex flex-col w-screen h-screen p-8 gap-2">
    <div class="flex gap-2 flex-col w-full flex-grow overflow-scroll">
      <template v-for="message in history" :key="message.id">
        <div
          v-if="message.sender === 'USER'"
          class="rounded-md rounded-br-none max-w-3/4 ml-auto flex bg-green-500 p-4"
        >
          <span>{{
            message.text.replace(
              "Bitte beantworte die folgende Frage auf Deutsch, benutze kein Englisch. Gehe in deiner Antwort nicht auf den Text vor den --- ein, sondern beantworte bitte nur die Frage. ---",
              ""
            )
          }}</span>
        </div>
        <div
          v-if="message.sender === 'CLONE'"
          class="rounded-md rounded-bl-none max-w-1/2 mr-auto bg-teal-500 p-4"
        >
          <span>{{
            message.text ==
            "Greetings, I'm Immanuel Kant. What philosophical questions are you pondering today?"
              ? "Hallo, ich bin Immanuel Kant. Welche philosophischen Fragen beschäftigen Sie heute?"
              : message.text
          }}</span>
        </div>
      </template>
    </div>
    <form @submit.prevent="sendMessage" class="flex flex-row gap-2 w-full">
      <UInput type="text" class="w-auto flex-grow" v-model="newMessage" />
      <UButton :loading="loading" type="submit">Senden</UButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Message } from "~/server/types";

const { params } = useRoute();
const { data } = await useFetch(`/api/conversation/${params.id}`);
const history = ref<Message[]>(data.value!.history);
const newMessage = ref("");
const loading = ref(false);

async function sendMessage() {
  const msg = newMessage.value.trim();
  if (!msg || loading.value) return;
  newMessage.value = "";
  loading.value = true;
  history.value.push({
    text: msg,
    sender: "USER",
    created_at: new Date().toISOString(),
  });
  const { clone_response } = await $fetch(`/api/conversation/${params.id}`, {
    method: "POST",
    body: JSON.stringify(msg),
  });
  history.value.push({
    sender: "CLONE",
    text: clone_response.text,
    created_at: clone_response.created_at,
  });
  speak(clone_response.text);
  loading.value = false;
}

function speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.voice = speechSynthesis.getVoices().find((voice) => voice.lang === "de-DE" && voice.name.includes("Paul"))!;
    console.log(utterance.voice);
    speechSynthesis.speak(utterance);
}
</script>

<style scoped></style>
