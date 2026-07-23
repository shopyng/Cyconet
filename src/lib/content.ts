/**
 * Single source of truth for site copy and data.
 *
 * Cyconet operates three arms, and the site is structured around them:
 *   1. Academy   — the tech school, led by the Cybersecurity Academy
 *   2. Solutions — the tech solutions agency
 *   3. Hub       — the co-working tech hub
 *
 * Keeping content out of the components means the sections stay purely
 * presentational, and swapping in a CMS later is a one-file change.
 */

/**
 * Canonical origin. Override per-environment with NEXT_PUBLIC_SITE_URL —
 * metadataBase, the sitemap, robots.txt and the JSON-LD graph all derive
 * absolute URLs from this single value.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cyconet.com'
).replace(/\/$/, '');

export const brand = {
  name: 'Cyconet',
  /** Leads with the highest-intent search term. */
  tagline: 'Cybersecurity Academy, Tech School, Solutions Agency & Co-Working Hub',
  /**
   * Meta description. Kept under ~155 characters so search engines show it
   * whole rather than truncating mid-sentence, and front-loaded with the city
   * because most searches for this kind of business are local.
   */
  metaDescription:
    'Cybersecurity academy and tech school in Ibadan — plus a tech solutions agency and a co-working tech hub. Train with us, hire us, or take a desk.',
  /** Longer prose for the footer and structured data, where length is free. */
  shortDescription:
    'Cyconet is a cybersecurity academy and tech school in Ibadan, Nigeria, training engineers in cybersecurity, software engineering, data science, AI and cloud — alongside a tech solutions agency and a co-working tech hub under one roof.',
  founded: '2019',
  email: 'hello@cyconet.com',
  phone: '+234 800 000 0000',
  address: {
    street: 'Akala Expressway',
    locality: 'Ibadan',
    region: 'Oyo State',
    country: 'NG',
  },
} as const;

/* ------------------------------------------------------------------ *
 * Hero
 * ------------------------------------------------------------------ */

export const hero = {
  badge: 'Cohort 07 — applications close March 14',
  headlinePlain: 'Engineer what comes',
  headlineAccent: 'next.',
  /** Front-loads the primary keywords for both crawlers and skim-readers. */
  sub: 'Cyconet is a cybersecurity academy and tech school, a solutions agency, and a co-working tech hub — in one building. Train with engineers who still ship, hire us to build it, or take a desk beside the people who do.',
  primaryCta: { label: 'Explore Programs', href: '#programs' },
  secondaryCta: { label: 'Talk to Admissions', href: '/apply' },
  partners: ['Paystack', 'Flutterwave', 'Andela', 'Interswitch', 'Moniepoint'],
} as const;

/* ------------------------------------------------------------------ *
 * The three arms
 * ------------------------------------------------------------------ */

export type Pillar = {
  id: string;
  icon: 'shield' | 'build' | 'hub';
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  cta: { label: string; href: string };
  /** The cybersecurity academy is the flagship and is styled as such. */
  flagship?: boolean;
};

export const pillars: Pillar[] = [
  {
    id: 'academy',
    icon: 'shield',
    eyebrow: 'Arm 01',
    title: 'The Cybersecurity Academy',
    body: 'Our flagship school. Offensive and defensive security taught in a live attack range, plus full tracks in software engineering, data science, AI and cloud. Beginners welcome; no degree required.',
    points: ['Live attack range', 'Industry-certified curriculum', 'Job support until you sign'],
    cta: { label: 'See the curriculum', href: '/cybersecurity-academy' },
    flagship: true,
  },
  {
    id: 'solutions',
    icon: 'build',
    eyebrow: 'Arm 02',
    title: 'Tech Solutions Agency',
    body: 'The consultancy that keeps our teaching honest. We build software, secure infrastructure and run cloud migrations for clients — then feed those real engagements straight back into the classroom.',
    points: ['Security audits & pen testing', 'Custom software delivery', 'Cloud & DevOps engineering'],
    cta: { label: 'Start a project', href: '/solutions' },
  },
  {
    id: 'hub',
    icon: 'hub',
    eyebrow: 'Arm 03',
    title: 'Co-Working Tech Hub',
    body: 'A workspace built for people who build. Fibre, backup power, meeting rooms and an event floor — surrounded by the engineers, founders and graduates who already work here.',
    points: ['24/7 secure access', 'Fibre + full backup power', 'Weekly community events'],
    cta: { label: 'Book a tour', href: '/co-working-hub' },
  },
];

