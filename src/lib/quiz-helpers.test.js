import { describe, it, expect } from "vitest";
import {
	standardizeBibleReference,
	normalize,
	evaluateFillInTheBlank,
	isAnswerCorrect,
} from "./quiz-helpers";

describe("normalize", () => {
	it("lowercases and strips punctuation", () => {
		expect(normalize("Hello, World!")).toBe("hello world");
	});

	it("trims leading/trailing whitespace but does not collapse internal whitespace", () => {
		expect(normalize("  spaced   out  ")).toBe("spaced   out");
	});

	it("treats null/undefined/empty as empty string, never throws", () => {
		expect(normalize(null)).toBe("");
		expect(normalize(undefined)).toBe("");
		expect(normalize("")).toBe("");
	});
});

describe("standardizeBibleReference", () => {
	it("passes through non-reference text unchanged (aside from case, handled by normalize)", () => {
		expect(standardizeBibleReference("The narrow path")).toBe("The narrow path");
	});

	it("returns the input as-is (even null/undefined) when falsy, rather than throwing", () => {
		expect(standardizeBibleReference(null)).toBe(null);
		expect(standardizeBibleReference(undefined)).toBe(undefined);
		expect(standardizeBibleReference("")).toBe("");
	});

	// The book-name capture group is always exactly 3 letters
	// ([a-z]{3}), regardless of the full word's length — "Hebrews"
	// becomes "heb", "James" becomes "jam", "Romans" becomes "rom". This
	// is current, verified behavior; pinning it down here so a future
	// change to the regex doesn't silently alter scoring either way.
	it("collapses a book name + chapter:verse into a compact form, truncating the book name to 3 letters", () => {
		expect(standardizeBibleReference("Hebrews 3:14")).toBe("heb3v14");
		expect(standardizeBibleReference("Rev. 12:12")).toBe("rev12v12");
		expect(standardizeBibleReference("James 5:14-15")).toBe("jam5v1415");
	});

	it("handles 'v' and 'vs.' as chapter/verse separators the same as a colon, with or without surrounding spaces", () => {
		expect(standardizeBibleReference("Romans 8v35")).toBe("rom8v35");
		expect(standardizeBibleReference("Romans 8 vs. 35")).toBe("rom8v35");
		expect(standardizeBibleReference("Romans 8vs35")).toBe("rom8v35");
		expect(standardizeBibleReference("Romans 8 vs 35")).toBe("rom8v35");
	});

	it("treats common real-world phrasings of the same reference as equal once normalized (regression: a student typing 'Hebrews 13vs1' with no spaces must match 'Hebrews 13:1')", () => {
		const variants = [
			"Hebrews 13:1",
			"Hebrew 13:1",
			"Hebrews 13vs1",
			"Hebrews 13 vs 1",
			"Hebr 13:1",
			"Hebrews 13 v 1",
			"Hebrews 13v1",
		];
		const normalized = variants.map(normalize);
		expect(new Set(normalized).size).toBe(1);
	});

	it("converts spelled-out ordinal book prefixes (first/second/third) to digits", () => {
		expect(standardizeBibleReference("First John 4:4")).toBe("1joh4v4");
		expect(standardizeBibleReference("Second Timothy 2:3")).toBe("2tim2v3");
	});

	it("handles numeral-prefixed books (1/2/3, i/ii/iii) before the book name", () => {
		expect(standardizeBibleReference("1 Timothy 4:5")).toBe("1tim4v5");
		expect(standardizeBibleReference("2 Tim. 2:3")).toBe("2tim2v3");
	});

	// Documents real, current behavior rather than asserting it's ideal: the
	// book-name capture group requires at least 3 letters, so two-letter
	// abbreviations used in real quiz content (e.g. "Is. 14:12-17",
	// "Ex. 20") are NOT recognized and pass through unchanged. A fill-in-
	// the-blank answer key written as "Is. 14:12-17" will therefore only
	// match a user answer that is character-for-character closer to that
	// same unstandardized form, not one written like "Isaiah 14:12-17".
	// Flagging here so a future change to this regex doesn't silently
	// alter scoring without a test catching it either way.
	it("does NOT standardize two-letter book abbreviations (documented limitation)", () => {
		expect(standardizeBibleReference("Is. 14:12-17")).toBe("Is. 14:12-17");
		expect(standardizeBibleReference("Ex. 20")).toBe("Ex. 20");
	});
});

describe("isAnswerCorrect — multiple-choice", () => {
	const mcQuestion = {
		type: "multiple-choice",
		question: "Christian pilgrims must stand firm in the _______ without shifting grounds.",
		options: ["Love", "Strength", "Peace", "Faith"],
		answer: "Faith",
	};

	it("accepts an exact match", () => {
		expect(isAnswerCorrect(mcQuestion, "Faith")).toBe(true);
	});

	it("is case-insensitive and tolerant of punctuation/whitespace differences", () => {
		expect(isAnswerCorrect(mcQuestion, "  faith!  ")).toBe(true);
		expect(isAnswerCorrect(mcQuestion, "FAITH")).toBe(true);
	});

	it("rejects a wrong option", () => {
		expect(isAnswerCorrect(mcQuestion, "Love")).toBe(false);
	});

	it("rejects an empty, null, or undefined answer rather than crashing", () => {
		expect(isAnswerCorrect(mcQuestion, "")).toBe(false);
		expect(isAnswerCorrect(mcQuestion, null)).toBe(false);
		expect(isAnswerCorrect(mcQuestion, undefined)).toBe(false);
	});
});

