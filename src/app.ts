if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

import { Server } from "http";
import express, { Express, NextFunction, Request, Response } from "express";

import { routing } from "./routes/index";
import { connectMongo } from "./startUpServices/mongoose";
import { socketMaker } from "./startUpServices/socket";
import { TwitchBotter } from "./twitchBot/twitchBotter";

const app: Express = express();
app.use(require("cors")());

Sentry.init({
  dsn: "https://18012a24fbaa294a82804d0b731579d1@o251986.ingest.us.sentry.io/4506995180961792",
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({ app }),
    nodeProfilingIntegration()
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0
});

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

const PORT = process.env.PORT || 8001;
const server: Server = app.listen(PORT, () =>
  console.log(`Step 01) Server is listening on port ${PORT}`)
);

connectMongo();
const io = socketMaker(server);
new TwitchBotter(app, io);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.io = io;
  return next();
});

routing(app);

// The error handler must be registered before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

app.get("/", async (req: Request, res: Response) => {
  res.send("GTK REST Service");
});
