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
		/(?:([123]|i{1,3})\s*)?([a-z]{3})[a-z]*\.?\s+(\d+)(?:\s*[:v]\s*|\s+vs\.?\s+|\s+)(\d+(?:\s*-\s*\d+)?)/gi,
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
				: normalizedUserWords.includes(correct)
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