describe("evaluateFillInTheBlank / isAnswerCorrect — fill-in-the-blank", () => {
	it("matches a single-word answer", () => {
		const q = { type: "fill-in-the-blank", question: "Fill in the blank.", answer: "Antics" };
		expect(isAnswerCorrect(q, "antics")).toBe(true);
		expect(isAnswerCorrect(q, "plans")).toBe(false);
	});

	it("treats singular and plural forms of a single-word answer as equivalent", () => {
		const q = { type: "fill-in-the-blank", question: "Who announced the birth?", answer: "Angel" };
		expect(isAnswerCorrect(q, "Angel")).toBe(true);
		expect(isAnswerCorrect(q, "angel")).toBe(true);
		expect(isAnswerCorrect(q, "Angels")).toBe(true);
		expect(isAnswerCorrect(q, "angels")).toBe(true);
		expect(isAnswerCorrect(q, "An angel")).toBe(true);
	});

	it("handles -es and -y/-ies plurals, not just a trailing -s", () => {
		const church = { type: "fill-in-the-blank", question: "Where do believers gather?", answer: "church" };
		expect(isAnswerCorrect(church, "churches")).toBe(true);

		const enemy = { type: "fill-in-the-blank", question: "Who opposes believers?", answer: "enemies" };
		expect(isAnswerCorrect(enemy, "enemy")).toBe(true);
	});

	it("accepts any one of several comma/slash/or-separated acceptable answers", () => {
		const q = {
			type: "fill-in-the-blank",
			question: "Name a synonym.",
			answer: "joy, happiness / delight or gladness",
		};
		expect(isAnswerCorrect(q, "happiness")).toBe(true);
		expect(isAnswerCorrect(q, "gladness")).toBe(true);
		expect(isAnswerCorrect(q, "sadness")).toBe(false);
	});

	it("matches a multi-word acceptable answer as a substring of the user's full answer", () => {
		const q = {
			type: "fill-in-the-blank",
			question: "What is the first lesson outline for lesson 6?",
			answer: "The narrow path",
		};
		expect(isAnswerCorrect(q, "the narrow path")).toBe(true);
		expect(isAnswerCorrect(q, "I believe it is the narrow path, yes")).toBe(true);
		expect(isAnswerCorrect(q, "narrow")).toBe(false);
	});

	it("does not let a single acceptable word match as a substring of an unrelated word", () => {
		// Regression target: the code comment at quiz-helpers.js:51 notes this
		// was fixed with a word-boundary check so "incomplete" doesn't
		// satisfy an acceptable answer of "complete".
		const q = { type: "fill-in-the-blank", question: "Describe the work.", answer: "complete" };
		expect(isAnswerCorrect(q, "incomplete")).toBe(false);
		expect(isAnswerCorrect(q, "complete")).toBe(true);
	});

	it("requires at least N distinct acceptable answers for 'mention two/three/four' questions", () => {
		const q = {
			type: "fill-in-the-blank",
			question: "Mention two components of atonement.",
			answer: "satisfaction, propitiation, sacrifice",
		};
		expect(isAnswerCorrect(q, "satisfaction")).toBe(false);
		expect(isAnswerCorrect(q, "satisfaction and propitiation")).toBe(true);
		expect(isAnswerCorrect(q, "satisfaction propitiation sacrifice")).toBe(true);
	});

	it("requires at least three distinct acceptable answers for a 'complete' question, not fewer", () => {
		const q = {
			type: "fill-in-the-blank",
			question: "Complete the list of Satan's strategies.",
			answer: "temptations, contention, confusion, deception",
		};
		expect(isAnswerCorrect(q, "temptations and contention")).toBe(false);
		expect(isAnswerCorrect(q, "temptations, contention and confusion")).toBe(true);
	});

	it("treats a question with no 'mention N'/'complete' wording as needing just one match", () => {
		const q = {
			type: "fill-in-the-blank",
			question: "The 'world' is a battleground and the Christian life is a _____________",
			answer: "Battle, Warfare",
		};
		expect(isAnswerCorrect(q, "warfare")).toBe(true);
	});

	it("rejects an empty, null, or undefined answer rather than crashing", () => {
		const q = { type: "fill-in-the-blank", question: "Fill in.", answer: "faith" };
		expect(isAnswerCorrect(q, "")).toBe(false);
		expect(isAnswerCorrect(q, null)).toBe(false);
		expect(isAnswerCorrect(q, undefined)).toBe(false);
	});
});
