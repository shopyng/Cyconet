import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

/*
 * bcrypt is used directly rather than via src/lib/auth.ts: that module is
 * marked 'server-only', which throws the moment it is imported outside a
 * Next.js server context — and this script runs under plain Node.
 */
const hashPassword = (password: string) => bcrypt.hash(password, 10);

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set — cannot seed.');

const prisma = new PrismaClient({ adapter: new PrismaPg(url) });

async function main() {
  console.log('🌱 Seeding database...');

  /*
   * Wipe first so the script is re-runnable. Without this the unique email and
   * program IDs collide on a second run and the whole seed aborts halfway,
   * leaving a half-populated database that is worse than either state.
   *
   * Order matters even with cascading deletes: users and programs are the two
   * roots, and everything else hangs off one of them.
   */
  await prisma.timetableEntry.deleteMany();
  await prisma.application.deleteMany();
  await prisma.user.deleteMany();
  await prisma.program.deleteMany();

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@cyconet.ng',
      password: await hashPassword('admin123'),
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('✓ Created admin user: admin@cyconet.ng / admin123');

  // Create demo student
  const student = await prisma.user.create({
    data: {
      email: 'student@example.com',
      password: await hashPassword('student123'),
      name: 'Demo Student',
      role: 'STUDENT',
    },
  });
  console.log('✓ Created demo student: student@example.com / student123');

  // Seed programs (from content.ts)
  const programsData = [
    {
      id: 'cybersecurity',
      title: 'Cybersecurity',
      duration: '14 weeks',
      description:
        'Offensive and defensive security in a live lab range — threat modelling, network defence, penetration testing and incident response.',
    },
    {
      id: 'software-engineering',
      title: 'Software Engineering',
      duration: '16 weeks',
      description:
        'Build and deploy production web applications end to end. You ship five real projects and leave with a portfolio.',
    },
    {
      id: 'data-science',
      title: 'Data Science',
      duration: '14 weeks',
      description:
        'Turn messy real-world data into decisions leadership acts on — statistics, modelling, and storytelling.',
    },
    {
      id: 'ai-ml',
      title: 'AI & Machine Learning',
      duration: '18 weeks',
      description:
        'From gradient descent to shipped inference. Train, evaluate and deploy models, then wrap them in products people use.',
    },
    {
      id: 'cloud-computing',
      title: 'Cloud Computing',
      duration: '12 weeks',
      description:
        'Design infrastructure that survives traffic, outages and audits — containers, IaC and CI/CD pipelines.',
    },
  ];

  for (const prog of programsData) {
    await prisma.program.create({ data: prog });
  }
  console.log('✓ Created 5 programs');

  // Seed cybersecurity curriculum
  const cyberModule1 = await prisma.module.create({
    data: {
      programId: 'cybersecurity',
      title: 'Foundations: Networks and Systems',
      description:
        'TCP/IP, DNS, HTTP, Linux administration and Windows internals. You cannot defend what you cannot describe.',
      order: 1,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        moduleId: cyberModule1.id,
        title: 'TCP/IP Fundamentals',
        content: `# TCP/IP Fundamentals

The Internet Protocol suite forms the backbone of modern networking. Understanding TCP/IP is essential for both offensive and defensive security work.

## Key Concepts

- **IP Addresses**: IPv4 and IPv6 addressing schemes
- **TCP vs UDP**: Connection-oriented vs connectionless protocols
- **Ports**: How services are identified on a host
- **The Three-Way Handshake**: SYN, SYN-ACK, ACK

## Practical Exercise

Use \`tcpdump\` or Wireshark to capture and analyze network traffic.`,
        videoUrl: 'https://www.youtube.com/watch?v=example1',
        order: 1,
      },
      {
        moduleId: cyberModule1.id,
        title: 'DNS Deep Dive',
        content: `# DNS Deep Dive

The Domain Name System translates human-readable domain names into IP addresses. It's also a frequent attack vector.

## DNS Record Types

- **A/AAAA**: IPv4 and IPv6 addresses
- **CNAME**: Canonical name (alias)
- **MX**: Mail exchange servers
- **TXT**: Arbitrary text records

## Security Considerations

DNS cache poisoning, DNS tunneling, and DNSSEC.`,
        order: 2,
      },
      {
        moduleId: cyberModule1.id,
        title: 'Linux System Administration',
        content: `# Linux System Administration

Most servers run Linux. You need to be comfortable navigating the filesystem, managing processes, and understanding permissions.

## Essential Commands

- \`ls\`, \`cd\`, \`pwd\`: Navigation
- \`ps\`, \`top\`, \`htop\`: Process management
- \`chmod\`, \`chown\`: Permissions
- \`systemctl\`: Service management

## User Management

Creating users, groups, and managing sudo access.`,
        order: 3,
      },
    ],
  });
  console.log('✓ Created Module 1 with 3 lessons (Cybersecurity)');

  const cyberModule2 = await prisma.module.create({
    data: {
      programId: 'cybersecurity',
      title: 'Threat Modelling and Risk',
      description:
        'Map attack surfaces, rank what actually matters, and write risk assessments a board will read.',
      order: 2,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        moduleId: cyberModule2.id,
        title: 'Introduction to Threat Modelling',
        content: `# Introduction to Threat Modelling

Threat modelling is the process of identifying potential threats and vulnerabilities in a system before they can be exploited.

## STRIDE Framework

- **S**poofing
- **T**ampering
- **R**epudiation
- **I**nformation Disclosure
- **D**enial of Service
- **E**levation of Privilege`,
        order: 1,
      },
      {
        moduleId: cyberModule2.id,
        title: 'Risk Assessment',
        content: `# Risk Assessment

Quantifying risk helps prioritize security investments.

## Risk Formula

**Risk = Likelihood × Impact**

Learn to assess both dimensions and communicate findings to non-technical stakeholders.`,
        order: 2,
      },
    ],
  });
  console.log('✓ Created Module 2 with 2 lessons (Cybersecurity)');

  // Enroll demo student in cybersecurity
  await prisma.enrollment.create({
    data: {
      userId: student.id,
      programId: 'cybersecurity',
    },
  });
  console.log('✓ Enrolled demo student in Cybersecurity');

  // Mark first lesson as complete
  const firstLesson = await prisma.lesson.findFirst({
    where: { moduleId: cyberModule1.id },
    orderBy: { order: 'asc' },
  });
  if (firstLesson) {
    await prisma.progress.create({
      data: {
        userId: student.id,
        lessonId: firstLesson.id,
        completed: true,
        completedAt: new Date(),
      },
    });
    console.log('✓ Marked first lesson as complete for demo student');
  }

  // Create exam for cybersecurity
  const exam = await prisma.exam.create({
    data: {
      programId: 'cybersecurity',
      title: 'Fundamentals Assessment',
      description: 'Test your understanding of networking and system administration basics.',
      passingScore: 70,
    },
  });

  await prisma.examQuestion.createMany({
    data: [
      {
        examId: exam.id,
        question: 'What does TCP stand for?',
        options: [
          'Transmission Control Protocol',
          'Transfer Communication Protocol',
          'Total Connection Process',
          'Transport Control Procedure',
        ],
        correct: 'A',
        order: 1,
      },
      {
        examId: exam.id,
        question: 'Which port does HTTPS typically use?',
        options: ['80', '443', '22', '3389'],
        correct: 'B',
        order: 2,
      },
      {
        examId: exam.id,
        question: 'What command shows running processes in Linux?',
        options: ['ls', 'ps', 'cd', 'rm'],
        correct: 'B',
        order: 3,
      },
      {
        examId: exam.id,
        question: 'What does the "S" in STRIDE stand for?',
        options: ['Spoofing', 'Security', 'System', 'Session'],
        correct: 'A',
        order: 4,
      },
      {
        examId: exam.id,
        question: 'Which DNS record type maps a domain to an IPv4 address?',
        options: ['A', 'CNAME', 'MX', 'TXT'],
        correct: 'A',
        order: 5,
      },
      {
        examId: exam.id,
        question: 'What is the chmod command used for in Linux?',
        options: [
          'Change file ownership',
          'Change file permissions',
          'Change file name',
          'Change file size',
        ],
        correct: 'B',
        order: 6,
      },
    ],
  });
  console.log('✓ Created exam with 6 questions (Cybersecurity)');

  // Create project for cybersecurity
  await prisma.project.create({
    data: {
      programId: 'cybersecurity',
      title: 'Network Security Analysis',
      description: 'Analyze the security posture of a sample network infrastructure.',
      requirements: `## Requirements

1. Perform a network scan using nmap
2. Identify open ports and services
3. Document potential vulnerabilities
4. Provide remediation recommendations
5. Write a professional security report

## Deliverables

- Network diagram
- Scan results and analysis
- Security report (PDF)
- GitHub repository with your tools/scripts`,
    },
  });
  console.log('✓ Created project (Cybersecurity)');

  // Create timetable entries
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  await prisma.timetableEntry.createMany({
    data: [
      {
        programId: 'cybersecurity',
        title: 'Network Security Workshop',
        description: 'Hands-on session: Setting up a lab environment with Kali Linux',
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0),
        location: 'Akala Expressway, Lab 1',
      },
      {
        programId: 'cybersecurity',
        title: 'Threat Modelling Session',
        description: 'Group exercise: Threat modelling a web application',
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 14, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 16, 0),
        location: 'Akala Expressway, Conference Room',
      },
      {
        programId: 'cybersecurity',
        title: 'Guest Lecture: Incident Response',
        description: 'Industry expert shares real-world incident response stories',
        startTime: nextWeek,
        endTime: new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000),
        location: 'Akala Expressway, Main Hall',
      },
    ],
  });
  console.log('✓ Created 3 timetable entries');

  // Two applications: one still waiting on a decision, one already actioned,
  // so the admin queue and the history view both have something to show.
  await prisma.application.create({
    data: {
      name: 'Jane Applicant',
      email: 'jane@example.com',
      phone: '+2348012345678',
      track: 'software-engineering',
      experience: 'Some self-taught experience',
      motivation:
        'I have been learning web development on my own for the past year and want to take my skills to the next level with proper mentorship and structured learning.',
    },
  });

  await prisma.application.create({
    data: {
      name: 'Demo Student',
      email: 'student@example.com',
      phone: '+2348098765432',
      track: 'cybersecurity',
      experience: 'Complete beginner',
      motivation:
        'I want to move into security from a support role. I have been running a home lab for six months and want the structure and the range time.',
      status: 'ACCEPTED',
      reviewedAt: new Date(),
      reviewedBy: admin.id,
      reviewNotes: 'Strong home-lab evidence. Accepted for the current cohort.',
    },
  });
  console.log('✓ Created 2 applications (1 pending, 1 accepted)');

  console.log('\n✅ Seed completed successfully!');
  console.log('\nLogin credentials:');
  console.log('  Admin: admin@cyconet.ng / admin123');
  console.log('  Student: student@example.com / student123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
