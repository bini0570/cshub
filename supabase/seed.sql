-- ==============================================================================
-- CS HUB — Seed Data for Categories, Tags, Settings, and Initial Content
-- File: supabase/seed.sql
-- ==============================================================================

-- 1. Insert Suggested Categories
INSERT INTO public.categories (name, slug, description, icon) VALUES
  ('Programming & Software Development', 'programming', 'Core programming languages, algorithms, data structures, and software architecture.', 'Code2'),
  ('Artificial Intelligence & Machine Learning', 'ai-ml', 'Deep learning, neural networks, LLMs, computer vision, and data science resources.', 'BrainCircuit'),
  ('Cybersecurity', 'cybersecurity', 'Ethical hacking, cryptography, network security, penetration testing, and defense strategies.', 'ShieldAlert'),
  ('Networking & Cloud Computing', 'networking-cloud', 'AWS, Azure, GCP, Docker, Kubernetes, Linux servers, and network protocols.', 'Cloud'),
  ('Databases', 'databases', 'Relational SQL, NoSQL, vector databases, indexing, and distributed data pipelines.', 'Database'),
  ('Web & Mobile Development', 'web-mobile', 'Modern frontends, backend APIs, React, Next.js, Flutter, and native mobile apps.', 'Globe'),
  ('Developer Tools', 'developer-tools', 'IDEs, Git workflows, CLI utilities, debugging instruments, and productivity suites.', 'Wrench'),
  ('Open Source', 'open-source', 'Open-source software projects, contribution guides, and community initiatives.', 'GitFork'),
  ('Projects & Innovation', 'projects-innovation', 'Student capstones, portfolio projects, open hardware, and engineering research.', 'Rocket'),
  ('Career Development', 'career-development', 'Resume templates, technical interview guides, LeetCode strategies, and portfolio advice.', 'Briefcase'),
  ('Scholarships & Internships', 'scholarships-internships', 'Global research fellowships, tech internships, student grants, and scholarships.', 'GraduationCap'),
  ('Technology News', 'technology-news', 'Curated dispatches on breakthrough computing research and industry standards.', 'Newspaper')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;

-- 2. Insert Common Tags
INSERT INTO public.tags (name, slug) VALUES
  ('Python', 'python'),
  ('JavaScript', 'javascript'),
  ('React', 'react'),
  ('TypeScript', 'typescript'),
  ('Rust', 'rust'),
  ('Go', 'go'),
  ('C++', 'cpp'),
  ('Docker', 'docker'),
  ('Linux', 'linux'),
  ('Algorithms', 'algorithms'),
  ('Data Structures', 'data-structures'),
  ('System Design', 'system-design'),
  ('Machine Learning', 'machine-learning'),
  ('Web Development', 'web-development'),
  ('Cloud Architecture', 'cloud-architecture'),
  ('Internship 2026', 'internship-2026'),
  ('Open Source', 'open-source'),
  ('Security', 'security'),
  ('Beginner Friendly', 'beginner-friendly'),
  ('Roadmap', 'roadmap')
ON CONFLICT (slug) DO NOTHING;

