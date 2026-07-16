"use server";

import fs from "fs";
import path from "path";

// Get available academic years for a category
export async function getAcademicYears(category) {
  try {
    const categoryDir = path.join(
      process.cwd(),
      "src",
      "app",
      "questions",
      "practice",
      category.toLowerCase()
    );

    if (!fs.existsSync(categoryDir)) return [];

    const years = fs
      .readdirSync(categoryDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort((a, b) => b.localeCompare(a)); // newest year first

    return years;
  } catch (error) {
    console.error("Error reading academic years:", error);
    return [];
  }
}

// Get available lessons for a category, year, and difficulty
export async function getLessons(category, year, difficulty = "normal") {
  try {
    const lessonsDir = path.join(
      process.cwd(),
      "src",
      "app",
      "questions",
      "practice",
      category.toLowerCase(),
      year,
      difficulty.toLowerCase()
    );

    if (!fs.existsSync(lessonsDir)) return [];

    const files = fs.readdirSync(lessonsDir);

    const lessons = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const id = file.replace(".json", "");
        // Build a human-readable title from the filename
        // e.g. "Lesson_01_THEOS_BASILEIA_Quiz" -> "Lesson 01: Theos Basileia"
        const withoutQuiz = id.replace(/_Quiz$/, "").replace(/_quiz$/, "");
        const parts = withoutQuiz.split("_");
        // Keep "Lesson" and number together, join the rest as the topic
        let title = id;
        if (parts.length >= 3) {
          const lessonNum = `${parts[0]} ${parts[1]}`;
          const topic = parts
            .slice(2)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");
          title = `${lessonNum}: ${topic}`;
        }
        return { id, title };
      });

    // Sort numerically by lesson number
    lessons.sort((a, b) => {
      const numA = parseInt(a.id.match(/\d+/) || "0", 10);
      const numB = parseInt(b.id.match(/\d+/) || "0", 10);
      if (numA !== numB) return numA - numB;
      return a.id.localeCompare(b.id);
    });

    return lessons;
  } catch (error) {
    console.error("Error reading lessons:", error);
    return [];
  }
}
