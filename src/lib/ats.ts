/**
 * SkillFit analysis engine.
 *
 * Everything here is intentionally rule-based (no external AI keys needed):
 * it tokenizes the resume + JD against a curated skill dictionary and scores
 * keyword coverage, resume structure, impact language and formatting hygiene.
 * Swap `analyzeJobFit` internals for an AI call later without touching the UI.
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type RatingTone = "high" | "mid" | "low";

export interface Signal {
  id: string;
  label: string;
  value: number; // 0..100
  caption: string;
}

export interface BulletTip {
  skill: string;
  original: string | null;
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface InterviewQuestion {
  type: "Technical" | "Behavioral" | "Role Fit";
  question: string;
  why: string;
}

export interface Analysis {
  score: number;
  rating: string;
  tone: RatingTone;
  signals: Signal[];
  coveragePct: number;
  matchedSkills: string[];
  missingSkills: string[];
  bulletTips: BulletTip[];
  questions: InterviewQuestion[];
  roleLabel: string;
}

export interface RolePreset {
  id: string;
  label: string;
  role: string;
  jd: string;
}

/* ------------------------------------------------------------------ */
/* Skill dictionary                                                    */
/* ------------------------------------------------------------------ */

const SKILLS = [
  "React", "React Native", "Next.js", "Vue.js", "Angular", "Redux",
  "TypeScript", "JavaScript", "Node.js", "Express", "NestJS",
  "Tailwind CSS", "CSS", "HTML", "Sass", "responsive design", "Figma",
  "REST APIs", "REST", "GraphQL", "WebSockets", "gRPC",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Firebase",
  "Prisma", "Drizzle", "Supabase", "SQL", "database design", "indexing",
  "Python", "Django", "Flask", "FastAPI", "Pandas", "NumPy",
  "Java", "Spring Boot", "Kotlin", "Swift", "Go", "Rust", "C++", "C",
  "C#", ".NET", "PHP", "Ruby on Rails", "Scala",
  "Docker", "Kubernetes", "AWS", "GCP", "Azure", "serverless",
  "Lambda", "S3", "EC2", "Terraform", "Jenkins", "GitHub Actions",
  "CI/CD", "Linux", "Bash", "Nginx", "microservices", "system design",
  "OAuth", "JWT", "authentication", "security", "HTTPS",
  "Jest", "Cypress", "Playwright", "Vitest", "unit testing",
  "integration testing", "TDD", "mocking", "test coverage",
  "data structures", "algorithms", "OOP", "functional programming",
  "Git", "GitHub", "Agile", "Scrum", "Jira", "code review", "pair programming",
  "Tableau", "Power BI", "Excel", "Google Sheets", "statistics",
  "probability", "A/B testing", "ETL", "data visualization",
  "machine learning", "deep learning", "NLP", "LLM", "PyTorch",
  "TensorFlow", "scikit-learn", "regression", "classification",
  "clustering", "feature engineering", "SQL queries", "data cleaning",
  "Kafka", "RabbitMQ", "web scraping", "Selenium", "APIs",
  "UI/UX", "accessibility", "SEO", "performance optimization",
  "monitoring", "logging", "observability", "Postman", "Swagger",
] as const;

/** Longer phrases must be matched as substrings; short ones word-boundary. */
function hasPhrase(text: string, phrase: string): boolean {
  if (!phrase) return false;
  const hay = text.toLowerCase();
  const needle = phrase.toLowerCase();
  if (needle.length <= 4) {
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(hay);
  }
  return hay.includes(needle);
}

function findSkillsIn(text: string): string[] {
  return SKILLS.filter((s) => hasPhrase(text, s)) as unknown as string[];
}