/* ------------------------------------------------------------------ *
 * Stats
 * ------------------------------------------------------------------ */

export type Stat = {
  value: number;
  suffix: string;
  label: string;
  detail: string;
};

export const stats: Stat[] = [
  { value: 4200, suffix: '+', label: 'Graduates', detail: 'trained since 2019' },
  { value: 180, suffix: '+', label: 'Hiring partners', detail: 'actively recruiting' },
  { value: 92, suffix: '%', label: 'Placement rate', detail: 'within 6 months' },
  { value: 24, suffix: '', label: 'Active courses', detail: 'across 5 tracks' },
];

/* ------------------------------------------------------------------ *
 * Academy — programs
 * ------------------------------------------------------------------ */

export type Program = {
  id: string;
  icon: 'shield' | 'code' | 'chart' | 'spark' | 'cloud';
  title: string;
  duration: string;
  level: string;
  description: string;
  skills: string[];
  /** Bento emphasis — `feature` cards span wider on desktop. */
  feature?: boolean;
};

/** Cybersecurity leads the list deliberately — it is the flagship track. */
export const programs: Program[] = [
  {
    id: 'cybersecurity',
    icon: 'shield',
    title: 'Cybersecurity',
    duration: '14 weeks',
    level: 'Beginner → Job-ready',
    description:
      'The flagship track of the Cyconet Cybersecurity Academy. Offensive and defensive security in a live lab range — threat modelling, network defence, penetration testing and incident response against real attack traffic, not screenshots of it.',
    skills: ['Threat modelling', 'SIEM', 'Penetration testing', 'Incident response', 'Forensics'],
    feature: true,
  },
  {
    id: 'software-engineering',
    icon: 'code',
    title: 'Software Engineering',
    duration: '16 weeks',
    level: 'Beginner → Job-ready',
    description:
      'Build and deploy production web applications end to end. You ship five real projects and leave with a portfolio that survives a technical interview.',
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
  },
  {
    id: 'data-science',
    icon: 'chart',
    title: 'Data Science',
    duration: '14 weeks',
    level: 'Intermediate',
    description:
      'Turn messy real-world data into decisions leadership acts on — statistics, modelling, and the storytelling that makes it land.',
    skills: ['Python', 'SQL', 'Pandas', 'Visualisation'],
  },
  {
    id: 'ai-ml',
    icon: 'spark',
    title: 'AI & Machine Learning',
    duration: '18 weeks',
    level: 'Advanced',
    description:
      'From gradient descent to shipped inference. Train, evaluate and deploy models, then wrap them in products people use — including LLM application work with retrieval and evals.',
    skills: ['PyTorch', 'MLOps', 'LLM apps', 'Evaluation'],
    feature: true,
  },
  {
    id: 'cloud-computing',
    icon: 'cloud',
    title: 'Cloud Computing',
    duration: '12 weeks',
    level: 'Intermediate',
    description:
      'Design infrastructure that survives traffic, outages and audits — containers, IaC and CI/CD pipelines you build from an empty account up.',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD'],
  },
];

/**
 * Long-form detail for the dedicated program pages.
 *
 * Kept separate from `programs` so the homepage bento grid stays lightweight —
 * it only needs the summary fields, and this never reaches that bundle.
 */
export type ProgramDetail = {
  overview: string;
  prerequisites: string;
  schedule: string;
  tuition: string;
  /** Curriculum blocks, in teaching order. */
  modules: { title: string; body: string }[];
  /** Concrete capabilities a graduate walks out with. */
  outcomes: string[];
  /** Roles this track feeds into, used for the "careers" block. */
  roles: string[];
};

