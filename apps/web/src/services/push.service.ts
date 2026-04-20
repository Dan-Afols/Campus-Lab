import api from "@/services/api";

export async function subscribePush(subscription: PushSubscription) {
  await api.post("/push/subscribe", { subscription });
}
