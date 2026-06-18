"""
resume_agent.py — Single source of truth for the ATS pipeline.

Pipeline (5 LLM calls):
  1. extract_keywords(jd)          → atomic skill tokens from JD
  2. score_resume(resume, jd)      → original ATS score (consistent truncation)
  3. tailor_resume(resume, jd, missing_keywords) → locked-template output
  4. score_resume(tailored, jd)    → rescore with IDENTICAL truncation
  5. generate_cover_letter(resume, jd) → grounded, no hallucinations

All text is capped at RESUME_CHAR_LIMIT / JD_CHAR_LIMIT consistently across every call.
"""
from backend.agents.llm import call_groq, call_groq_json

# ── Consistent truncation limits (same across ALL calls) ─────────────────────
RESUME_CHAR_LIMIT = 5000   # covers a 2-page resume safely
JD_CHAR_LIMIT     = 2000


# ── Step 1: Extract atomic keyword tokens from JD ────────────────────────────

def extract_jd_keywords(jd_text: str) -> list[str]:
    """
    Extract atomic skill/tool tokens from the JD.
    Returns clean list like ["Python", "FastAPI", "RAG", "Docker"].
    NOT phrases like "Cloud deployment experience".
    """
    prompt = f"""You are a technical recruiter parsing a job description.

Extract ONLY the specific technical skills, tools, frameworks, and technologies mentioned.

Rules:
- Output atomic tokens only: "FastAPI" not "experience with FastAPI"
- Output tool/skill names only: "Docker" not "containerization experience"
- No soft skills, no job titles, no generic phrases
- No duplicates
- If the same skill appears multiple times, list it once

JOB DESCRIPTION:
{jd_text[:JD_CHAR_LIMIT]}

Return ONLY a JSON array of strings. Example: ["Python", "FastAPI", "RAG", "Docker"]
Return NO explanation, NO extra keys, just the array."""

    result = call_groq_json(prompt)
    if isinstance(result, list):
        return [str(k).strip() for k in result if k]
    return []


# ── Step 2: Keyword presence check (fuzzy, not literal) ──────────────────────

def _keyword_present(keyword: str, resume_text: str) -> bool:
    """
    Check if a keyword exists in resume_text with case-insensitive matching.
    Also checks common abbreviation expansions so "CI/CD" matches "GitHub Actions (CI/CD)".
    """
    keyword_lower = keyword.lower().strip()
    resume_lower  = resume_text.lower()

    # Direct match
    if keyword_lower in resume_lower:
        return True

    # Abbreviation / synonym map
    synonyms = {
        "ci/cd":              ["github actions", "ci/cd", "continuous integration"],
        "cloud deployment":   ["railway", "render", "aws", "gcp", "azure", "heroku", "vercel"],
        "vector database":    ["faiss", "chromadb", "pinecone", "weaviate"],
        "llm":                ["llama", "gpt", "groq", "openai", "gemini", "claude"],
        "postgresql":         ["postgresql", "postgres"],
        "multi-agent":        ["multi-agent", "multi agent", "agentic"],
        "huggingface":        ["huggingface", "hugging face"],
        "mlops":              ["mlops", "ml ops", "deployment", "railway", "render"],
    }

    for key, variants in synonyms.items():
        if keyword_lower == key or keyword_lower in variants:
            if any(v in resume_lower for v in variants):
                return True

    return False


def classify_keywords(all_keywords: list[str], resume_text: str) -> tuple[list[str], list[str]]:
    """
    Split JD keywords into present vs genuinely missing.
    Returns (present_keywords, missing_keywords).
    """
    present = []
    missing = []
    for kw in all_keywords:
        if _keyword_present(kw, resume_text):
            present.append(kw)
        else:
            missing.append(kw)
    return present, missing


# ── Step 3: Score resume against JD ──────────────────────────────────────────

def score_resume(resume_text: str, jd_text: str) -> int:
    """
    Score resume vs JD. Returns integer 0-100.
    Uses consistent truncation — call this for BOTH original and tailored scoring.
    """
    prompt = f"""You are a strict ATS system. Score this resume against the job description from 0 to 100.

Scoring criteria:
- Completely unrelated domain (e.g. engineer applying for restaurant job): score 0-15, ignore all other criteria
- Required skills present (exact matches): 40 points
- Relevant project/work experience depth: 25 points
- Education match (exact degree = full, related = half, unrelated = 0): 10 points
- Summary alignment to JD: 5 points
- Certifications relevant to JD: 5 points
- Seniority/experience level match: 10 points
- Years of experience meets JD requirement: 5 points

Score bands — you must stay within these:
- 0-15:  Completely wrong domain
- 16-35: Wrong field, minor transferable skills only
- 36-50: Related field but major skill gaps
- 51-65: Partial match, missing key requirements
- 66-79: Good match, minor gaps
- 80-89: Strong match, nearly all requirements met
- 90-100: Near-perfect match, exceeds requirements

Rules:
- A fresher cannot score above 65 even with strong projects
- Do not inflate. A 90+ should be rare
- Wrong domain must never exceed 15

JOB DESCRIPTION:
{jd_text[:JD_CHAR_LIMIT]}

RESUME:
{resume_text[:RESUME_CHAR_LIMIT]}

Return ONLY JSON: {{"score": <integer 0-100>}}"""

    try:
        result = call_groq_json(prompt)
        if isinstance(result, dict):
            score = int(result.get("score", 50))
            return max(0, min(100, score))
    except Exception:
        pass
    return 50