export const programDetails: Record<string, ProgramDetail> = {
  cybersecurity: {
    overview:
      'The Cyconet Cybersecurity Academy is our flagship programme and the reason the school exists. Over fourteen weeks you move from networking fundamentals to defending live infrastructure in our attack range, where instructors run real intrusion scenarios against systems you are responsible for. You finish having written incident reports that a SOC lead would accept.',
    prerequisites:
      'None. We start at networking and operating system fundamentals. You need comfort with a computer and the time to commit full-time.',
    schedule: 'Full-time, Monday–Friday, 9am–4pm at Akala Expressway, Ibadan.',
    tuition: 'Upfront, three-part instalments, or an income-share agreement.',
    modules: [
      {
        title: 'Foundations: networks and systems',
        body: 'TCP/IP, DNS, HTTP, Linux administration and Windows internals. You cannot defend what you cannot describe, so this block is unglamorous and non-negotiable.',
      },
      {
        title: 'Threat modelling and risk',
        body: 'Map attack surfaces, rank what actually matters, and write the kind of risk assessment a board will read. Frameworks are taught as tools, not as gospel.',
      },
      {
        title: 'Offensive security',
        body: 'Reconnaissance, vulnerability assessment and exploitation against deliberately vulnerable targets in an isolated lab. Everything is authorised, scoped and logged — the same discipline a professional engagement demands.',
      },
      {
        title: 'Defensive operations',
        body: 'SIEM tuning, log analysis, detection engineering and alert triage. You will learn why most alerts are noise and how to build the ones that are not.',
      },
      {
        title: 'Incident response and forensics',
        body: 'Contain, eradicate, recover and document. Run against live scenarios in the attack range, at unhelpful hours, with your cohort depending on you.',
      },
      {
        title: 'Capstone and career',
        body: 'A full engagement end to end — scope, test, report, present — plus interview drills and introductions to hiring partners.',
      },
    ],
    outcomes: [
      'Run an authorised penetration test and write the report',
      'Build and tune detections in a SIEM',
      'Lead the first hour of an incident response',
      'Produce forensic evidence that survives scrutiny',
      'Communicate risk to a non-technical stakeholder',
    ],
    roles: ['Security Analyst', 'SOC Analyst', 'Penetration Tester', 'Security Engineer'],
  },

  'software-engineering': {
    overview:
      'Sixteen weeks building and deploying production web applications end to end. The distinguishing feature is code review: every line you write is read by an engineer who ships for a living, and you review your cohort in turn. That loop, not the syllabus, is what makes people employable.',
    prerequisites: 'None. Comfort with a computer and full-time availability.',
    schedule: 'Full-time, Monday–Friday, 9am–4pm at Akala Expressway, Ibadan.',
    tuition: 'Upfront, three-part instalments, or an income-share agreement.',
    modules: [
      {
        title: 'Programming foundations',
        body: 'JavaScript and TypeScript from first principles — types, async, modules — with the debugging habits that make the rest of the course survivable.',
      },
      {
        title: 'The web platform',
        body: 'HTML semantics, CSS layout, accessibility and browser behaviour. Taught early, because retrofitting accessibility is far harder than building with it.',
      },
      {
        title: 'React and application architecture',
        body: 'Component design, state management, data fetching and rendering strategy — including when a framework is the wrong answer.',
      },
      {
        title: 'Backend and data',
        body: 'HTTP APIs, authentication, PostgreSQL schema design and the query patterns that stop an app falling over at scale.',
      },
      {
        title: 'Testing and delivery',
        body: 'Unit, integration and end-to-end testing, CI pipelines, and deploying without downtime.',
      },
      {
        title: 'Capstone and career',
        body: 'Ship a full application, defend your architectural decisions, then interview drills and hiring-partner introductions.',
      },
    ],
    outcomes: [
      'Build and deploy a full-stack application',
      'Design a relational schema that holds up',
      'Write tests that catch real regressions',
      'Give and take a useful code review',
      'Debug production issues methodically',
    ],
    roles: ['Frontend Engineer', 'Backend Engineer', 'Full-stack Engineer'],
  },

  'data-science': {
    overview:
      'Fourteen weeks turning messy real-world data into decisions people act on. Heavy emphasis on the two things junior analysts are usually missing: statistical judgement about what the data can and cannot support, and the communication skill to make a finding land with a room that did not commission it.',
    prerequisites: 'Secondary-school mathematics and comfort with spreadsheets.',
    schedule: 'Full-time, Monday–Friday, 9am–4pm at Akala Expressway, Ibadan.',
    tuition: 'Upfront, three-part instalments, or an income-share agreement.',
    modules: [
      {
        title: 'Python for analysis',
        body: 'The language, then NumPy and Pandas — enough fluency that tooling stops being the obstacle.',
      },
      {
        title: 'SQL and data wrangling',
        body: 'Joins, window functions and the unglamorous cleaning work that is most of the job.',
      },
      {
        title: 'Statistics that matter',
        body: 'Distributions, inference, confidence and the failure modes — p-hacking, survivorship bias, confounding — that produce confident wrong answers.',
      },
      {
        title: 'Modelling',
        body: 'Regression, classification and clustering, with honest evaluation and a bias toward the simplest model that works.',
      },
      {
        title: 'Visualisation and storytelling',
        body: 'Chart design that clarifies rather than decorates, and structuring an analysis so a decision-maker reaches your conclusion.',
      },
      {
        title: 'Capstone and career',
        body: 'An end-to-end analysis on real data, presented to a live audience, plus interview preparation.',
      },
    ],
    outcomes: [
      'Extract and clean data from real sources',
      'Choose and defend an appropriate model',
      'Quantify uncertainty honestly',
      'Build a dashboard people actually use',
      'Present findings to non-technical stakeholders',
    ],
    roles: ['Data Analyst', 'Data Scientist', 'Business Intelligence Analyst'],
  },

  'ai-ml': {
    overview:
      'Eighteen weeks from gradient descent to shipped inference. The hard part of machine learning in practice is not training a model — it is evaluating it honestly and keeping it working once real users touch it. This track spends as much time on evaluation and deployment as on modelling.',
    prerequisites:
      'Comfortable with Python and secondary-school mathematics. Our Data Science track is a good route in.',
    schedule: 'Full-time, Monday–Friday, 9am–4pm at Akala Expressway, Ibadan.',
    tuition: 'Upfront, three-part instalments, or an income-share agreement.',
    modules: [
      {
        title: 'Mathematical foundations',
        body: 'Linear algebra, calculus and probability, taught only as deeply as the models require — but properly, so nothing later is magic.',
      },
      {
        title: 'Classical machine learning',
        body: 'Supervised and unsupervised methods, feature engineering, and why a gradient-boosted tree still beats a neural network on most tabular problems.',
      },
      {
        title: 'Deep learning with PyTorch',
        body: 'Networks, training loops, transfer learning, and reading a paper well enough to reimplement it.',
      },
      {
        title: 'LLM applications',
        body: 'Retrieval-augmented generation, tool use, prompt design and the evaluation harnesses that tell you whether any of it is working.',
      },
      {
        title: 'Evaluation and MLOps',
        body: 'Metrics that resist gaming, dataset splits that do not leak, plus versioning, monitoring and drift detection in production.',
      },
      {
        title: 'Capstone and career',
        body: 'Deploy a model behind a real interface with an evaluation report you could defend to a regulator.',
      },
    ],
    outcomes: [
      'Train and fine-tune models in PyTorch',
      'Build an LLM application with retrieval and evals',
      'Design an evaluation that resists gaming',
      'Deploy and monitor a model in production',
      'Read and implement a research paper',
    ],
    roles: ['Machine Learning Engineer', 'AI Engineer', 'Research Engineer'],
  },

  'cloud-computing': {
    overview:
      'Twelve weeks designing infrastructure that survives traffic, outages and audits. You start from an empty cloud account and build up — networking, compute, containers, pipelines — so nothing is a black box you inherited.',
    prerequisites: 'Basic Linux command-line comfort and some scripting exposure.',
    schedule: 'Full-time, Monday–Friday, 9am–4pm at Akala Expressway, Ibadan.',
    tuition: 'Upfront, three-part instalments, or an income-share agreement.',
    modules: [
      {
        title: 'Cloud fundamentals',
        body: 'Regions, availability, IAM and networking on AWS. Identity and access first, because it is the most common way things go badly wrong.',
      },
      {
        title: 'Containers and orchestration',
        body: 'Docker, then Kubernetes — scheduling, services, storage and the failure modes each introduces.',
      },
      {
        title: 'Infrastructure as code',
        body: 'Terraform, module design, state management and the discipline of never changing anything by hand in a console.',
      },
      {
        title: 'CI/CD',
        body: 'Build pipelines, deployment strategies and rollbacks that let a team deploy on a Friday without flinching.',
      },
      {
        title: 'Observability and cost',
        body: 'Metrics, logs, traces and alerting that pages a human only when it should — plus keeping the bill defensible.',
      },
      {
        title: 'Capstone and career',
        body: 'Stand up production-grade infrastructure from scratch, documented well enough to hand over.',
      },
    ],
    outcomes: [
      'Design a secure cloud network from scratch',
      'Run containerised workloads on Kubernetes',
      'Manage all infrastructure as versioned code',
      'Build a pipeline with safe rollbacks',
      'Instrument a system so failures are visible',
    ],
    roles: ['Cloud Engineer', 'DevOps Engineer', 'Platform Engineer', 'SRE'],
  },
};

