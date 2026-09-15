import { mkdirSync, writeFileSync } from "fs";
import { getDocumentId } from "../controllers/document.controllers.js";
import {
  queryStoreForEval,
  runContentRetrival,
} from "../controllers/queryController.js";
import { generateResponse } from "../controllers/queryStreamController.js";
import { evaluateCoverage, evaluateGroundness } from "./evaluation.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

function truncate(str: string, maxLen = 60): string {
  if (!str) return "";
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}
type EvalQuery = {
  query: string;
  expected: boolean;
};

const evalQueries: EvalQuery[] = [
  {
    query: "What is the optical allowance for Band C employees?",
    expected: true,
  },
  {
    query: "Is dental implant treatment covered under the health benefits?",
    expected: true,
  },
  {
    query: "What happens to unused casual leave at the end of the year?",
    expected: true,
  },
  {
    query: "How many days of maternity leave are available to employees?",
    expected: false,
  },
  {
    query: "What benefits are available to interns?",
    expected: true,
  },
  {
    query: "Does the Standard health tier cover dental implants?",
    expected: true,
  },
  {
    query: "What does POL-OPT-8000 refer to?",
    expected: true,
  },
  // {
  //   query:
  //     "I joined the company after January 1, need to take three consecutive days off, and still have some unused leave left at the end of the year. How are my leave entitlements calculated, how far in advance do I need to request the planned leave, and what happens to any unused casual and privilege leave when the year ends?",
  //   expected: true,
  // },
];

const COVERAGE_THRESHOLD = 0.7;
const GROUNDEDNESS_THRESHOLD = 0.7;

type EvalResult = {
  question: string;
  retrievedIds?: string[];
  coverageScore: number | null;
  coverageExplanation: string;
  groundednessScore: number | null;
  groundednessExplanation: string;
  answer: string;
  expected:boolean;
  passed: boolean;
  failReasons: string[];
};

async function runEvalCase(question: string,expected:boolean): Promise<EvalResult> {
  const failReasons: string[] = [];
  const pathIds: string[] = await getDocumentId();
  // console.log(pathIds)
  if (pathIds.length === 0) {
    throw new Error("PATHS IDS NOT PROVIDED");
  }
  const queryId = await runContentRetrival(question, pathIds);
  const queryData = queryStoreForEval.get(queryId);

  if (!queryData) {
    return {
      question,
      retrievedIds: [],
      coverageScore: null,
      coverageExplanation: "",
      groundednessScore: null,
      groundednessExplanation: "",
      answer: "",
      expected:false,
      passed: false,
      failReasons: ["Retrieval returned no queryData (hard failure)"],
    };
  }

  const retrievedIds = queryData.sources.map((s: any) => s.id);

  const [coverage, answer] = await Promise.all([
    evaluateCoverage(question, queryData.sources),
    generateResponse(queryId),
  ]);

  if (coverage.score < COVERAGE_THRESHOLD) {
    failReasons.push(
      `Coverage ${coverage.score} below threshold ${COVERAGE_THRESHOLD}`,
    );
  }

  const groundedness = await evaluateGroundness(
    answer || "",
    queryData.sources,
  );
  if (groundedness.score < GROUNDEDNESS_THRESHOLD) {
    failReasons.push(
      `Groundedness ${groundedness.score} below threshold ${GROUNDEDNESS_THRESHOLD}`,
    );
  }

  return {
    question,
    retrievedIds,
    coverageScore: coverage.score,
    coverageExplanation: coverage.explanation,
    groundednessScore: groundedness.score,
    groundednessExplanation: groundedness.explanation,
    answer: answer || "",
    expected:expected,
    passed: failReasons.length === 0,
    failReasons,
  };
}

async function main() {
  const results: EvalResult[] = [];

  for (const q of evalQueries) {
    console.log(`\nRunning: ${q.query}`);
    try {
      const result = await runEvalCase(q.query,q.expected);
      results.push(result);
    } catch (err) {
      console.error(`Eval case threw for "${q.query}":`, err);
      results.push({
        question:q.query,
        // retrievedIds: [],
        coverageScore: null,
        coverageExplanation: "",
        groundednessScore: null,
        groundednessExplanation: "",
        answer: "",
        expected:q.expected,
        passed: false,
        failReasons: [`Threw error: ${(err as Error).message}`],
      });
    }
  }
  const __dirname=dirname(fileURLToPath(import.meta.url))
  const Reult_DIR=join(__dirname,"../../eval")
  mkdirSync(Reult_DIR,{recursive:true})
  const timestamp = Date.now();
  const outputFile=join(Reult_DIR,`eval-results-${timestamp}.json`)
  writeFileSync(
    outputFile,
    JSON.stringify(results, null, 2),
  );
  console.log(`\nFull results written to eval-results-${Date.now()}.json`);
  console.log("\n============ SUMMARY ============");
  console.table(
    results.map((r) => ({
      question: truncate(r.question, 50),
      coverage: r.coverageScore,
      coverageExplanation: truncate(r.coverageExplanation, 60),
      groundedness: r.groundednessScore,
      groundednessExplanation: truncate(r.groundednessExplanation, 60),
      passed: r.passed===r.expected,
    })),
  );

  const failed = results.filter((r) => !r.passed);
  if (failed.length > 0) {
    console.error(`\n${failed.length}/${results.length} eval cases FAILED:`);
    failed.forEach((f) => {
      console.error(`- ${f.question}`);
      f.failReasons.forEach((r) => console.error(`    ${r}`));
    });
    process.exit(1);
  }

  console.log(`\nAll ${results.length} eval cases passed.`);
}

main().catch((err) => {
  console.error("Eval run crashed:", err);
  process.exit(1);
});
