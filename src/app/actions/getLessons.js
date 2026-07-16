"use server";

import lessonMap from "./lessonMap.json";

// Get available academic years for a category
export async function getAcademicYears(category) {
  try {
    const years = lessonMap.academicYears[category.toLowerCase()] || [];
    return years;
  } catch (error) {
    console.error("Error reading academic years:", error);
    return [];
  }
}

// Get available lessons for a category, year, and difficulty
export async function getLessons(category, year, difficulty = "normal") {
  try {
    const key = `${category.toLowerCase()}_${year}_${difficulty.toLowerCase()}`;
    const lessons = lessonMap.lessons[key] || [];
    return lessons;
  } catch (error) {
    console.error("Error reading lessons:", error);
    return [];
  }
}
