<template>
  <div id="main">
    <div class="flex flex-col w-screen h-screen px-8 py-2 gap-2">
      <NuxtLink to="/" class="ml-auto w-fit"
        ><UButton size="sm">Gespräch beenden</UButton></NuxtLink
      >
      <div class="flex gap-2 flex-col w-full flex-grow overflow-scroll">
        <template v-for="message in history" :key="message.id">
          <div
            v-if="message.sender === 'USER'"
            class="rounded-md rounded-br-none max-w-3/4 ml-8 w-fit flex bg-green-600 p-4 msg"
          >
            <span>{{
              message.text.replace(
                "Bitte schreibe deine Antwort auf Deutsch, benutze auf keinen Fall Englisch. Als ursprünglich deutschsprachiger Philosoph verstehst du Deutsch. Gehe in deiner Antwort nicht auf den Text vor den drei Strichen ein. Die Frage/Antwort des Nutzers findest du nach den drei Strichen. --- ",
                ""
              )
            }}</span>
          </div>
          <div
            v-if="message.sender === 'CLONE'"
            class="rounded-md rounded-bl-none max-w-1/2 bg-teal-600 p-4 mr-8 w-fit msg"
          >
            <span>{{
              message.text ==
              "Greetings, I'm Immanuel Kant. What philosophical questions are you pondering today?"
                ? "Hallo, ich bin Immanuel Kant. Welche philosophischen Fragen beschäftigen Sie heute?"
                : message.text.replaceAll(/\[\d+\]/g, "").replaceAll(" .", ".")
            }}</span>
          </div>
        </template>
      </div>
      <form
        @submit.prevent="sendMessage"
        class="flex flex-row gap-2 w-full items-center"
      >
        <UInput
          type="text"
          class="w-auto flex-grow"
          v-model="newMessage"
          size="xl"
        />
        <UButton :loading="loading" type="submit" size="xl">Senden</UButton>
      </form>
      <div class="flex flex-row items-center justify-center gap-4">
        <DelphiLogo class="h-4 my-auto" />
        Unterstützt von Delphi.ai.
      </div>
    </div>
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
  clone_response.text = clone_response.text.replaceAll(/\[\d+\]/g, "");
  history.value.push({
    sender: "CLONE",
    text: clone_response.text,
    created_at: clone_response.created_at,
  });
  loading.value = false;
}
</script>

<style scoped>
#main {
  background-image: url("/background.svg");
  background-size: cover;
}

#main > div {
  backdrop-filter: blur(15px);
}

.msg {
  box-shadow: 0px 0px 50px -10px rgba(255, 255, 255, 0.75);
}
</style>
