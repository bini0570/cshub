export const INITIAL_CATEGORIES = [
  {
    id: 'cat-1',
    name: 'Programming & Software Development',
    slug: 'programming',
    description: 'Core programming languages, algorithms, data structures, and software architecture.',
    icon: 'Code2',
  },
  {
    id: 'cat-2',
    name: 'Artificial Intelligence & Machine Learning',
    slug: 'ai-ml',
    description: 'Deep learning, neural networks, LLMs, computer vision, and data science resources.',
    icon: 'BrainCircuit',
  },
  {
    id: 'cat-3',
    name: 'Cybersecurity',
    slug: 'cybersecurity',
    description: 'Ethical hacking, cryptography, network security, penetration testing, and defense strategies.',
    icon: 'ShieldAlert',
  },
  {
    id: 'cat-4',
    name: 'Networking & Cloud Computing',
    slug: 'networking-cloud',
    description: 'AWS, Azure, GCP, Docker, Kubernetes, Linux servers, and network protocols.',
    icon: 'Cloud',
  },
  {
    id: 'cat-5',
    name: 'Databases',
    slug: 'databases',
    description: 'Relational SQL, NoSQL, vector databases, indexing, and distributed data pipelines.',
    icon: 'Database',
  },
  {
    id: 'cat-6',
    name: 'Web & Mobile Development',
    slug: 'web-mobile',
    description: 'Modern frontends, backend APIs, React, Next.js, Flutter, and native mobile apps.',
    icon: 'Globe',
  },
  {
    id: 'cat-7',
    name: 'Developer Tools',
    slug: 'developer-tools',
    description: 'IDEs, Git workflows, CLI utilities, debugging instruments, and productivity suites.',
    icon: 'Wrench',
  },
  {
    id: 'cat-8',
    name: 'Open Source',
    slug: 'open-source',
    description: 'Open-source software projects, contribution guides, and community initiatives.',
    icon: 'GitFork',
  },
  {
    id: 'cat-9',
    name: 'Projects & Innovation',
    slug: 'projects-innovation',
    description: 'Student capstones, portfolio projects, open hardware, and engineering research.',
    icon: 'Rocket',
  },
  {
    id: 'cat-10',
    name: 'Career Development',
    slug: 'career-development',
    description: 'Resume templates, technical interview guides, LeetCode strategies, and portfolio advice.',
    icon: 'Briefcase',
  },
  {
    id: 'cat-11',
    name: 'Scholarships & Internships',
    slug: 'scholarships-internships',
    description: 'Global research fellowships, tech internships, student grants, and scholarships.',
    icon: 'GraduationCap',
  },
  {
    id: 'cat-12',
    name: 'Technology News',
    slug: 'technology-news',
    description: 'Curated dispatches on breakthrough computing research and industry standards.',
    icon: 'Newspaper',
  },
];

export const INITIAL_TAGS = [
  { id: 'tag-1', name: 'Python', slug: 'python' },
  { id: 'tag-2', name: 'JavaScript', slug: 'javascript' },
  { id: 'tag-3', name: 'React', slug: 'react' },
  { id: 'tag-4', name: 'TypeScript', slug: 'typescript' },
  { id: 'tag-5', name: 'Rust', slug: 'rust' },
  { id: 'tag-6', name: 'Algorithms', slug: 'algorithms' },
  { id: 'tag-7', name: 'System Design', slug: 'system-design' },
  { id: 'tag-8', name: 'Docker', slug: 'docker' },
  { id: 'tag-9', name: 'Internship 2026', slug: 'internship-2026' },
  { id: 'tag-10', name: 'Open Source', slug: 'open-source' },
];

export const INITIAL_CONTENT = [];

export const INITIAL_SUBMISSIONS = [];

export const INITIAL_USERS = [];

export const INITIAL_NOTIFICATIONS = [];

export const INITIAL_AUDIT_LOGS = [];

export const ACADEMIC_YEARS = [
  { value: '', label: 'All Academic Years' },
  { value: 'Year 1', label: 'Year 1 (Freshman Fundamentals)' },
  { value: 'Year 2', label: 'Year 2 (Core CS & Systems)' },
  { value: 'Year 3', label: 'Year 3 (Advanced & Distributed Systems)' },
  { value: 'Year 4', label: 'Year 4 (Senior & Capstone)' },
];

