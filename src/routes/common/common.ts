import express, { Request, Response } from "express";
import { TemplateModel } from "./../../models/templates.model";
import { socials } from "./commonSocials";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await TemplateModel.find();

    const returnData = {
      result: {
        socials,
        templates: result
      },

      resultStatus: {
        errors: null,
        responseCode: 200,
        resultMessage: "Application data loaded successfully",
        success: true
      }
    };

    res.status(200).json(returnData);
  } catch (error) {
    res.status(500).send({
      errors: error,
      responseCode: 500,
      resultMessage: "Application data not loaded successfully",
      status: "error",
      success: false
    });
  }
});

export const common = router;