/* ------------------------------------------------------------------ *
 * Why Cyconet
 * ------------------------------------------------------------------ */

export type Feature = {
  icon: 'build' | 'mentor' | 'career' | 'cohort';
  title: string;
  body: string;
};

export const features: Feature[] = [
  {
    icon: 'build',
    title: 'Project-based, always',
    body: 'No passive lectures. Every week ends with something deployed, code-reviewed and defended in front of your cohort — the same loop you will run on the job.',
  },
  {
    icon: 'mentor',
    title: 'Mentors who still ship',
    body: 'Your instructors work on live client engagements in our solutions agency, not just in a classroom. Weekly 1:1s, live pairing and review on your actual repositories.',
  },
  {
    icon: 'career',
    title: 'Job support that persists',
    body: 'Interview drills, salary negotiation, portfolio review and warm introductions to our 180+ hiring partners — support continues until you sign an offer.',
  },
  {
    icon: 'cohort',
    title: 'A cohort, not a queue',
    body: 'Small groups capped at 24, moving through the curriculum together, with a desk in our co-working hub and a network that outlasts graduation.',
  },
];

/* ------------------------------------------------------------------ *
 * Solutions agency
 * ------------------------------------------------------------------ */

export type Service = {
  icon: 'shield' | 'code' | 'cloud' | 'spark';
  title: string;
  body: string;
  deliverables: string[];
};

