import express, { Request, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import mongoose from "mongoose";
import { CannedMessageModel } from "../../models/cannedMessages.model";
const ObjectId = mongoose.Types.ObjectId;

const router = express.Router();
router.use(verifyToken);

const MODEL = CannedMessageModel;

router.get("/s/:page/:sort/:sortby", async (req: Request, res: Response) => {
  const { page, sort, sortby } = req.params;
  const searchTerm = req.query?.st || "";
  const documentsPerPage = 10;
  const skip = (Number(page) - 1) * documentsPerPage;

  try {
    const totalDocuments = await MODEL.countDocuments({
      message: { $regex: searchTerm, $options: "i" },
      userId: new ObjectId(res.locals.userId)
    });

    const result = await MODEL.find({
      message: { $regex: searchTerm, $options: "i" },
      userId: new ObjectId(res.locals.userId)
    })
      .sort({ [sortby]: sort === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(documentsPerPage);

    res.status(200).json({
      resultStatus: {
        success: true,
        errors: null,
        responseCode: 200,
        resultMessage: "Your request was successful."
      },
      result: {
        messages: result,
        totalPages: totalDocuments / documentsPerPage
      }
    });
  } catch (error) {
    console.error(error);
    res.status(404).json({
      success: false,
      errors: error,
      responseCode: 404,
      resultMessage: "Your request failed."
    });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.find({ userId: new ObjectId(res.locals.userId) });

    res.status(200).json({
      resultStatus: {
        success: true,
        errors: null,
        responseCode: 200,
        resultMessage: "Your request was successful."
      },
      result: {
        messages: result
      }
    });
  } catch (error) {
    console.error(error);
    res.status(404).json({
      success: false,
      errors: error,
      responseCode: 404,
      resultMessage: "Your request failed."
    });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { message, name } = req.body;
    const result = await MODEL.create({
      userId: res.locals.userId,
      name,
      message
    });

    res.status(200).json({
      resultStatus: {
        success: true,
        errors: null,
        responseCode: 200,
        resultMessage: "Your request was successful."
      },
      result: {
        _id: result?._id,
        name: result?.name,
        message: result?.message
      }
    });
  } catch (error) {
    console.error(error);
    res.status(404).json({
      success: false,
      errors: error,
      responseCode: 404,
      resultMessage: "Your request failed."
    });
  }
});

router.delete("/:messageId", async (req: Request, res: Response) => {
  try {
    await MODEL.deleteOne({ _id: new ObjectId(req.params.messageId) });

    res.status(200).json({
      success: true,
      resultMessage: "Your request was successful."
    });
  } catch (error) {
    console.error(error);
    res.status(404).json({
      success: false,
      errors: error,
      responseCode: 404,
      resultMessage: "Your request failed."
    });
  }
});

router.put("/:messageId", async (req: Request, res: Response) => {
  try {
    const { message, name } = req.body;
    const result = await MODEL.findOneAndUpdate(
      { _id: new ObjectId(req.params.messageId) },
      { message, name },
      { new: true }
    );

    res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    console.error(error);
    res.status(404).json({
      success: false,
      errors: error,
      responseCode: 404,
      resultMessage: "Your request failed."
    });
  }
});

export const cannedMessages = router;
