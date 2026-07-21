"use server";

import fs from "fs";
import path from "path";

// Helper to read and parse a JSON file safely
function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// Helper to build the practice lesson file path
function buildLessonPath(category, year, difficulty, lesson) {
  return path.join(
    process.cwd(),
    "src", "app", "questions", "practice",
    category.toLowerCase(),
    year,
    difficulty.toLowerCase(),
    `${lesson}.json`
  );
}

export async function getQuestions(category, lesson, difficulty, year, isRealQuiz) {
  try {
    const categoryFolder = category.toLowerCase();

    // ── Real Quiz ──────────────────────────────────────────────────────────
    if (isRealQuiz) {
      const fileName = `REAL_${categoryFolder.toUpperCase()}_QUIZ.json`;
      const realFilePath = path.join(
        process.cwd(), "src", "app", "questions", "real", categoryFolder, fileName
      );
      if (fs.existsSync(realFilePath)) {
        const data = readJsonFile(realFilePath);
        return Array.isArray(data) ? data : [];
      }
      return [];
    }

    // ── Practice Quiz ──────────────────────────────────────────────────────
    if (!lesson || !difficulty) {
      return [];
    }

    const lessonFile = buildLessonPath(category, year, difficulty, lesson);
    const lessonData = readJsonFile(lessonFile);

    if (!lessonData) return [];
    if (Array.isArray(lessonData)) return lessonData;
    if (lessonData[difficulty]) return lessonData[difficulty];

    return [];
  } catch (error) {
    console.error("Error reading questions:", error);
    return [];
  }
}

// Returns the number of available questions for a specific lesson + difficulty
// without loading the entire array into memory unnecessarily.
export async function getQuestionCount(category, lesson, difficulty, year) {
  try {
    if (!category || !lesson || !difficulty || !year) return 0;

    const lessonFile = buildLessonPath(category, year, difficulty, lesson);
    const lessonData = readJsonFile(lessonFile);

    if (!lessonData) return 0;
    if (Array.isArray(lessonData)) return lessonData.length;
    if (lessonData[difficulty] && Array.isArray(lessonData[difficulty]))
      return lessonData[difficulty].length;

    return 0;
  } catch (error) {
    console.error("Error counting questions:", error);
    return 0;
  }
}