export const services: Service[] = [
  {
    icon: 'shield',
    title: 'Security audits & penetration testing',
    body: 'We probe your systems the way an attacker would, then hand you a prioritised remediation plan your engineers can actually execute.',
    deliverables: ['Penetration testing', 'Vulnerability assessment', 'Compliance readiness'],
  },
  {
    icon: 'code',
    title: 'Custom software delivery',
    body: 'Senior-led product teams that design, build and ship web and mobile applications — with handover documentation, not lock-in.',
    deliverables: ['Web & mobile apps', 'API & platform work', 'Legacy modernisation'],
  },
  {
    icon: 'cloud',
    title: 'Cloud & DevOps engineering',
    body: 'Migrations, cost reduction and CI/CD pipelines that let your team deploy on a Friday without flinching.',
    deliverables: ['Cloud migration', 'Infrastructure as code', 'Monitoring & SRE'],
  },
  {
    icon: 'spark',
    title: 'Data & AI consulting',
    body: 'From a first dashboard to a deployed model with evaluation you can defend to a regulator or a board.',
    deliverables: ['Data platforms', 'ML deployment', 'LLM integration'],
  },
];

/* ------------------------------------------------------------------ *
 * Co-working hub
 * ------------------------------------------------------------------ */

export type HubPlan = {
  name: string;
  price: string;
  cadence: string;
  body: string;
  perks: string[];
  featured?: boolean;
};

export const hubAmenities = [
  'Fibre internet + full backup power',
  '24/7 secure keycard access',
  'Bookable meeting & call rooms',
  '120-seat event floor',
  'Podcast & recording studio',
  'Unlimited coffee, decent coffee',
] as const;