/* ------------------------------------------------------------------ */
/* Role presets + sample data                                          */
/* ------------------------------------------------------------------ */

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: "fullstack",
    label: "Fullstack Dev",
    role: "Full-Stack Developer",
    jd: [
      "Junior Full-Stack Developer (React + Node.js)",
      "",
      "We are hiring a junior full-stack developer to ship features across our web platform. You will build responsive UI with React and TypeScript, style with Tailwind CSS, and own REST APIs built on Node.js with Express. Experience with Next.js and GraphQL is a strong plus.",
      "",
      "Requirements:",
      "- React, TypeScript, JavaScript, HTML, CSS and Tailwind CSS",
      "- Node.js, Express and REST API design",
      "- PostgreSQL and MongoDB for data modeling; strong SQL fundamentals",
      "- Git and GitHub workflows, code review, and CI/CD basics",
      "- Docker containers, Redis caching, and AWS deployment basics",
      "- Write Jest unit tests for critical flows",
      "",
      "Bonus: Next.js, GraphQL, Jest, system design fundamentals.",
      "",
      "You should be curious, communicate clearly, and take ownership of small features end to end.",
    ].join("\n"),
  },
  {
    id: "frontend",
    label: "React Frontend",
    role: "Frontend Developer (React)",
    jd: [
      "Frontend Developer — React (Entry Level)",
      "",
      "Join our product team building a design-led SaaS dashboard. You will turn Figma designs into responsive, accessible interfaces using React, TypeScript and Tailwind CSS.",
      "",
      "Requirements:",
      "- Strong React fundamentals: hooks, state management, component patterns",
      "- TypeScript, JavaScript (ES2020+), HTML, CSS, responsive design",
      "- REST API consumption and client-side data fetching",
      "- Git, GitHub and pull-request workflows",
      "- Jest or Vitest for unit testing React components",
      "- Performance optimization and web accessibility basics",
      "",
      "Nice to have: Next.js, Redux, Storybook, Figma, CI/CD with GitHub Actions.",
    ].join("\n"),
  },
  {
    id: "data",
    label: "Data Analyst",
    role: "Data Analyst",
    jd: [
      "Data Analyst — Fresher (SQL + Python)",
      "",
      "You will turn raw data into decisions: clean datasets, build dashboards, and run analyses that product and growth teams act on every week.",
      "",
      "Must-have:",
      "- Strong SQL (joins, window functions, aggregations) on PostgreSQL",
      "- Python with Pandas and NumPy for data cleaning and analysis",
      "- Excel / Google Sheets modeling and formulas",
      "- Data visualization with Tableau or Power BI",
      "- Statistics fundamentals and A/B testing methodology",
      "- Clear written communication and stakeholder storytelling",
      "",
      "Nice to have: ETL pipelines, web scraping, dbt, Git.",
    ].join("\n"),
  },
  {
    id: "react-intern",
    label: "React Intern",
    role: "React Intern",
    jd: [
      "React Intern (Remote, 3 months) — Frontend Engineering",
      "",
      "A 3-month paid internship on a consumer product team. You will work alongside senior engineers on our React web app and get mentored through your first production releases.",
      "",
      "What you'll do:",
      "- Build UI components in React and TypeScript from Figma designs",
      "- Style with Tailwind CSS and implement responsive layouts",
      "- Consume REST APIs and manage client state",
      "- Write tests with Jest and participate in code reviews",
      "- Learn Git workflows, agile ceremonies and shipping to production",
      "",
      "About you: computer science or related coursework, real projects (personal or college), eagerness to learn, clear communication.",
    ].join("\n"),
  },
  {
    id: "backend",
    label: "Backend Intern",
    role: "Backend Developer Intern",
    jd: [
      "Backend Engineer Intern — Node.js & AWS",
      "",
      "We run a high-volume API platform and want an intern who can grow into a production engineer. You'll build and test REST APIs, model data, and learn our deployment stack.",
      "",
      "Requirements:",
      "- Node.js, Express and REST API fundamentals",
      "- PostgreSQL or MySQL with solid SQL",
      "- Redis caching and background jobs",
      "- Docker, AWS (EC2, S3) and CI/CD basics",
      "- Git, unit testing with Jest, and API testing with Postman",
      "- Computer science fundamentals: data structures, algorithms, OOP",
      "",
      "Nice to have: TypeScript, microservices, Kafka, monitoring with Grafana.",
    ].join("\n"),
  },
  {
    id: "ai",
    label: "AI/ML Intern",
    role: "Machine Learning Intern",
    jd: [
      "Machine Learning Intern — NLP & LLM Applications",
      "",
      "Work with our ML team on production LLM features. You'll clean data, evaluate models, run experiments and ship Python services.",
      "",
      "Requirements:",
      "- Python, Pandas and NumPy for data work",
      "- Machine learning fundamentals: regression, classification, evaluation",
      "- Hands-on PyTorch or TensorFlow experience (course projects count)",
      "- Experience calling LLM APIs and prompt engineering basics",
      "- SQL and statistics fundamentals",
      "- Git, experiment tracking, and clear documentation",
      "",
      "Nice to have: NLP, RAG pipelines, Hugging Face, FastAPI.",
    ].join("\n"),
  },
];

