import { Router } from "express";
import { sendAndReceiveMessage } from "../invoke/invoke.js";
import { findHistory, findQueryResult } from "../mongo/mongoClientFactory.js";

const router = Router();

router.post("/embeddings", async (req: any, res: any) => {
  try {
    console.log("Received query:", req.body.query);
    console.log("Received type of search:", req.body.searchType);

    const existingResult = await findQueryResult(
      req.body.query,
      req.body.searchType,
    );

    if (
      existingResult &&
      "queryResult" in existingResult &&
      "queryReasoning" in existingResult
    ) {
      const result = [
        existingResult.queryResult,
        existingResult.queryReasoning,
      ];
      return res.status(200).json(result);
    }

    const result = await sendAndReceiveMessage(
      req.body.query,
      req.body.searchType,
    );

    // console.log("Sending response:", JSON.stringify(result));
    res.status(201).json(result);
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ message: "Failed to send query" });
  }
});

router.get("/history", async (req: any, res: any) => {
  try {
    const existingResult = await findHistory();

    console.log("Sending response:", JSON.stringify(existingResult));
    res.status(200).json(existingResult);
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ message: "Failed to send query" });
  }
});

export default router;
