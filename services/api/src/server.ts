import { app } from "./app.js";
import { env } from "./common/config/env.js";
import { startSchedulers } from "./common/lib/scheduler.js";
import { initFirebase } from "./modules/notifications/fcm.service.js";

initFirebase();
startSchedulers();

if (process.env.ENABLE_QUEUE_WORKERS === "true") {
  import("./common/lib/queue.js")
    .then(({ startQueueWorkers }) => startQueueWorkers())
    .catch((error) => {
      console.warn("Queue workers disabled:", (error as Error).message);
    });
}

app.listen(env.PORT, () => {
  console.log(`Campus Lab API listening on ${env.PORT}`);
});