export const SAMPLE_RESUME = [
  "PRIYA SHARMA",
  "Bengaluru, India · priya.sharma@example.com · github.com/priya-sharma · linkedin.com/in/priyasharma",
  "",
  "EDUCATION",
  "B.Tech in Computer Science, PES University (2021 – 2025) · CGPA 8.7/10",
  "Relevant coursework: Data Structures & Algorithms, Databases, Operating Systems, Web Technologies",
  "",
  "SKILLS",
  "Languages: JavaScript, TypeScript, Python, SQL",
  "Frontend: React, Next.js, Tailwind CSS, HTML, CSS",
  "Backend: Node.js, Express, REST APIs, MongoDB",
  "Tools: Git, GitHub, Postman, Firebase, VS Code",
  "",
  "PROJECTS",
  "CampusHub — Social platform for college events (React, Node.js, Express, MongoDB)",
  "- Built reusable React components with hooks and TypeScript; cut page load time by 35% with lazy loading and code splitting.",
  "- Designed REST APIs and a MongoDB schema supporting 1,200+ monthly active users.",
  "- Set up GitHub Actions to run lint + tests on every pull request.",
  "",
  "Expense Tracker — Personal finance dashboard (Next.js, Tailwind CSS, PostgreSQL)",
  "- Implemented server-side rendering and role-based auth with JWT.",
  "- Wrote SQL queries for monthly spending summaries used by 300+ registered users.",
  "",
  "EXPERIENCE",
  "Frontend Developer Intern — TechNova Labs (May 2024 – Jul 2024)",
  "- Worked with the engineering team on a React + TypeScript admin dashboard used by 40+ internal users.",
  "- Integrated 10+ REST API endpoints and improved error handling, reducing reported bugs by 25%.",
  "- Reviewed peers' pull requests and documented reusable component patterns for the team wiki.",
  "",
  "Web Team Lead — IEEE Student Chapter (2023 – 2024)",
  "- Led 6 students building the chapter website; mentored juniors in Git and React fundamentals.",
  "",
  "ACHIEVEMENTS",
  "- Winner, internal hackathon 2024 (built a real-time polling app in 24 hours).",
  "- LeetCode 200+ problems solved; GDSC React workshop speaker.",
].join("\n");

/* ------------------------------------------------------------------ */
/* Signals computed from raw text                                      */
/* ------------------------------------------------------------------ */

const ACTION_VERBS = [
  "built", "developed", "designed", "created", "led", "launched", "shipped",
  "improved", "optimized", "increased", "reduced", "implemented",
  "architected", "automated", "collaborated", "deployed", "migrated",
  "refactored", "debugged", "analyzed", "managed", "delivered", "scaled",
  "integrated", "maintained", "tested", "mentored", "wrote", "revamped",
  "spearheaded", "streamlined",
];

/** A line is “quantified” when it has a number AND a strong quantifier
 *  (%, +, k, users, revenue…) or a change verb tied to a number. */
const METRIC_HINT =
  /%|percent|k\+|\+|users?|requests?|downloads?|revenue|clients?|customers?|students?|members?|conversions?|leads|stars?|uptime|hours|days|ms|seconds|out of|reduced|increased|cut|grew|improved|doubled|tripled|first|top\b/i;

function isQuantified(line: string): boolean {
  return /\d/.test(line) && METRIC_HINT.test(line);
}

function toLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s•\-*▪‣>]+/, "").trim())
    .filter(Boolean);
}

function hasSection(text: string, labels: string[]): boolean {
  const lines = toLines(text).map((l) => l.toLowerCase());
  return lines.some((line) => {
    const bare = line.replace(/[:\d\-–.]/g, " ").trim();
    return labels.some((label) => bare.includes(label));
  });
}

function countIn(text: string, re: RegExp): number {
  return (text.match(re) ?? []).length;
}

function weakOpening(line: string): boolean {
  const l = line.toLowerCase();
  return (
    /^(worked|was|did|helped|responsible for|used|participated in|involved in|handled|assisted|tasked with|made)\b/.test(
      l,
    ) || /^used .+ to /.test(l)
  );
}

function pickLines(text: string): string[] {
  return toLines(text).filter(
    (l) => l.length > 24 && l.length < 220 && !/^[A-Z][A-Z\s]+$/.test(l),
  );
}

/* ------------------------------------------------------------------ */
/* STAR + interview generation                                         */
/* ------------------------------------------------------------------ */

