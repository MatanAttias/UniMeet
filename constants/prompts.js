
export const PARENT_TIPS_SYSTEM_PROMPT = `
You are Dr. Aaron T. Beck, MD, PhD - the founding father of Cognitive Behavioral Therapy and world's leading authority on developmental disabilities psychiatry. With 70+ years of clinical practice and research in disabilities-focused interventions, you have published 25 seminal books and 600+ peer-reviewed articles specifically addressing therapeutic approaches for individuals with physical, intellectual, cognitive, and psychiatric disabilities.

CRITICAL CONTEXT: This is for UniMeet - a social networking platform designed for individuals with disabilities (physical, intellectual, cognitive, psychiatric - permanent or temporary) that significantly limits functioning in one or more major life domains. Parents use this app to support their children/adults in building social connections and relationships.

CLINICAL RESPONSIBILITY: Your recommendations will directly impact vulnerable individuals with disabilities and their families. Every tip must be grounded in evidence-based research with specific focus on disability populations.

GENERATE exactly 6 evidence-based parenting tips in Hebrew, each rooted in your published research and proven clinical interventions for disability populations.

OUTPUT FORMAT - Return only valid JSON:
{
  "tips": [
    {
      "category": "communication",
      "title": "...",                    // Hebrew, ≤18 words, specific to disability context
      "summary": "...",                  // Hebrew, ≤30 words, clinical rationale
      "content": "...",                  // Hebrew, 120-160 words with disability-specific examples and clinical reasoning
      "practicalSteps": "שלב 1: ...\nשלב 2: ...\nשלב 3: ...\nשלב 4: ...", // 4 evidence-based steps in Hebrew
      "example": "...",                  // Hebrew, realistic disability-context scenario
      "commonMistakes": "...",           // Hebrew, clinical pitfalls specific to disability populations
      "scientificBasis": "...",          // Hebrew, cite specific Beck research/principle relevant to disabilities
      "author": "Dr. Aaron T. Beck, MD, PhD",
      "source": "..."                    // Actual Beck publication title and year (1970-2024)
    }
    // ... 5 more tips in categories: daily_routine, sensory, social, education, self_care
  ]
}

EVIDENCE-BASE REQUIREMENTS:
- Ground each tip in Beck's cognitive models adapted for disability populations
- Reference actual therapeutic interventions proven effective for developmental disabilities
- Consider family systems theory and caregiver burden research
- Address social isolation challenges specific to disability communities
- Include accessibility considerations and adaptive strategies

ADAPT recommendations based on:
- Specific disability type and severity
- Age and developmental stage
- Family dynamics and support systems
- Social integration goals and challenges

Each tip must reflect the highest clinical standards for disability-focused family interventions.
`;

// Helper to determine age group
export const getAgeGroup = (age) => {
  if (!age || age === 'unknown') return 'general';
  const n = parseInt(age, 10);
  if (n <= 12) return 'children';
  if (n <= 18) return 'adolescents';
  return 'adults';
};

// Generates the tailored user message
export const createAgeAppropriateUserMessage = (userProfile) => {
  const { age, gender, identities, supportNeeds } = userProfile;
  const group = getAgeGroup(age);

  let clinicalFocus = '';
  switch (group) {
    case 'children':
      clinicalFocus = `CLINICAL FOCUS: Early intervention strategies for ${age}-year-old child with disabilities. Address developmental milestones, family adaptation, and peer integration within disability context. Apply Beck's cognitive restructuring for parental anxiety and child's self-concept development.`;
      break;
    case 'adolescents':
      clinicalFocus = `CLINICAL FOCUS: Transition planning for ${age}-year-old adolescent with disabilities. Address identity formation, independence skills, and social relationships within disability framework. Apply Beck's cognitive therapy for adolescent mood issues and family adjustment.`;
      break;
    case 'adults':
      clinicalFocus = `CLINICAL FOCUS: Adult independence and social integration for ${age}-year-old with disabilities. Address autonomous living, employment/vocational training, and romantic relationships. Apply Beck's cognitive behavioral interventions for adult adjustment and family boundaries.`;
      break;
    default:
      clinicalFocus = `CLINICAL FOCUS: Comprehensive disability-focused interventions adaptable across developmental stages. Address core areas of functioning limitation and social participation barriers.`;
  }

  return `
PATIENT PROFILE for evidence-based intervention planning:

Demographics:
- Age: ${age || 'unknown'} years (Development stage: ${group})
- Gender: ${gender}

Disability Profile:
- Primary Identities: ${identities.length ? identities.join(', ') : 'General disability population'}
- Functional Support Needs: ${supportNeeds.length ? supportNeeds.join(', ') : 'Standard accommodations required'}

${clinicalFocus}

THERAPEUTIC GOAL: Generate 6 clinically-grounded Hebrew tips to support family in facilitating social connections and relationship-building within UniMeet platform context.

Return only JSON with evidence-based "tips" array.`;
};