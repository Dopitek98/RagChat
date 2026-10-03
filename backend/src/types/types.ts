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
  id: number;
  source: string;
  pageContent: string;
  score: number;
  fromLine: number;
  toLine: number;
};

export type LineRange = {
  source: string;
  fromLine: number;
  toLine: number;
};