const AREA_ANGLE: Array<{
  match: RegExp;
  question: (skill: string) => string;
  why: string;
}> = [
  {
    match: /docker|kubernetes|aws|gcp|azure|ci\/cd|jenkins|terraform|serverless|linux|nginx|ec2|s3/i,
    question: (s) =>
      `Walk me through how you would deploy and monitor a small web service using ${s}. What steps do you take from local development to a running, monitored environment?`,
    why: "The role calls for deployment basics; showing a concrete release workflow proves you can operate code, not just write it.",
  },
  {
    match: /graphql|rest|node|express|nestjs|django|flask|fastapi|spring|microservices|kafka|websockets|grpc|postgresql|mysql|mongo|redis|sql|database|auth|oauth|jwt/i,
    question: (s) =>
      `Describe a time you designed or debugged something involving ${s}. What was the trade-off you had to make, and how did you validate your choice?`,
    why: "Backend interviews test judgment: interviewers want to hear you weigh trade-offs and reason about real constraints.",
  },
  {
    match: /react|next\.js|vue|angular|redux|tailwind|css|html|figma|responsive|typescript|javascript/i,
    question: (s) =>
      `How would you build a reusable, accessible component in ${s}? Talk through structure, state, styling, and how you'd test it.`,
    why: "Frontend roles want engineers who think in components — structure, accessibility and tests separate juniors from interns.",
  },
  {
    match: /python|pandas|numpy|excel|tableau|power bi|statistics|ab test|etl|visualization|machine learning|pytorch|tensorflow|sql/i,
    question: (s) =>
      `Tell me about an analysis you ran end to end with ${s}: how you got the data, cleaned it, and what the numbers led you to do.`,
    why: "Data roles evaluate the full loop — framing the question, cleaning data, and turning output into a decision.",
  },
];

function questionForMissingSkill(skill: string) {
  const angle =
    AREA_ANGLE.find((a) => a.match.test(skill)) ?? {
      question: (s: string) =>
        `You have ${s} listed as a gap on your resume — tell me what you already know about it, and how you'd ramp up to production-ready in a month.`,
      why: "Honest self-awareness plus a concrete learning plan is a strong signal for freshers.",
    };
  return { question: angle.question(skill), why: angle.why };
}

const BEHAVIORAL_QUESTIONS: Array<{ question: string; why: string }> = [
  {
    question:
      "Tell me about a time you hit a deadline you thought you couldn't make. What did you cut, what did you communicate, and what happened?",
    why: "Fresher hires are evaluated on judgment and communication under pressure more than raw output.",
  },
  {
    question:
      "Describe a disagreement with a teammate or classmate on a group project. How did you resolve it, and what did you change about how you collaborate?",
    why: "Teamwork and conflict handling are the top soft-skill filters for entry-level hiring.",
  },
];

const ROLES_HINTS: Array<{ re: RegExp; role: string }> = [
  { re: /data|analyst|sql|analytics/i, role: "Data Analyst" },
  { re: /ml|machine learning|ai\/|llm|nlp|data science/i, role: "ML/AI Engineer" },
  { re: /backend|api|node/i, role: "Backend Developer" },
  { re: /intern/i, role: "the intern role" },
  { re: /full[- ]?stack|frontend|react|web/i, role: "Full-Stack/Frontend Developer" },
];

export function inferRole(jd: string, hint?: string): string {
  if (hint) return hint;
  const found = ROLES_HINTS.find((r) => r.re.test(jd));
  return found?.role ?? "Software Engineer";
}

/* ------------------------------------------------------------------ */
/* Resume-ready STAR fragments (report + tailored-resume PDF)          */
/* ------------------------------------------------------------------ */

/**
 * Domain-aware Task/Action phrasing so a composed bullet stays coherent
 * (you don't "containerize" with Excel). Fragments must be resume-ready:
 * they are pasted verbatim into the tailored-resume PDF, so no coaching or
 * meta-instructions ("close with a number…") inside them.
 */
const STAR_AREA: Array<{
  match: RegExp;
  task: (skill: string) => string;
  action: (skill: string) => string;
}> = [
  {
    match: /docker|kubernetes|aws|gcp|azure|ci\/cd|jenkins|terraform|serverless|linux|nginx|ec2|s3|github actions/i,
    task: (s) => `Set up a reproducible build-and-deploy pipeline using ${s}.`,
    action: (s) =>
      `Configured ${s} for the project, wired it into the team's workflow, and validated it on every release.`,
  },
  {
    match: /graphql|rest|node|express|nestjs|django|flask|fastapi|spring|microservices|kafka|websockets|grpc|postgresql|mysql|mongo|redis|sql|database|auth|oauth|jwt|api/i,
    task: (s) => `Design and deliver the ${s}-backed service layer the product needed.`,
    action: (s) =>
      `Modeled the data, built the ${s} endpoints, and hardened them with tests and proper error handling.`,
  },
  {
    match: /react|next\.js|vue|angular|redux|tailwind|css|html|figma|responsive|typescript|javascript|ui\/ux|accessibility/i,
    task: (s) => `Build the product's ${s} features to spec and on schedule.`,
    action: (s) =>
      `Implemented the components with ${s}, kept them responsive and accessible, and covered critical flows with tests.`,
  },
  {
    match: /python|pandas|numpy|excel|tableau|power bi|statistics|ab test|etl|visualization|machine learning|deep learning|pytorch|tensorflow|data/i,
    task: (s) => `Turn raw data into decision-ready outputs using ${s}.`,
    action: (s) =>
      `Cleaned and analyzed the data with ${s}, then presented findings the team acted on.`,
  },
];

