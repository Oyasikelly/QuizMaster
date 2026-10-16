export const standardizeBibleReference = (text) => {
	if (!text) return text;
	let processed = text.replace(/\b(first|second|third)\b/gi, (match) => {
		const lower = match.toLowerCase();
		if (lower === "first") return "1";
		if (lower === "second") return "2";
		if (lower === "third") return "3";
		return match;
	});
	return processed.replace(
		/(?:([123]|i{1,3})\s*)?([a-z]{3})[a-z]*\.?\s+(\d+)(?:\s*vs\.?\s*|\s*[:v]\s*|\s+)(\d+(?:\s*-\s*\d+)?)/gi,
		(match, bookNum, bookName, chapter, verse) => {
			let num = bookNum ? bookNum.toLowerCase() : "";
			if (num === "i") num = "1";
			if (num === "ii") num = "2";
			if (num === "iii") num = "3";
			const book = bookName.toLowerCase();
			const v = verse.replace(/[\s:-]+/g, "");
			return `${num}${book}${chapter}v${v}`;
		}
	);
};

export const normalize = (str) =>
	standardizeBibleReference(str || "")
		.trim()
		.toLowerCase()
		.replace(/[^\w\s]/g, "");

// Crude English singularizer so "angel"/"angels", "church"/"churches",
// "enemy"/"enemies" etc. are treated as the same word for single-word
// fill-in-the-blank answers — students shouldn't lose credit over plural
// vs singular. Length guards avoid mangling short words ("is", "us").
const singularize = (word) => {
	if (word.length > 4 && word.endsWith("ies")) return word.slice(0, -3) + "y";
	if (word.length > 3 && word.endsWith("es")) return word.slice(0, -2);
	if (word.length > 2 && word.endsWith("s")) return word.slice(0, -1);
	return word;
};

const wordsMatch = (a, b) => a === b || singularize(a) === singularize(b);

export const evaluateFillInTheBlank = (question, userAnswer) => {
	const normalizedUserWords = normalize(userAnswer).split(/\s+/);
	const rawAnswers = question.answer
		.split(/,|\/| or | OR /)
		.map((a) => normalize(a).trim())
		.filter(Boolean);
	const normalizedUserAnswerString = normalize(userAnswer);

	let matchCount = 0;
	for (const correct of rawAnswers) {
		if (
			correct.includes(" ")
				? normalizedUserAnswerString.includes(correct)
				: normalizedUserWords.some((w) => wordsMatch(w, correct))
		) {
			matchCount++;
		}
	}

	const qText = question.question.toLowerCase();
	
	// FIX: Use word boundaries so words like "incomplete" don't trigger the "complete" rule!
	if (/\bmention four\b/.test(qText)) return matchCount >= 4;
	if (/\bmention three\b/.test(qText)) return matchCount >= 3;
	if (/\bmention two\b/.test(qText)) return matchCount >= 2;
	if (/\bmention one\b/.test(qText)) return matchCount >= 1;
	if (/\bcomplete\b/.test(qText)) return matchCount >= 3;
	
	return matchCount >= 1;
};

// Also export a universal check function to be used everywhere (Quiz and Results)
export const isAnswerCorrect = (question, userAnswer) => {
	if (!userAnswer) return false;
	
	if (question.type === "fill-in-the-blank") {
		return evaluateFillInTheBlank(question, userAnswer);
	}
	
	return normalize(userAnswer) === normalize(question.answer);
};
