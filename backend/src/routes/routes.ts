import { Router } from "express";
import { sendAndReceiveMessage } from "../invoke/invoke.js";

const router = Router();

router.post("/", async (req: any, res: any) => {
  try {
    console.log("Received query:", req.body.query);
    console.log("Received type of search:", req.body.searchType);

    const result = await sendAndReceiveMessage(
      req.body.query,
      req.body.searchType,
    );

    console.log("Sending response:", result);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ message: "Failed to send query" });
  }
});

export default router;
