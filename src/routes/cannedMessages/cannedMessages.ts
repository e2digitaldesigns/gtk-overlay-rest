import express, { Request, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import * as cannnedFunctions from "./functions";

const router = express.Router();
router.use(verifyToken);

router.get("/s/:page/:sort/:sortby", async (req: Request, res: Response) => {
  const { page, sort, sortby } = req.params;
  const searchTerm = req.query?.st || "";

  const data = await cannnedFunctions.searchMessage(
    res.locals.userId,
    String(searchTerm),
    page,
    sort,
    sortby
  );

  res.status(data.resultStatus.responseCode).send(data);
});

router.get("/", async (req: Request, res: Response) => {
  const data = await cannnedFunctions.fetchMessages(res.locals.userId);
  res.status(data.resultStatus.responseCode).send(data);
});

router.post("/", async (req: Request, res: Response) => {
  const { message, name } = req.body;
  const data = await cannnedFunctions.postMessage(res.locals.userId, message, name);
  res.status(data.resultStatus.responseCode).send(data);
});

router.delete("/:messageId", async (req: Request, res: Response) => {
  const data = await cannnedFunctions.deleteMessage(res.locals.userId, req.params.messageId);
  res.status(data.resultStatus.responseCode).send(data);
});

router.put("/:messageId", async (req: Request, res: Response) => {
  const { message, name } = req.body;
  const data = await cannnedFunctions.updateMessage(
    res.locals.userId,
    req.params.messageId,
    message,
    name
  );
  res.status(data.resultStatus.responseCode).send(data);
});

export const cannedMessages = router;