export const hubPlans: HubPlan[] = [
  {
    name: 'Day Pass',
    price: '₦7,500',
    cadence: 'per day',
    body: 'A hot desk, full bandwidth and the run of the common areas. No commitment.',
    perks: ['Hot desk', 'Fibre + power', 'Community events'],
  },
  {
    name: 'Resident',
    price: '₦85,000',
    cadence: 'per month',
    body: 'Your own dedicated desk, meeting room credits and after-hours access. Our most popular plan.',
    perks: ['Dedicated desk', '24/7 access', '10 meeting-room hours', 'Mail handling'],
    featured: true,
  },
  {
    name: 'Team Suite',
    price: 'From ₦480,000',
    cadence: 'per month',
    body: 'A private lockable studio for teams of four to twelve, with everything in Resident included.',
    perks: ['Private studio', 'Team branding', 'Unlimited meeting rooms', 'Dedicated support'],
  },
];

/* ------------------------------------------------------------------ *
 * Instructors
 * ------------------------------------------------------------------ */

export type Instructor = {
  name: string;
  role: string;
  track: string;
  bio: string;
  /** Monogram rendered in a gradient tile — avoids shipping stock photography. */
  initials: string;
};

export const instructors: Instructor[] = [
  {
    name: 'Tobi Ade-Bello',
    initials: 'TA',
    role: 'Head of Security',
    track: 'Cybersecurity Academy',
    bio: 'Former incident responder for a pan-African fintech. Runs the live attack range where students defend real infrastructure against real traffic.',
  },
  {
    name: 'Adaeze Nwosu',
    initials: 'AN',
    role: 'Lead Instructor',
    track: 'Software Engineering',
    bio: 'Ten years building payment infrastructure at scale. Adaeze designed the engineering curriculum around the code reviews she wished she had received as a junior.',
  },
  {
    name: 'Chidera Okonkwo',
    initials: 'CO',
    role: 'Principal Data Scientist',
    track: 'Data Science & AI',
    bio: 'Built forecasting systems serving millions of daily decisions. Teaches modelling with an obsession for evaluation, not just accuracy on a slide.',
  },
  {
    name: 'Ruth Balogun',
    initials: 'RB',
    role: 'Cloud Architect',
    track: 'Cloud Computing',
    bio: 'Migrated three companies off single-server deployments. Ruth teaches infrastructure the way she runs it — from an empty account to a signed-off audit.',
  },
];

/* ------------------------------------------------------------------ *
 * Outcomes
 * ------------------------------------------------------------------ */

export type Testimonial = {
  quote: string;
  name: string;
  initials: string;
  role: string;
  outcome: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      'The attack range is the whole thing. You cannot fake incident response on a slide deck — you learn it at 2am with alerts firing and your cohort depending on you to find the intrusion.',
    name: 'Halima Sanni',
    initials: 'HS',
    role: 'Security Analyst',
    outcome: 'Doubled previous salary',
  },
  {
    quote:
      'I came in writing spreadsheet macros. Sixteen weeks later I was reviewing pull requests on a payments team. The difference was code review — someone senior read every line I wrote and told me exactly why it was wrong.',
    name: 'Ifeanyi Eze',
    initials: 'IE',
    role: 'Frontend Engineer',
    outcome: 'Hired 3 weeks after graduating',
  },
  {
    quote:
      'What I did not expect was the job support continuing after graduation. My coach ran four mock interviews with me over two months, and negotiated my offer up by 18%.',
    name: 'Kelechi Obi',
    initials: 'KO',
    role: 'Data Scientist',
    outcome: 'Placed at a hiring partner',
  },
  {
    quote:
      'I took a desk in the hub while I studied, and ended up contracting for the agency downstairs before I had even graduated. Being in the building is worth as much as the curriculum.',
    name: 'Zainab Yusuf',
    initials: 'ZY',
    role: 'ML Engineer',
    outcome: 'First engineering role',
  },
];

/* ------------------------------------------------------------------ *
 * Admissions
 * ------------------------------------------------------------------ */

export type Step = {
  title: string;
  body: string;
  meta: string;
};

