import qaScript from '@/data/esposito_qa_script.json';

export interface FactMatch {
  id: string;
  description: string;
  matched: boolean;
  category: string;
  weight: number;
}

export interface GradingResult {
  completeness: number; // 1-5 scale
  empathy: number; // 1-5 scale
  factsElicited: FactMatch[];
  totalFacts: number;
  elicitedCount: number;
  missedFacts: string[];
  openEndedQuestions: number;
  closedQuestions: number;
}

/**
 * Analyzes conversation transcript to determine which facts were elicited
 * and calculate grading metrics
 */
export function gradeConversation(messages: Array<{ role: string; content: string }>): GradingResult {
  const userMessages = messages.filter((m) => m.role === 'user').map((m) => m.content.toLowerCase());

  // Track which facts were elicited
  const facts: FactMatch[] = qaScript.must_elicit_facts.map((fact) => {
    const matched = fact.keywords.some((keyword) =>
      userMessages.some((msg) => msg.includes(keyword.toLowerCase()))
    );

    return {
      id: fact.id,
      description: fact.description,
      matched,
      category: fact.category,
      weight: fact.weight,
    };
  });

  const elicitedCount = facts.filter((f) => f.matched).length;
  const totalFacts = facts.length;
  const missedFacts = facts.filter((f) => !f.matched).map((f) => f.description);

  // Completeness score (1-5 scale based on percentage)
  const completenessPercent = (elicitedCount / totalFacts) * 100;
  let completeness: number;
  if (completenessPercent >= 90) completeness = 5;
  else if (completenessPercent >= 75) completeness = 4;
  else if (completenessPercent >= 60) completeness = 3;
  else if (completenessPercent >= 40) completeness = 2;
  else completeness = 1;

  // Empathy scoring based on question types
  const openEndedPatterns = [
    /what (brings|brought)/,
    /tell me (about|more)/,
    /how (are|do) you/,
    /describe/,
    /can you (explain|talk)/,
    /what('s| is) going on/,
  ];

  const closedEndedPatterns = [
    /^(do|did|does|is|are|was|were|have|has|had|can|could|would|will)/,
    /\?$/,
  ];

  let openEndedQuestions = 0;
  let closedQuestions = 0;

  userMessages.forEach((msg) => {
    if (openEndedPatterns.some((pattern) => pattern.test(msg))) {
      openEndedQuestions++;
    } else if (closedEndedPatterns.some((pattern) => pattern.test(msg))) {
      closedQuestions++;
    }
  });

  const totalQuestions = openEndedQuestions + closedQuestions;
  const openEndedRatio = totalQuestions > 0 ? openEndedQuestions / totalQuestions : 0;

  // Empathy score (1-5 scale based on open-ended question ratio)
  let empathy: number;
  if (openEndedRatio >= 0.4) empathy = 5;
  else if (openEndedRatio >= 0.3) empathy = 4;
  else if (openEndedRatio >= 0.2) empathy = 3;
  else if (openEndedRatio >= 0.1) empathy = 2;
  else empathy = 1;

  return {
    completeness,
    empathy,
    factsElicited: facts,
    totalFacts,
    elicitedCount,
    missedFacts,
    openEndedQuestions,
    closedQuestions,
  };
}

/**
 * Generates tutor feedback message based on grading results
 */
export function generateTutorFeedback(grading: GradingResult): string {
  const praise =
    grading.completeness >= 4
      ? 'Excellent work gathering a thorough history!'
      : grading.completeness >= 3
      ? 'Good effort in collecting key information.'
      : 'You gathered some important details, but there\'s room to be more systematic.';

  let feedback = `[Tutor] Thank you for completing the interview. Here's your feedback:\n\n`;
  feedback += `Completeness: ${grading.completeness}/5\n`;
  feedback += `Empathy: ${grading.empathy}/5\n\n`;

  if (grading.missedFacts.length > 0) {
    feedback += `Missed key facts:\n`;
    grading.missedFacts.forEach((fact) => {
      feedback += `• ${fact}\n`;
    });
    feedback += `\n`;
  }

  feedback += `${praise}\n\n`;
  feedback += `Statistics:\n`;
  feedback += `• Open-ended questions: ${grading.openEndedQuestions}\n`;
  feedback += `• Closed questions: ${grading.closedQuestions}\n`;
  feedback += `• Facts elicited: ${grading.elicitedCount}/${grading.totalFacts}\n`;

  return feedback;
}