const STAR_AREA_GENERIC = {
  task: (skill: string) => `Scope the ${skill.toLowerCase()} work and deliver it end to end.`,
  action: (skill: string) =>
    `Applied ${skill} hands-on, shipped in small reviewable increments, and verified with tests or feedback.`,
};

function capSentence(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** First quantified span in a line ("40+ internal users", "25%") or null. */
function metricMatchIndex(line: string): number | null {
  const m = line.match(/\d[\d.,]*\s*(?:%|percent)?\+?/);
  return m && m.index !== undefined ? m.index : null;
}

/**
 * Situation = the candidate's own line minus a trailing metric clause
 * ("…dashboard used by 40+ internal users" → "…dashboard"), so the
 * quantified part can become the Result fragment instead of duplicating.
 */
function trimMetricTail(line: string): string {
  const idx = metricMatchIndex(line);
  if (idx === null) return line.replace(/\.$/, "").trim();
  const before = line.slice(0, idx);
  const stripped = before
    .replace(/\s*(?:used by|served|serving|supporting|reaching|delivering|for|with)\s*$/i, "")
    .trim();
  return stripped.length >= 20 ? stripped : line.replace(/\.$/, "").trim();
}

/**
 * Result fragment: the quantified clause from the candidate's own line,
 * phrased naturally ("Used by 40+ internal users.", "Reduced bugs by 25%.").
 */
function resultFragment(line: string): string | null {
  const idx = metricMatchIndex(line);
  if (idx === null) return null;

  // Clause start: after the last comma/semicolon before the metric.
  let start = 0;
  for (let i = idx - 1; i >= 0; i--) {
    if (/[,;]/.test(line[i])) {
      start = i + 1;
      break;
    }
  }
  let clause = line.slice(start).split(/[.;]/)[0].trim();

  if (clause.length > 90) {
    // Try a leading preposition phrase: "used by 40+ users", "reducing bugs by 25%".
    const window = line.slice(Math.max(0, idx - 24), idx);
    const pre = window.match(
      /((?:used|served|serving|supporting|reducing|reduced|cutting|cut|growing|grew|increasing|increased|improving|improved|saving|saved|delivering|delivered|reaching|reached|for)\s+)$/i,
    );
    if (pre) {
      clause = line.slice(idx - pre[1].length).split(/[.;]/)[0].trim();
    }
  }

  if (!clause || clause.length > 90 || clause.length < 4) return null;
  return capSentence(clause.replace(/^[,\s]+/, ""));
}

/* ------------------------------------------------------------------ */
/* Main analyzer                                                       */
/* ------------------------------------------------------------------ */

export function analyzeJobFit(input: {
  resume: string;
  jd: string;
  roleHint?: string;
}): Analysis {
  const resume = input.resume.trim();
  const jd = input.jd.trim();
  const roleLabel = inferRole(jd, input.roleHint);

  // --- Keyword coverage -------------------------------------------------
  const jdSkills = findSkillsIn(jd);
  const resumeSkills = findSkillsIn(resume);
  const required = jdSkills.length > 0 ? jdSkills : SKILLS.slice(0, 12);
  const matchedSkills = required.filter((s) => hasPhrase(resume, s));
  const missingSkills = required.filter((s) => !matchedSkills.includes(s));
  const coveragePct =
    required.length === 0
      ? 50
      : Math.round((matchedSkills.length / required.length) * 100);

  // --- Resume structure -------------------------------------------------
  const checks = [
    { ok: hasSection(resume, ["education", "academic", "university", "b.tech", "b.e", "degree", "college"]), pts: 25 },
    { ok: hasSection(resume, ["experience", "intern", "employment", "work history"]), pts: 25 },
    { ok: hasSection(resume, ["project"]), pts: 25 },
    { ok: hasSection(resume, ["skill", "technical", "languages", "tools"]), pts: 20 },
    { ok: /\S+@\S+\.\S+/.test(resume), pts: 5 },
  ];
  const structureScore = checks.reduce((acc, c) => acc + (c.ok ? c.pts : 0), 0);

  // --- Impact language ---------------------------------------------------
  const lines = pickLines(resume);
  const verbLines = lines.filter((l) =>
    ACTION_VERBS.some((v) => new RegExp(`\\b${v}\\b`, "i").test(l)),
  );
  const metricLines = lines.filter(isQuantified);
  const verbPct = lines.length === 0 ? 0 : verbLines.length / lines.length;
  const metricPct = lines.length === 0 ? 0 : metricLines.length / lines.length;
  const impactDisplay = Math.max(
    0,
    Math.min(100, Math.round(50 * verbPct + 50 * Math.min(metricPct * 1.8, 1))),
  );

  // --- Hygiene -----------------------------------------------------------
  let hygiene = 100;
  if (resume.length < 250) hygiene -= 35;
  else if (resume.length < 500) hygiene -= 12;
  if (resume.length > 9000) hygiene -= 25;
  const maxLine = Math.max(...toLines(resume).map((l) => l.length), 0);
  if (maxLine > 700) hygiene -= 20;
  if (/references available/i.test(resume)) hygiene -= 8;
  if (!countIn(resume, /\b\d{4}\b/)) hygiene -= 12;
  hygiene = Math.max(5, hygiene);

  // --- Composite score ----------------------------------------------------
  const raw =
    coveragePct * 0.5 +
    structureScore * 0.2 +
    impactDisplay * 0.2 +
    hygiene * 0.1;
  const score = Math.max(8, Math.min(97, Math.round(raw)));

  const tone: RatingTone =
    score >= 80 ? "high" : score >= 60 ? "mid" : "low";
  const rating =
    tone === "high"
      ? "High Match"
      : tone === "mid"
        ? "Good Fit"
        : "Needs Work";

  const signals: Signal[] = [
    {
      id: "keywords",
      label: "Keyword match",
      value: coveragePct,
      caption:
        matchedSkills.length > 0
          ? `${matchedSkills.length}/${required.length} JD skills found on your resume`
          : "No JD keywords detected — pasting a job description helps",
    },
    {
      id: "structure",
      label: "Resume structure",
      value: structureScore,
      caption:
        structureScore >= 80
          ? "Education, experience, projects and skills all present"
          : "Add the missing sections — ATS parsers reward clear headers",
    },
    {
      id: "impact",
      label: "Impact language",
      value: impactDisplay,
      caption: `${verbLines.length} action-verb lines · ${metricLines.length} quantified with numbers`,
    },
    {
      id: "hygiene",
      label: "Formatting hygiene",
      value: hygiene,
      caption:
        hygiene >= 85
          ? "Clean, scannable layout"
          : hygiene >= 60
            ? "Readable, but tighten layout and length"
            : "Very short or dense — resumes under ~1 page lose keywords",
    },
  ];

  // --- Bullet optimizer (STAR) -------------------------------------------
  const weakBullets = lines.filter(weakOpening);
  const focusSkills = [...missingSkills, ...matchedSkills];
  const bulletTips: BulletTip[] = [];

  for (let i = 0; i < Math.min(3, focusSkills.length); i++) {
    const skill = focusSkills[i];
    const original = weakBullets[i] ?? null;
    const area = STAR_AREA.find((a) => a.match.test(skill)) ?? STAR_AREA_GENERIC;

    bulletTips.push({
      skill,
      original,
      situation: original
        ? capSentence(trimMetricTail(original))
        : `Coursework and self-study covered ${skill}, but nothing shipped proves it yet.`,
      task: original
        ? area.task(skill)
        : `Build a small, complete ${skill} project with a defined deliverable and deadline.`,
      action: original
        ? area.action(skill)
        : `Learned ${skill} fundamentals hands-on and shipped a working project end to end.`,
      result: original
        ? resultFragment(original) ??
          "Shipped on schedule and cut rework measurably in the following release."
        : "Published the project with a README, live demo, and a measurable result to cite.",
    });
  }

  // --- Interview kit -------------------------------------------------------
  const questions: InterviewQuestion[] = [];

  const techCandidates = [...new Set([...missingSkills, ...matchedSkills])];

  const techSlots = [0, 1];
  for (const idx of techSlots) {
    const skill = techCandidates[idx];
    if (skill) {
      const { question, why } = questionForMissingSkill(skill);
      questions.push({ type: "Technical", question, why });
    }
  }
  const b = BEHAVIORAL_QUESTIONS[Math.min(1, techCandidates.length)];
  questions.push({ type: "Behavioral", question: b.question, why: b.why });

  questions.push({
    type: "Role Fit",
    question: `Why ${roleLabel === "the intern role" ? "this internship" : `this ${roleLabel.toLowerCase()} role`}, and what would you build in your first 30 days to prove yourself?`,
    why: "Enthusiasm plus a concrete first-month plan is what converts a strong resume into an offer.",
  });

  // Top it up to exactly 5 with a second behavioral / technical hybrid.
  while (questions.length < 5) {
    const extra =
      techCandidates[2] !== undefined
        ? {
            type: "Technical" as const,
            question: `If a teammate asked you to add ${techCandidates[2]} to a project you'd never used, walk me through how you'd evaluate it and roll it out safely.`,
            why: "Evaluates learning agility — the trait freshers are hired for most.",
          }
        : {
            type: "Behavioral" as const,
            question:
              "Tell me about something you taught yourself outside the classroom. What was your process, and what did you build to prove you'd learned it?",
            why: "Self-taught projects demonstrate initiative and ownership.",
          };
    questions.push(extra);
  }

  return {
    score,
    rating,
    tone,
    signals,
    coveragePct,
    matchedSkills,
    missingSkills,
    bulletTips,
    questions,
    roleLabel,
  };
}

export function sampleScenario() {
  return {
    resume: SAMPLE_RESUME,
    jd: ROLE_PRESETS[0].jd,
    roleHint: ROLE_PRESETS[0].role,
    presetId: ROLE_PRESETS[0].id,
  };
}

/* ------------------------------------------------------------------ */
/* Structured resume parsing (local fallback for the PDF exporter)     */
/* ------------------------------------------------------------------ */

export interface ResumeEntry {
  title: string;
  subtitle: string;
  dates: string;
  details: string[];
}

export interface ParsedResume {
  name: string;
  contact: string[];
  summary: string[];
  skills: string[];
  education: ResumeEntry[];
  experience: ResumeEntry[];
  projects: ResumeEntry[];
}

const SECTION_PATTERNS: Array<{ id: keyof ParsedResume; re: RegExp }> = [
  { id: "summary", re: /^(summary|profile|about me|objective)/i },
  { id: "education", re: /^education|academic/i },
  { id: "experience", re: /^(work\s*)?(experience|employment|internships?|work\s+history)/i },
  { id: "projects", re: /^(personal\s+|academic\s+|open\s+source\s+)?projects?/i },
  { id: "skills", re: /^(technical\s+|core\s+|professional\s+)?(skills|technologies|languages|tools|tech\s+stack)/i },
];

function isSectionHeader(line: string): keyof ParsedResume | null {
  const t = line.trim();
  if (!t || t.length > 34) return null;
  const hit = SECTION_PATTERNS.find((p) => p.re.test(t));
  if (!hit) return null;
  // Require header-like shape: all-caps or a short phrase (≤ 3 words).
  return t.split(/\s+/).length <= 3 ? hit.id : null;
}

function emptyEntry(): ResumeEntry {
  return { title: "", subtitle: "", dates: "", details: [] };
}

function toTitleCase(s: string): string {
  if (!/^[A-Z0-9\s.'-]+$/.test(s)) return s;
  return s.toLowerCase().replace(/(^|\s|-)(\p{L})/gu, (_, pre, ch) => pre + ch.toUpperCase());
}

function splitContact(line: string): string[] {
  return line
    .split(/\s*[·|]\s*/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function splitSkills(line: string): string[] {
  // Drop a category label like "Frontend:" before splitting on separators.
  const body = line.replace(/^[^:]+:\s*/, "");
  return body
    .split(/\s*[,·|]\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 40);
}

/** Matches "(2021 – 2025)", "(May 2024 – Jul 2024)", "(2023 – Present)" … */
const ENTRY_DATE_PATTERN =
  /\((\d{4}\s*[–—-]\s*(?:\d{4}|present|current|now)|[A-Z][a-z]{2,8}\.?\s+\d{4}\s*[–—-]\s*(?:[A-Z][a-z]{2,8}\.?\s+\d{4}|present|current|now))\)/i;

function parseEntryLine(line: string): ResumeEntry {
  const entry = emptyEntry();
  let rest = line.trim();

  // 1) Trailing date range in parens → dates.
  const dm = rest.match(ENTRY_DATE_PATTERN);
  if (dm && dm.index !== undefined) {
    entry.dates = dm[1].trim();
    rest = rest.slice(0, dm.index) + rest.slice(dm.index + dm[0].length);
  }

  // 2) Trailing " · extra" (e.g. CGPA, coursework) → a detail line.
  const tm = rest.match(/\s*[·|]\s*(.+)$/);
  if (tm && tm[1].trim().length < 80) {
    entry.details.push(tm[1].trim());
    rest = rest.slice(0, tm.index).trimEnd();
  }

  // 3) Non-date parenthetical (e.g. a project tech stack) → subtitle tail.
  const pm = rest.match(/\(([^()]*)\)$/);
  if (pm && pm[1].trim()) {
    const extra = pm[1].trim();
    rest = rest.slice(0, pm.index).trimEnd();
    entry.subtitle = entry.subtitle ? `${entry.subtitle} · ${extra}` : extra;
  }

  // 4) Split "Title — Subtitle" (or "Title, Institution") into fields.
  const dash = rest.match(/^(.*?)\s*(?:[—–]\s*|\s-\s)(.*)$/);
  if (dash) {
    entry.title = dash[1].trim();
    entry.subtitle = entry.subtitle
      ? `${dash[2].trim()} · ${entry.subtitle}`
      : dash[2].trim();
  } else {
    const comma = rest.match(/^(.*?),\s*(.*)$/);
    if (comma && comma[2].length < 60) {
      entry.title = comma[1].trim();
      entry.subtitle = entry.subtitle
        ? `${comma[2].trim()} · ${entry.subtitle}`
        : comma[2].trim();
    } else {
      entry.title = rest.trim();
    }
  }

  if (!entry.title) entry.title = line.trim();
  return entry;
}

/**
 * Best-effort, heuristic parse of a raw resume into structured sections.
 * The AI path returns richer structured data; this covers the local fallback
 * (and any resume Gemini couldn't parse) so the PDF export always has data.
 */
export function parseResume(text: string): ParsedResume {
  const result: ParsedResume = {
    name: "",
    contact: [],
    summary: [],
    skills: [],
    education: [],
    experience: [],
    projects: [],
  };

  let section: keyof ParsedResume | null = null;
  let current: ResumeEntry | null = null;
  let foundHeader = false;

  const pushEntry = () => {
    if (
      current &&
      current.title &&
      (section === "education" || section === "experience" || section === "projects")
    ) {
      result[section].push(current);
    }
    current = null;
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const header = isSectionHeader(line);
    if (header) {
      pushEntry();
      section = header;
      foundHeader = true;
      current = null;
      continue;
    }

    // All-caps line that isn't a tracked section (ACHIEVEMENTS, etc.) —
    // treat as an unknown header and skip until the next real section.
    if (/^[A-Z][A-Z0-9\s&/\-–—]{2,30}$/.test(line) && line.length <= 34 && foundHeader) {
      pushEntry();
      section = null;
      current = null;
      continue;
    }

    if (!foundHeader) {
      // Pre-header block: name, then contact / objective lines.
      if (!result.name) {
        result.name = toTitleCase(line.replace(/[|,;]+$/, ""));
      } else if (
        /@|github|linkedin|www\.|https?:\/\/|\b\d{10}\b|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/.test(
          line,
        ) ||
        line.includes("·") ||
        line.includes("|")
      ) {
        result.contact.push(...splitContact(line));
      } else {
        result.summary.push(line);
      }
      continue;
    }

    if (section === "summary") {
      result.summary.push(line);
      continue;
    }

    if (section === "skills") {
      result.skills.push(...splitSkills(line));
      continue;
    }

    if (section === "education" || section === "experience" || section === "projects") {
      const isBullet = /^[•\-*▪‣>]/.test(raw.trim());
      if (isBullet) {
        if (!current) current = emptyEntry();
        current.details.push(line.replace(/^[•\-*▪‣>]\s*/, ""));
        continue;
      }

      // Coursework / GPA lines under Education attach to the current entry.
      if (
        section === "education" &&
        /^(?:(?:relevant\s+)?coursework|gpa|cgpa|sgpa|grade)\b/i.test(line)
      ) {
        if (!current) current = emptyEntry();
        current.details.push(line);
        continue;
      }

      // Any other non-bullet line starts a new entry.
      pushEntry();
      current = parseEntryLine(line);
    }
  }
  pushEntry();

  // Dedupe skills (labels like "Languages:" produce repeats across categories).
  const seen = new Set<string>();
  result.skills = result.skills.filter((s) => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return result;
}
