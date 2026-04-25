import { createApp } from "./app.js";

const port = process.env.PORT || 3001;
const app = createApp();

app.listen(port, () => {
  console.log(`Orka API listening on port ${port}`);
});
