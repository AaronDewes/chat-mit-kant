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
            class="ml-auto w-fit pl-8"
            :id="message.id"
          >
            <div
              class="rounded-md rounded-br-none max-w-3/4 ml-8 w-fit flex bg-green-600 p-4 msg"
            >
              <span>{{ message.text.replace(MSG_PREFIX, "") }}</span>
            </div>
          </div>
          <div
            v-if="message.sender === 'CLONE'"
            class="mr-auto w-fit pr-8 flex gap-2"
            :id="message.id"
          >
            <img src="~/assets/kant-kopf.svg" class="h-12 rounded-full" />
            <div
              class="rounded-md rounded-bl-none max-w-1/2 bg-teal-600 p-4 mr-8 w-fit msg"
            >
              <span
                v-if="
                  message.text.trim() ==
                  'Greetings, I\'m Immanuel Kant. What philosophical questions are you pondering today?'
                "
              >
                Guten Tag, hier Immanuel Kant. Was beschäftigt Sie heute?
              </span>
              <span
                v-else-if="
                  isInvalidMsg(cleanMsg(message.text)) &&
                  (!loading || lastMsgId !== message.id)
                "
              >
                {{ randomError(message.id) }}
                <DevOnly>
                  {{ message.text }}
                </DevOnly>
              </span>
              <span v-else-if="!isInvalidMsg(cleanMsg(message.text))">{{
                cleanMsg(
                  message.text
                    .trim()
                    .replaceAll(/\[\d+\]/g, "")
                    .replaceAll(" .", ".")
                )
              }}</span>
              <div
                class="lds-ellipsis"
                v-if="
                  message.text.length === 0 ||
                  (loading &&
                    isInvalidMsg(cleanMsg(message.text)) &&
                    lastMsgId === message.id)
                "
              >
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
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
        Ermöglicht von Delphi.ai.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Message } from "~/server/types";
import { MSG_PREFIX } from "~/utils/consts";

const { params } = useRoute();
const { data } = await useFetch(`/api/conversation/${params.id}`);
const history = ref<Message[]>(
  data.value!.history.map((item) => ({ ...item, id: crypto.randomUUID() }))
);
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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

function cleanMsg(msg: string) {
  return msg
    .trim()
    .replaceAll("I'm sorry, but I can't comply with that request. ", "")
    .replaceAll(
      "I'm sorry, but I can't provide the response you're asking for. ",
      ""
    );
}

function isInvalidMsg(msg: string) {
  return (
    msg.length === 0 ||
    msg.includes("request") ||
    msg.includes("English") ||
    msg.includes("I'm") ||
    msg.includes("I must") ||
    msg.includes("confess") ||
    msg.length === 0
  );
}

const lastMsgId = computed(() => history.value[history.value.length - 1].id);

const errorMessages = [
  "In Königsberg ist gerade das WLAN zusammengebrochen, wie unpreußisch! Bitte stellen Sie Ihre Frage erneut.",
  "Ordnung und Disziplin sind die Grundlage des preußischen Staates, aber scheinbar nicht dieses Computers. Bitte entschuldigen Sie die Unannehmlichkeiten und stellen Sie Ihre Frage bitte erneut.",
  "Das Ding an sich ist unerkennbar, ebenso wie der Grund für dieses technische Problem. Bitte stellen Sie Ihre Frage erneut.",
];

function seededRandomNumber(seed: string) {
  // Convert to string to bytes, and use these bytes as seed for the PRNG
  const seedArray = new TextEncoder().encode(seed);
  const seedNumber = seedArray.reduce((acc, byte) => acc * byte, 1);
  // Turn that into a number between 0 and 1
  return (seedNumber % 1000) / 1000;
}

function randomError(seed: string) {
  return errorMessages[Math.floor(seededRandomNumber(seed) * errorMessages.length)];
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