export const admissionSteps: Step[] = [
  {
    title: 'Submit your application',
    meta: '15 minutes',
    body: 'Tell us your background and which track you want. No degree required and no application fee — we care about how you think, not what you have already studied.',
  },
  {
    title: 'Take the aptitude challenge',
    meta: '90 minutes, at home',
    body: 'A practical problem-solving exercise rather than a trivia quiz. It tells us where to start you, and tells you honestly whether the pace will suit you.',
  },
  {
    title: 'Interview with an instructor',
    meta: '30 minutes, video',
    body: 'A conversation with the person who will actually teach you. Bring your questions about the curriculum, the workload and what the weeks demand.',
  },
  {
    title: 'Get your decision and enrol',
    meta: 'Within 5 days',
    body: 'Accepted candidates receive a seat offer, a financing plan — upfront, instalments or income-share — and pre-work to complete before day one.',
  },
];

/* ------------------------------------------------------------------ *
 * FAQ — also emitted as FAQPage structured data for rich results
 * ------------------------------------------------------------------ */

export type Faq = { question: string; answer: string };

export const faqs: Faq[] = [
  {
    question: 'Do I need experience to join the Cybersecurity Academy?',
    answer:
      'No. The cybersecurity track starts from first principles — networking, operating systems and threat modelling — and takes complete beginners to job-ready in 14 weeks. What we do ask for is the time: it is a full-time, intensive programme.',
  },
  {
    question: 'What makes Cyconet different from other tech schools?',
    answer:
      'We run a tech solutions agency alongside the academy. Your instructors are delivering live client engagements — security audits, cloud migrations, product builds — and those real problems become your coursework. You also get a desk in our co-working tech hub, so you learn surrounded by working engineers rather than only other students.',
  },
  {
    question: 'Does Cyconet help with job placement?',
    answer:
      'Yes. Job support includes interview drills, portfolio review, salary negotiation coaching and warm introductions to our 180+ hiring partners. Support continues after graduation until you sign an offer. 92% of graduates are placed within six months.',
  },
  {
    question: 'Can I hire Cyconet to build or secure something?',
    answer:
      'Yes. Our tech solutions agency takes on security audits and penetration testing, custom software delivery, cloud and DevOps engineering, and data and AI consulting. Engagements are senior-led and handed over with full documentation.',
  },
  {
    question: 'What does the co-working tech hub include?',
    answer:
      'Fibre internet with full backup power, 24/7 secure keycard access, bookable meeting and call rooms, a 120-seat event floor and a recording studio. Plans run from a daily hot desk to private lockable team suites.',
  },
];

/* ------------------------------------------------------------------ *
 * Footer
 * ------------------------------------------------------------------ */

export const footer = {
  newsletter: {
    title: 'Get the cohort brief',
    body: 'Curriculum updates, scholarship windows and application deadlines. One email a month, no filler.',
  },
  columns: [
    {
      title: 'Academy',
      links: [
        { label: 'Cybersecurity Academy', href: '/cybersecurity-academy' },
        { label: 'Software Engineering', href: '/programs/software-engineering' },
        { label: 'Data Science', href: '/programs/data-science' },
        { label: 'AI & Machine Learning', href: '/programs/ai-ml' },
        { label: 'Cloud Computing', href: '/programs/cloud-computing' },
      ],
    },
    {
      title: 'Solutions',
      links: [
        { label: 'Security audits', href: '/solutions' },
        { label: 'Custom software', href: '/solutions' },
        { label: 'Cloud & DevOps', href: '/solutions' },
        { label: 'Data & AI consulting', href: '/solutions#enquiry' },
      ],
    },
    {
      title: 'Hub & School',
      links: [
        { label: 'Co-working hub', href: '/co-working-hub' },
        { label: 'Why Cyconet', href: '/#why' },
        { label: 'Instructors', href: '/#instructors' },
        { label: 'Apply', href: '/apply' },
      ],
    },
  ],
  socials: [
    { label: 'Cyconet on X', icon: 'x' as const, href: 'https://x.com' },
    { label: 'Cyconet on LinkedIn', icon: 'linkedin' as const, href: 'https://linkedin.com' },
    { label: 'Cyconet on GitHub', icon: 'github' as const, href: 'https://github.com' },
    { label: 'Cyconet on YouTube', icon: 'youtube' as const, href: 'https://youtube.com' },
  ],
} as const;