# ── Step 4: Tailor resume with locked template ────────────────────────────────

def tailor_resume(resume_text: str, jd_text: str, missing_keywords: list[str], present_keywords: list[str]) -> str:
    """
    Rewrite resume against JD using a locked output template.
    Hard constraints prevent hallucination and apologetic framing.
    """
    present_str = ", ".join(present_keywords[:15]) if present_keywords else "none"
    missing_str = ", ".join(missing_keywords[:15]) if missing_keywords else "none"


    prompt = f"""You are a professional resume editor. Rewrite the candidate's resume to better match the job description.

HARD RULES — violating any of these makes the output invalid:
1. NEVER invent any fact, company, tool, degree, or achievement not in the original resume
2. NEVER write phrases like "No direct experience", "Limited experience", "Exposure to", or any apologetic language
3. NEVER change the candidate's location — keep it exactly as it appears in the original
4. NEVER remove or alter: candidate name, email, phone, company names, dates, CGPA, publication DOI
5. NEVER add a skill or tool to the Skills section that is not already in the original resume
6. Only reword existing bullets to naturally emphasize relevant skills — do not add new bullet points
7. The summary must be rewritten to target this JD, but every claim must be verifiable from the original resume

KEYWORDS TO EMPHASIZE (already in resume): {present_str}
KEYWORDS TO NOT INVENT (not in resume): {missing_str}

OUTPUT FORMAT — use this exact structure, no deviations:
[CANDIDATE NAME] | [EMAIL] | [PHONE] | [LOCATION]

SUMMARY
[2-3 sentences. Target this specific JD. No generic openers like "Highly motivated". Start with a concrete fact.]

SKILLS
[Comma-separated list. Copy from original, reorder to lead with JD-relevant skills. No additions.]

EXPERIENCE
[COMPANY] | [ROLE] | [DATE RANGE]
• [Reworded bullet — action verb, quantified where original has numbers]
• [Reworded bullet]

PROJECTS
[PROJECT NAME] | [TECH STACK]
• [Reworded bullet]

EDUCATION
[DEGREE] | [INSTITUTION] | [YEAR]
[CGPA if present]

CERTIFICATIONS
[List as-is from original]

---

ORIGINAL RESUME:
{resume_text[:RESUME_CHAR_LIMIT]}

TARGET JOB DESCRIPTION:
{jd_text[:JD_CHAR_LIMIT]}

Return ONLY the formatted resume text. No explanation, no notes, no preamble."""

    return call_groq(prompt)


# ── Step 5: Cover letter ──────────────────────────────────────────────────────

def generate_cover_letter(resume_text: str, jd_text: str) -> str:
    """
    Generate a grounded cover letter.
    Every claim must come from resume_text — no hallucinations.
    """
    prompt = f"""Write a 3-paragraph cover letter for this candidate applying to this job.

STRICT RULES:
1. Every specific claim (tool, project, metric, company) must exist in the CANDIDATE RESUME below
2. Do NOT mention any company, tool, or achievement not in the resume
3. Do NOT use openers like "I am writing to apply", "I am excited to", "I am a highly motivated"
4. Do NOT mention the hiring company by a specific name unless it appears in the JD and you quote it exactly
5. Location in closing must match resume location exactly
6. Under 250 words total

STRUCTURE:
Para 1 (3-4 sentences): What specifically drew you to this role — reference 1-2 JD requirements you've directly built
Para 2 (3-4 sentences): Two concrete examples from your projects/experience that map to JD requirements. Include real project names and real metrics from the resume.
Para 3 (2-3 sentences): Confident close with a call to action. No hedging.

CANDIDATE RESUME:
{resume_text[:RESUME_CHAR_LIMIT]}

JOB DESCRIPTION:
{jd_text[:JD_CHAR_LIMIT]}

Return ONLY the cover letter text. No subject line, no sign-off boilerplate."""

    return call_groq(prompt)


# ── Main pipeline ─────────────────────────────────────────────────────────────

def full_ats_pipeline(resume_text: str, jd_text: str) -> dict:
    """
    Run the full 5-step ATS pipeline.

    Returns:
        original_score   int        — score before tailoring
        tailored_score   int        — score after tailoring (same truncation as original)
        present_keywords list[str]  — JD skills already in resume
        missing_keywords list[str]  — JD skills genuinely absent from resume
        tailored_resume  str        — locked-template rewritten resume
        cover_letter     str        — grounded cover letter
    """
    # 1. Extract atomic keywords from JD
    all_keywords = extract_jd_keywords(jd_text)

    # 2. Classify: which are present vs missing in the actual resume
    present_keywords, missing_keywords = classify_keywords(all_keywords, resume_text)

    # 3. Score original (consistent truncation)
    original_score = score_resume(resume_text, jd_text)

    # 4. Tailor with locked template
    tailored_resume = tailor_resume(resume_text, jd_text, missing_keywords, present_keywords)

    # 5. Rescore tailored — identical call, identical truncation
    tailored_score = score_resume(tailored_resume, jd_text)

    # 6. Cover letter
    cover_letter = generate_cover_letter(resume_text, jd_text)

    return {
        "original_score":   original_score,
        "tailored_score":   tailored_score,
        "present_keywords": present_keywords,
        "missing_keywords": missing_keywords,
        "tailored_resume":  tailored_resume,
        "cover_letter":     cover_letter,
    }