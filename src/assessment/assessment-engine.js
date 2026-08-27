import { scoreOpenAnswer } from "./open-answer.js?v=20260827-1";

export function scoreQuestion(question, answer) {
  if (question.type === "open" || question.type === "scenario") return scoreOpenAnswer(question, answer);
  const unanswered = answer === undefined || answer === null || answer === "";
  if (unanswered) return { score: 0, status: "unanswered", matchedConcepts: [], missingConcepts: [] };
  const correct = answer === question.correct;
  return { score: correct ? 1 : 0, status: correct ? "correct" : "review", matchedConcepts: [], missingConcepts: [] };
}

function addBucket(buckets, id, earned, max) {
  const bucket = buckets[id] ?? { earned: 0, max: 0, percent: 0 };
  bucket.earned += earned;
  bucket.max += max;
  bucket.percent = Math.round((bucket.earned / bucket.max) * 100);
  buckets[id] = bucket;
}

export function scoreAttempt(assessment, answers) {
  const questions = {};
  const total = { earned: 0, max: 0, percent: 0 };
  const byChapter = {};
  const byCompetency = {};
  for (const question of assessment.questions) {
    const result = scoreQuestion(question, answers[question.id]);
    const weight = question.weight ?? 1;
    const earned = result.score * weight;
    total.earned += earned;
    total.max += weight;
    questions[question.id] = { ...result, answer: answers[question.id], weight };
    for (const chapterId of question.chapterIds) addBucket(byChapter, chapterId, earned, weight);
    for (const competencyId of question.competencyIds) addBucket(byCompetency, competencyId, earned, weight);
  }
  total.earned = Number(total.earned.toFixed(4));
  total.percent = total.max ? Math.round((total.earned / total.max) * 100) : 0;
  return { total, byChapter, byCompetency, questions };
}
