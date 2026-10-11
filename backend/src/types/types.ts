import { ObjectId } from "mongodb";

export type ContentResult = {
  content: {
    source: string;
    pageContent: string;
    score: number;
    fromLine: number;
    toLine: number;
  };
};

export type Result = {
  source: string;
  pageContent: string;
  score: number;
  fromLine: number;
  toLine: number;
};

export type ResultBm25 = {
  id: ObjectId;
  source: string;
  pageContent: string;
  score: number;
  fromLine: number;
  toLine: number;
};

export type LineRange = {
  source: string;
  FromLine: number;
  ToLine: number;
};

export interface MyDocument extends Document {
  text: string;
  embedding: number[];
  source: string;
  loc: {
    lines: {
      from: number;
      to: number;
    };
  };
}

export type CombinedFinalOutput = {
  response: string;
  reasoning: string;
};

/** Input document structure for MongoDB insertion */
export type MongoHistoryInput = {
  pageContent: string;
  source: string;
  fromLine: number;
  toLine: number;
};
