import { createApp } from "./app.js";

const app = await createApp();
app.listen(3100, process.env.API_HOST ?? "127.0.0.1", () => {
  console.info("CareProbe API ready on port 3100 (local educational lab)");
});
