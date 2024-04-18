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
            <div class="lds-ellipsis"   v-if="message.text.length === 0">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
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
  // Open a websocket connection to /api/conversation/ws
  const wsProtocol = location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${wsProtocol}://${location.host}/api/ws`);
  // Wait for the connection to be established
  await new Promise((resolve) => (ws.onopen = resolve));
  ws.send(JSON.stringify({ id: params.id, body: msg }));
  history.value.push({
    sender: "CLONE",
    text: "",
    created_at: "",
  });
  // The response is sent in chunks over the websocket, we need to wait for the last chunk
  await new Promise<void>((resolve) => {
    ws.onmessage = ({ data }: { data: string }) => {
      if (data === "[DONE]") {
        ws.close();
        resolve();
      } else {
        history.value[history.value.length - 1].text += data;
      }
    };
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

.lds-ellipsis {
  /* change color here */
  color: #1c4c5b;
}
.lds-ellipsis,
.lds-ellipsis div {
  box-sizing: border-box;
}
.lds-ellipsis {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
  /* change size by scaling */
  transform: scale(0.4);
  margin-top: -20px;
  margin-bottom: -20px;
}
.lds-ellipsis div {
  position: absolute;
  top: 33.33333px;
  width: 13.33333px;
  height: 13.33333px;
  border-radius: 50%;
  background: #fff;
  animation-timing-function: cubic-bezier(0, 1, 1, 0);
}
.lds-ellipsis div:nth-child(1) {
  left: 8px;
  animation: lds-ellipsis1 0.6s infinite;
}
.lds-ellipsis div:nth-child(2) {
  left: 8px;
  animation: lds-ellipsis2 0.6s infinite;
}
.lds-ellipsis div:nth-child(3) {
  left: 32px;
  animation: lds-ellipsis2 0.6s infinite;
}
.lds-ellipsis div:nth-child(4) {
  left: 56px;
  animation: lds-ellipsis3 0.6s infinite;
}
@keyframes lds-ellipsis1 {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes lds-ellipsis3 {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(0);
  }
}
@keyframes lds-ellipsis2 {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(24px, 0);
  }
}
</style>
