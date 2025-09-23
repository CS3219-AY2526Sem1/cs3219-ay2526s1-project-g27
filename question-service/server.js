import http from "http";
import index from "./index.js";
import { connectToDB } from "./repository/question-repository.js";
import { seedTestQuestions } from "./seed/question-seed.js";

const port = 3013;

const server = http.createServer(index);

await connectToDB()
  .then(async () => {
    console.log("MongoDB Connected!");

    await seedTestQuestions();

    server.listen(port);
    console.log(
      "Question service server listening on http://localhost:" + port
    );
  })
  .catch((err) => {
    console.error("Failed to connect to DB");
    console.error(err);
  });