-- 3. Default Site Settings
INSERT INTO public.site_settings (key, value) VALUES
  ('general', '{"siteName": "CS Hub", "tagline": "The Premier Computer Science Student Hub", "contactEmail": "contact@cshub.dev", "allowRegistrations": true, "allowSubmissions": true}'::jsonb),
  ('moderation', '{"autoNotifyOnReview": true, "requireAdminApproval": true, "maxUploadSizeBytes": 20971520}'::jsonb),
  ('social', '{"githubUrl": "https://github.com", "discordUrl": "https://discord.com", "twitterUrl": "https://x.com"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 4. Sample Published Content (Articles, Resources, Tools, Opportunities, Announcements)
-- Note: Replace dummy author_id with real admin profile when running in production
INSERT INTO public.content (
  title, slug, description, body, content_type, status, visibility, is_featured,
  contributor_name, view_count, download_count, published_at
) VALUES
  (
    'Demystifying Distributed Systems: Consensus with Raft',
    'demystifying-distributed-systems-consensus-raft',
    'A deep dive into distributed consensus algorithms, leader election, and log replication tailored for CS students.',
    '<h2>Introduction to Consensus</h2><p>Distributed consensus is the fundamental problem of getting a cluster of independent computers to agree on a state or sequence of values even in the face of network partitions or server crashes.</p><h3>Why Raft?</h3><p>Historically, Paxos was the dominant algorithm, but it was notoriously difficult to understand and implement correctly. Raft was designed by Stanford researchers Ongaro and Ousterhout specifically for understandability.</p><h3>Key Mechanisms of Raft</h3><ul><li><strong>Leader Election:</strong> Randomized election timers prevent split votes and establish a stable leader.</li><li><strong>Log Replication:</strong> The leader accepts client entries and safely propagates them to follower nodes.</li><li><strong>Safety:</strong> Ensuring no committed entry is ever overwritten.</li></ul><p>Explore our accompanying visual simulator in the resources section!</p>',
    'article', 'published', 'public', true,
    'Prof. Alan Vance', 482, 0, timezone('utc'::text, now()) - interval '3 days'
  ),
  (
    'CS Technical Interview Handbook 2026 Edition',
    'cs-technical-interview-handbook-2026',
    'Comprehensive 80-page cheat sheet and curated problem sets covering Arrays, Dynamic Programming, Graphs, and System Design.',
    '<h2>Mastering the Technical Screen</h2><p>This handbook has been compiled by university alumni at leading tech firms and open-source foundations. It includes structured patterns, time complexity trade-offs, and behavioral answer templates.</p>',
    'resource', 'published', 'public', true,
    'CS Hub Alumni Network', 1250, 640, timezone('utc'::text, now()) - interval '5 days'
  ),
  (
    'Excalidraw: Virtual Whiteboard for Architecture Diagrams',
    'excalidraw-diagramming-tool',
    'Open-source virtual hand-drawn style whiteboard for designing system architectures, network topologies, and data flows.',
    '<h2>Why Developers Love Excalidraw</h2><p>Excalidraw combines the spontaneous feeling of a physical whiteboard with collaborative cloud synchronization, end-to-end encryption, and customizable libraries for AWS, Kubernetes, and UML diagrams.</p>',
    'tool', 'published', 'public', false,
    'CS Hub Editors', 390, 0, timezone('utc'::text, now()) - interval '7 days'
  ),
  (
    'Google Summer of Code (GSoC) 2026 Contributor Applications Open',
    'google-summer-of-code-2026',
    'Global online program focusing on bringing new contributors into open source software development with stipends.',
    '<h2>Opportunity Overview</h2><p>GSoC is a global program connecting students and open-source enthusiasts with mentor organizations. Participants gain real-world distributed engineering experience while receiving a localized stipend.</p><h3>Eligibility</h3><ul><li>18 years of age or older at time of registration</li><li>Eligible to work in country of residence</li><li>New or beginner contributors to open source</li></ul>',
    'opportunity', 'published', 'public', true,
    'Open Source Advisory', 870, 0, timezone('utc'::text, now()) - interval '2 days'
  ),
  (
    'CS Hub Platform Launch & Contributor Call',
    'cs-hub-platform-launch-announcement',
    'Welcome to CS Hub! We are now open for student tutorial submissions, open-source project showcases, and peer study resources.',
    '<p>We are thrilled to unveil CS Hub — an independent knowledge hub built by students, for students. If you have created an exceptional study guide, cheat sheet, or tool, submit it via our submission portal!</p>',
    'announcement', 'published', 'public', true,
    'CS Hub Core Team', 1580, 0, timezone('utc'::text, now()) - interval '10 days'
  )
ON CONFLICT (slug) DO NOTHING;