export const ACADEMIC_SUBJECTS = [
  { value: '', label: 'All Subjects / Courses' },
  { value: 'Data Structures & Algorithms', label: 'Data Structures & Algorithms' },
  { value: 'Computer Architecture & Organization', label: 'Computer Architecture & Organization' },
  { value: 'Operating Systems & Kernels', label: 'Operating Systems & Kernels' },
  { value: 'Database Management Systems', label: 'Database Management Systems' },
  { value: 'Computer Networks & Protocols', label: 'Computer Networks & Protocols' },
  { value: 'Software Engineering & Design Patterns', label: 'Software Engineering & Design Patterns' },
  { value: 'Theory of Computation & Automata', label: 'Theory of Computation & Automata' },
  { value: 'Artificial Intelligence & ML', label: 'Artificial Intelligence & ML' },
  { value: 'Cybersecurity & Cryptography', label: 'Cybersecurity & Cryptography' },
  { value: 'Web & Distributed Systems', label: 'Web & Distributed Systems' },
];

export const STUDENT_STUDY_MATERIALS = [];

export const CS_QUIZ_QUESTIONS = [
  {
    id: 'quiz-1',
    subject: 'Data Structures & Algorithms',
    year: 'Year 2',
    question: 'What is the tightest worst-case time complexity of QuickSort when a naive first-element pivot selection is used on an already-sorted array?',
    options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
    correctIndex: 1,
    explanation: 'When the array is already sorted and the first element is selected as pivot, each partition split produces sub-arrays of sizes 0 and n-1, leading to recursive call depth n and an O(n²) total worst-case time complexity.',
  },
  {
    id: 'quiz-2',
    subject: 'Operating Systems & Kernels',
    year: 'Year 3',
    question: 'Which of the following is NOT one of the four necessary Coffman conditions required for a deadlock to occur?',
    options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption Allowed', 'Circular Wait'],
    correctIndex: 2,
    explanation: 'The Coffman condition is "No Preemption" (resources cannot be forcibly taken from a process holding them). If preemption is allowed, deadlocks cannot persist.',
  },
  {
    id: 'quiz-3',
    subject: 'Computer Networks & Protocols',
    year: 'Year 2',
    question: 'During a standard TCP 3-way handshake to establish a connection, what flags are set in the response packet sent from the server back to the client?',
    options: ['SYN only', 'ACK only', 'SYN + ACK', 'FIN + ACK'],
    correctIndex: 2,
    explanation: 'The client sends SYN; the server responds with both SYN and ACK flags simultaneously, acknowledging client initial sequence number and declaring its own sequence number.',
  },
  {
    id: 'quiz-4',
    subject: 'Database Management Systems',
    year: 'Year 2',
    question: 'Which Normal Form requires that every non-prime attribute is fully functionally dependent on the entire primary key, eliminating partial dependencies?',
    options: ['First Normal Form (1NF)', 'Second Normal Form (2NF)', 'Third Normal Form (3NF)', 'Boyce-Codd Normal Form (BCNF)'],
    correctIndex: 1,
    explanation: '2NF requires 1NF compliance and mandates that no non-prime attribute is functionally dependent on a proper subset of any candidate key (eliminating partial functional dependency).',
  },
  {
    id: 'quiz-5',
    subject: 'Computer Architecture & Organization',
    year: 'Year 1',
    question: 'In a modern CPU cache hierarchy, what is the principle that assumes memory locations accessed recently are likely to be accessed again in the near future?',
    options: ['Spatial Locality', 'Temporal Locality', 'Associative Locality', 'Pipelining'],
    correctIndex: 1,
    explanation: 'Temporal locality dictates that data referenced once is likely to be referenced again soon (e.g. loops). Spatial locality refers to accessing adjacent memory addresses.',
  },
  {
    id: 'quiz-6',
    subject: 'Cybersecurity & Cryptography',
    year: 'Year 3',
    question: 'In asymmetric public-key cryptography (e.g., RSA), which key does the recipient use to decrypt a confidential ciphertext message encrypted by the sender?',
    options: ['The sender\'s public key', 'The recipient\'s private key', 'The sender\'s private key', 'The recipient\'s public key'],
    correctIndex: 1,
    explanation: 'The sender encrypts using the recipient\'s public key; only the recipient\'s corresponding private key can decrypt it, guaranteeing confidentiality.',
  },
];
