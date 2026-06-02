// Agithub Course Client Controller & State Manager

// --- STATE MANAGEMENT ---
let currentUser = null;
let activeTab = 'dashboard-screen';
let currentChallenge = null;
let currentStepIndex = 0;
let stepAttempts = 0;
let stepStartTime = null;
let hintTimerInterval = null;

let virtualRepo = {
    initialized: false,
    configName: '',
    configEmail: '',
    stagedFiles: [],
    committedFiles: [],
    commits: [],
    branches: ['master'],
    currentBranch: 'master',
    remotes: {},
    pushed: false,
    conflictResolved: false
};

// --- DATA: 7 GENERAL GIT CURRICULUM CHALLENGES ---
const CHALLENGES = [
    {
        id: 1,
        tag: "CHALLENGE 01",
        title: "Git Foundations & Status",
        desc: "Initialize a local repository, check status, and understand essential git tracking concepts.",
        xp: 100,
        badge: { name: "Foundations Badge", icon: "🌱" },
        ytVideoId: "apGV9Ad7XY0",
        overview: "Git is a distributed version control system that records changes to your files over time. In this module, we cover git initialization, checking status, viewing logs, and cloning remote repositories. The <code>.git</code> folder is the heart of any Git repository; it contains all configuration settings and version history metadata.",
        commands: [
            { cmd: "git init", usage: "Initialize a local Git repository in the current directory." },
            { cmd: "git status", usage: "Check state of the working directory and staging index." },
            { cmd: "git log --oneline", usage: "Display commit history in a single line format." },
            { cmd: "git clone <url>", usage: "Clone a repository from GitHub or any remote repository." }
        ],
        steps: [
            {
                type: "terminal",
                text: "Initialize a new Git repository in the current directory to start version-tracking your files.",
                hint: "Run 'git init' to create the .git database in your active workspace directory.",
                expected: /^git\s+init$/,
                action: function(repo) {
                    repo.initialized = true;
                }
            },
            {
                type: "multiple_choice",
                text: "What does the command <code>git status</code> show you?",
                hint: "It displays active files in working directory (untracked/modified) vs staged index.",
                options: [
                    "The local computer server network configurations.",
                    "The status of files: untracked, modified, or staged.",
                    "The system CPU and memory usage.",
                    "The list of developers currently logged in."
                ],
                correct: 1,
                action: function(repo) {}
            },
            {
                type: "multiple_choice",
                text: "Which command displays the full history of all commits made in this repository?",
                hint: "Use the command that prints the linear historical logs.",
                options: [
                    "git show",
                    "git diff",
                    "git log",
                    "git status"
                ],
                correct: 2,
                action: function(repo) {}
            },
            {
                type: "multiple_choice",
                text: "How do you download an existing repository from GitHub to your local machine?",
                hint: "You use clone to download a remote repository code database.",
                options: [
                    "git download",
                    "git pull --force",
                    "git init",
                    "git clone <url>"
                ],
                correct: 3,
                action: function(repo) {}
            }
        ],
        svgGen: function(stepIdx, repo) {
            let initializedStr = repo.initialized ? `<g transform="translate(150, 80)">
                <rect x="-80" y="-30" width="160" height="60" rx="8" fill="var(--bg-accent)" stroke="var(--primary)" stroke-width="2" />
                <text x="0" y="5" text-anchor="middle" fill="white" font-weight="bold" font-size="14">.git/ folder</text>
                <text x="0" y="22" text-anchor="middle" fill="var(--success)" font-size="11">Active Repository</text>
            </g>` : `<g transform="translate(150, 80)">
                <rect x="-80" y="-30" width="160" height="60" rx="8" fill="var(--bg-accent)" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="4,4" />
                <text x="0" y="5" text-anchor="middle" fill="var(--text-muted)" font-size="14">No Repo Init</text>
            </g>`;
            return `<svg width="100%" height="100%" viewBox="0 0 300 160">
                <text x="20" y="25" fill="var(--text-secondary)" font-size="12" font-weight="bold">GIT INITIALIZATION STATE</text>
                ${initializedStr}
            </svg>`;
        }
    },
    {
        id: 2,
        tag: "CHALLENGE 02",
        title: "Staging & Committing Changes",
        desc: "Save modifications by staging files and committing them with informative labels.",
        xp: 120,
        badge: { name: "Commits Badge", icon: "⚙️" },
        ytVideoId: "8oRjP8VJ2Hs",
        overview: "Saving work in Git is a two-step process: staging modifications using <code>git add</code> and committing them permanently via <code>git commit</code>. Staging acts as a conveyor belt (index) where you prepare exactly which changes you want to capture before sealing them in the repository.",
        commands: [
            { cmd: "git add .", usage: "Stage all current modifications and untracked files in active directory." },
            { cmd: "git commit -m \"message\"", usage: "Weld staged modifications permanently in version history." },
            { cmd: "git reset <file>", usage: "Unstage a file from staging index while keeping local edits." }
        ],
        steps: [
            {
                type: "order",
                text: "Arrange the standard Git workflow steps in the correct order to save changes:",
                hint: "First you modify files, then you run git add to stage them, then git commit to save.",
                items: ["git commit -m \"message\"", "Modify files", "git add ."],
                correct: ["Modify files", "git add .", "git commit -m \"message\""],
                action: function(repo) {}
            },
            {
                type: "terminal",
                text: "Stage all files in your current working directory to prepare them for commit.",
                hint: "Run 'git add .' or 'git add -A' to stage files.",
                expected: /^git\s+add\s+(\.|-A|--all)$/,
                action: function(repo) {
                    repo.stagedFiles.push("index.html");
                }
            },
            {
                type: "terminal",
                text: "Commit the staged files with the message <code>\"initial commit\"</code>.",
                hint: "Run 'git commit -m \"initial commit\"'. Make sure single or double quotes match.",
                expected: /^git\s+commit\s+-m\s+['"]initial commit['"]$/,
                action: function(repo) {
                    repo.commits.push("initial commit");
                    repo.committedFiles.push("index.html");
                    repo.stagedFiles = [];
                }
            }
        ],
        svgGen: function(stepIdx, repo) {
            let workingState = repo.stagedFiles.length === 0 && repo.committedFiles.length === 0 ? "Modified index.html" : "Clean";
            let stagedState = repo.stagedFiles.length > 0 ? "index.html (STAGED)" : "[Empty]";
            let committedState = repo.committedFiles.length > 0 ? "1 Commit (initial commit)" : "[Empty]";
            let workingColor = repo.stagedFiles.length === 0 && repo.committedFiles.length === 0 ? "var(--accent)" : "var(--text-muted)";
            let stagedColor = repo.stagedFiles.length > 0 ? "var(--primary)" : "var(--text-muted)";
            let committedColor = repo.committedFiles.length > 0 ? "var(--success)" : "var(--text-muted)";
            return `<svg width="100%" height="100%" viewBox="0 0 450 180">
                <text x="20" y="25" fill="var(--text-secondary)" font-size="12" font-weight="bold">STAGING AREA WORKFLOW</text>
                <g transform="translate(70, 90)">
                    <rect x="-60" y="-30" width="120" height="60" rx="6" fill="var(--bg-accent)" stroke="${workingColor}" stroke-width="2"/>
                    <text x="0" y="-5" text-anchor="middle" fill="white" font-size="11" font-weight="bold">Working Dir</text>
                    <text x="0" y="15" text-anchor="middle" fill="${workingColor}" font-size="10">${workingState}</text>
                </g>
                <path d="M140 90 L180 90" fill="none" stroke="var(--text-muted)" stroke-width="2" marker-end="url(#arrow)"/>
                <g transform="translate(220, 90)">
                    <rect x="-60" y="-30" width="120" height="60" rx="6" fill="var(--bg-accent)" stroke="${stagedColor}" stroke-width="2"/>
                    <text x="0" y="-5" text-anchor="middle" fill="white" font-size="11" font-weight="bold">Staging Index</text>
                    <text x="0" y="15" text-anchor="middle" fill="${stagedColor}" font-size="10">${stagedState}</text>
                </g>
                <path d="M290 90 L330 90" fill="none" stroke="var(--text-muted)" stroke-width="2" marker-end="url(#arrow)"/>
                <g transform="translate(370, 90)">
                    <rect x="-65" y="-30" width="130" height="60" rx="6" fill="var(--bg-accent)" stroke="${committedColor}" stroke-width="2"/>
                    <text x="0" y="-5" text-anchor="middle" fill="white" font-size="11" font-weight="bold">Local Repository</text>
                    <text x="0" y="15" text-anchor="middle" fill="${committedColor}" font-size="10">${committedState}</text>
                </g>
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)"/>
                    </marker>
                </defs>
            </svg>`;
        }
    },
    {
        id: 3,
        tag: "CHALLENGE 03",
        title: "Branching & Switching",
        desc: "Create and switch branches to build features in isolated environments.",
        xp: 130,
        badge: { name: "Branching Badge", icon: "🔌" },
        ytVideoId: "FyAAI18h9x8",
        overview: "Branching is Git's superpower, allowing developers to split off from the main line of development to build features in isolation without disrupting the stable master codebase. <code>HEAD</code> is a special reference pointer indicating the current active commit and branch.",
        commands: [
            { cmd: "git branch <name>", usage: "Weld a new isolated branch under specified name." },
            { cmd: "git checkout <branch>", usage: "Shift active engineering focus to target branch." },
            { cmd: "git switch -c <branch>", usage: "Modern alternative to create and switch branch instantly." }
        ],
        steps: [
            {
                type: "terminal",
                text: "Create a new branch named <code>feature-login</code> to begin development on user login authentication.",
                hint: "Run 'git branch feature-login' to configure the branch.",
                expected: /^git\s+branch\s+feature-login$/,
                action: function(repo) {
                    if (!repo.branches.includes('feature-login')) repo.branches.push('feature-login');
                }
            },
            {
                type: "terminal",
                text: "Switch to your newly created <code>feature-login</code> branch.",
                hint: "Run 'git checkout feature-login' or 'git switch feature-login'.",
                expected: /^git\s+(checkout|switch)\s+feature-login$/,
                action: function(repo) {
                    repo.currentBranch = 'feature-login';
                }
            },
            {
                type: "multiple_choice",
                text: "What does the <code>HEAD</code> pointer represent in Git?",
                hint: "HEAD always tracks which commit/branch your workspace current focuses.",
                options: [
                    "The first commit ever made in the repository.",
                    "The currently active branch/commit pointer in your directory.",
                    "The remote repository main configuration link.",
                    "The list of stashed changes on the stack."
                ],
                correct: 1,
                action: function(repo) {}
            }
        ],
        svgGen: function(stepIdx, repo) {
            let hasBranch = repo.branches.includes('feature-login');
            let active = repo.currentBranch === 'feature-login';
            let masterStroke = repo.currentBranch === 'master' ? "var(--primary)" : "var(--text-muted)";
            let branchStroke = active ? "var(--accent)" : (hasBranch ? "var(--primary)" : "var(--text-muted)");
            let branchDash = hasBranch ? "" : "4,4";
            return `<svg width="100%" height="100%" viewBox="0 0 350 180">
                <text x="20" y="25" fill="var(--text-secondary)" font-size="12" font-weight="bold">BRANCH GRAPH STATE</text>
                <line x1="60" y1="70" x2="280" y2="70" stroke="${masterStroke}" stroke-width="3"/>
                <circle cx="90" cy="70" r="8" fill="var(--primary)"/>
                <text x="90" y="90" fill="var(--text-secondary)" font-size="10" text-anchor="middle">C1</text>
                <circle cx="200" cy="70" r="8" fill="var(--primary)"/>
                <text x="200" y="90" fill="var(--text-secondary)" font-size="10" text-anchor="middle">C2 (master)</text>
                <path d="M90 70 Q140 130 200 130 L280 130" fill="none" stroke="${branchStroke}" stroke-dasharray="${branchDash}" stroke-width="3"/>
                <circle cx="200" cy="130" r="8" fill="${hasBranch ? 'var(--accent)' : 'var(--bg-accent)'}" stroke="${branchStroke}" stroke-width="2"/>
                <text x="200" y="152" fill="var(--text-secondary)" font-size="10" text-anchor="middle">feature-login</text>
                ${active ? `<g transform="translate(200, 105)">
                    <polygon points="0,5 -5,15 5,15" fill="var(--accent)" />
                    <text x="0" y="28" fill="var(--accent)" font-size="10" font-weight="bold" text-anchor="middle">HEAD</text>
                </g>` : `<g transform="translate(200, 45)">
                    <polygon points="0,15 -5,5 5,5" fill="var(--primary)" />
                    <text x="0" y="0" fill="var(--primary)" font-size="10" font-weight="bold" text-anchor="middle">HEAD</text>
                </g>`}
            </svg>`;
        }
    },
    {
        id: 4,
        tag: "CHALLENGE 04",
        title: "Merging Branches & Rebase",
        desc: "Integrate isolated modifications from one branch into another branch via merge or rebase.",
        xp: 140,
        badge: { name: "Merging Badge", icon: "📡" },
        ytVideoId: "zOnS8Q156T0",
        overview: "Merging joins development histories together. A 3-way merge creates a merge commit preserving history. Rebasing reapplies commits directly on top of another base tip, producing a clean linear history.",
        commands: [
            { cmd: "git merge <branch>", usage: "Integrate modifications from target branch into active branch." },
            { cmd: "git rebase <branch>", usage: "Reapply local branch commits linearly on top of base branch." },
            { cmd: "git merge --abort", usage: "Cancel an in-progress merge conflict state." }
        ],
        steps: [
            {
                type: "terminal",
                text: "Switch focus back to the <code>master</code> branch before merging feature progress.",
                hint: "Run 'git checkout master' or 'git switch master'.",
                expected: /^git\s+(checkout|switch)\s+(master|main)$/,
                action: function(repo) {
                    repo.currentBranch = 'master';
                }
            },
            {
                type: "terminal",
                text: "Merge the commits from <code>feature-login</code> into your active <code>master</code> branch.",
                hint: "Run 'git merge feature-login' to incorporate changes.",
                expected: /^git\s+merge\s+feature-login$/,
                action: function(repo) {
                    repo.committedFiles.push("login.js");
                }
            },
            {
                type: "multiple_choice",
                text: "What is the primary difference between merge and rebase?",
                hint: "Merge retains full split history structure; rebase shifts commits to align linearly.",
                options: [
                    "Merge creates a new commit preserving history; Rebase reapplies commits linearly on top of base.",
                    "Merge deletes the branch; Rebase moves the branch to another remote.",
                    "Merge is only used for local repositories; Rebase is only for GitHub.",
                    "Merge is faster; Rebase is more secure."
                ],
                correct: 0,
                action: function(repo) {}
            }
        ],
        svgGen: function(stepIdx, repo) {
            let merged = repo.committedFiles.includes('login.js');
            return `<svg width="100%" height="100%" viewBox="0 0 350 180">
                <text x="20" y="25" fill="var(--text-secondary)" font-size="12" font-weight="bold">MERGE STATE</text>
                <circle cx="80" cy="80" r="8" fill="var(--primary)"/>
                <text x="80" y="100" fill="var(--text-secondary)" font-size="10" text-anchor="middle">C1</text>
                <line x1="80" y1="80" x2="200" y2="50" stroke="var(--primary)" stroke-width="2"/>
                <circle cx="200" cy="50" r="8" fill="var(--primary)"/>
                <text x="200" y="38" fill="var(--text-secondary)" font-size="10" text-anchor="middle">C2</text>
                <line x1="80" y1="80" x2="200" y2="110" stroke="var(--accent)" stroke-width="2"/>
                <circle cx="200" cy="110" r="8" fill="var(--accent)"/>
                <text x="200" y="130" fill="var(--text-secondary)" font-size="10" text-anchor="middle">C3 (login)</text>
                ${merged ? `<line x1="200" y1="50" x2="290" y2="80" stroke="var(--success)" stroke-width="2"/>
                <line x1="200" y1="110" x2="290" y2="80" stroke="var(--success)" stroke-width="2"/>
                <circle cx="290" cy="80" r="10" fill="var(--success)"/>
                <text x="290" y="105" fill="var(--success)" font-size="11" font-weight="bold" text-anchor="middle">C4 (Merged)</text>` : `
                <line x1="200" y1="50" x2="280" y2="50" stroke="var(--primary)" stroke-width="2" stroke-dasharray="3,3"/>
                <line x1="200" y1="110" x2="280" y2="110" stroke="var(--accent)" stroke-width="2" stroke-dasharray="3,3"/>`}
            </svg>`;
        }
    },
    {
        id: 5,
        tag: "CHALLENGE 05",
        title: "Remote Repositories & Syncing",
        desc: "Connect local repositories to remote endpoints and publish local commit history.",
        xp: 150,
        badge: { name: "Remote Sync Badge", icon: "🦾" },
        ytVideoId: "RGOj5yH7evk",
        overview: "A remote repository is a copy of your project hosted online (e.g. GitHub). Adding a remote link connects your local workspace database with remote central collaboration centers. You use <code>git push</code> to upload commits.",
        commands: [
            { cmd: "git remote add origin <url>", usage: "Associate a remote repository pointer name with a URL." },
            { cmd: "git push -u origin master", usage: "Push local master commits and bind active tracking stream." },
            { cmd: "git remote -v", usage: "View connected remote names and target URL links." }
        ],
        steps: [
            {
                type: "terminal",
                text: "Add a remote repository named <code>origin</code> with the URL <code>https://github.com/student/gitopia.git</code>.",
                hint: "Run 'git remote add origin https://github.com/student/gitopia.git'.",
                expected: /^git\s+remote\s+add\s+origin\s+https:\/\/github\.com\/student\/gitopia\.git$/,
                action: function(repo) {
                    repo.remotes['origin'] = 'https://github.com/student/gitopia.git';
                }
            },
            {
                type: "terminal",
                text: "Push your local <code>master</code> branch commits up to the remote <code>origin</code> server and set upstream tracking.",
                hint: "Run 'git push -u origin master' to bind local master to remote master.",
                expected: /^git\s+push\s+-u\s+origin\s+master$/,
                action: function(repo) {
                    repo.pushed = true;
                }
            }
        ],
        svgGen: function(stepIdx, repo) {
            let remoteAdded = !!repo.remotes['origin'];
            let pushed = repo.pushed;
            return `<svg width="100%" height="100%" viewBox="0 0 350 180">
                <text x="20" y="25" fill="var(--text-secondary)" font-size="12" font-weight="bold">REMOTE COLLABORATION</text>
                <g transform="translate(60, 90)">
                    <rect x="-40" y="-30" width="80" height="60" rx="6" fill="var(--bg-accent)" stroke="var(--primary)" stroke-width="2"/>
                    <text x="0" y="2" text-anchor="middle" fill="white" font-size="12" font-weight="bold">Local</text>
                    <text x="0" y="18" text-anchor="middle" fill="var(--text-secondary)" font-size="10">Workspace</text>
                </g>
                <g transform="translate(290, 90)">
                    <rect x="-45" y="-30" width="90" height="60" rx="6" fill="var(--bg-accent)" stroke="${remoteAdded ? 'var(--accent)' : 'var(--text-muted)'}" stroke-width="2"/>
                    <text x="0" y="2" text-anchor="middle" fill="white" font-size="12" font-weight="bold">GitHub</text>
                    <text x="0" y="18" text-anchor="middle" fill="${remoteAdded ? 'var(--success)' : 'var(--text-muted)'}" font-size="9">${remoteAdded ? 'Connected' : 'Disconnected'}</text>
                </g>
                <path d="M110 90 L235 90" fill="none" stroke="${pushed ? 'var(--success)' : (remoteAdded ? 'var(--accent)' : 'var(--text-muted)')}" stroke-width="3" stroke-dasharray="${pushed ? '' : '5,5'}"/>
                ${pushed ? `<g transform="translate(170, 75)">
                    <text x="0" y="0" fill="var(--success)" font-size="11" font-weight="bold" text-anchor="middle">PUSHED ✓</text>
                </g>` : (remoteAdded ? `<g transform="translate(170, 75)">
                    <text x="0" y="0" fill="var(--accent)" font-size="10" text-anchor="middle">Ready to Push</text>
                </g>` : '')}
            </svg>`;
        }
    },
    {
        id: 6,
        tag: "CHALLENGE 06",
        title: "Pull Requests & Open Source",
        desc: "Master collaborative pull request reviews and standard git conventions.",
        xp: 160,
        badge: { name: "PR Badge", icon: "🚀" },
        ytVideoId: "c-Zlh7d5j1Y",
        overview: "A Pull Request (PR) tells team members about changes you have pushed to a branch in a repository on GitHub. Once a PR is opened, you can discuss and review potential modifications and add follow-up commits before changes are merged.",
        commands: [
            { cmd: "git checkout -b <branch>", usage: "Create a feature branch and switch to it immediately." },
            { cmd: "git push origin <branch>", usage: "Push feature branches to remote fork to open a pull request." },
            { cmd: "git log --graph --all", usage: "Inspect complete branching structures visually." }
        ],
        steps: [
            {
                type: "order",
                text: "Order the standard open-source collaboration workflow steps on GitHub:",
                hint: "Fork the repo first, create your branch, commit your work, then submit a Pull Request.",
                items: ["Submit PR", "Make local commit", "Create branch", "Fork repository"],
                correct: ["Fork repository", "Create branch", "Make local commit", "Submit PR"],
                action: function(repo) {}
            },
            {
                type: "multiple_choice",
                text: "A team lead requests modifications on your open GitHub PR. How do you update it?",
                hint: "When you push updates to your fork branch, the active PR refreshes automatically.",
                options: [
                    "Close the PR, delete your branch, and create a brand new PR from scratch.",
                    "Make edits locally, commit them, and push them to the same branch on your fork.",
                    "Email the raw code file changes directly to the repository administrator.",
                    "Create a new branch and open a duplicate PR on the main repository."
                ],
                correct: 1,
                action: function(repo) {}
            },
            {
                type: "multiple_choice",
                text: "What does the conventional commit label prefix <code>feat:</code> specify?",
                hint: "It represents introduction of a new user feature.",
                options: [
                    "A performance optimization.",
                    "A new product feature.",
                    "A bug fix.",
                    "A documentation change."
                ],
                correct: 1,
                action: function(repo) {}
            }
        ],
        svgGen: function(stepIdx, repo) {
            return `<svg width="100%" height="100%" viewBox="0 0 350 180">
                <text x="20" y="25" fill="var(--text-secondary)" font-size="12" font-weight="bold">PULL REQUEST WORKFLOW</text>
                <g transform="translate(175, 90)">
                    <rect x="-90" y="-35" width="180" height="70" rx="8" fill="var(--bg-accent)" stroke="var(--success)" stroke-width="2" />
                    <text x="0" y="-12" text-anchor="middle" fill="white" font-weight="bold" font-size="12">PR #42: Add Auth Logic</text>
                    <text x="0" y="10" text-anchor="middle" fill="var(--success)" font-size="10">✓ All checks passed</text>
                    <text x="0" y="25" text-anchor="middle" fill="var(--text-secondary)" font-size="9">Approved by Maintainers</text>
                </g>
            </svg>`;
        }
    },
    {
        id: 7,
        tag: "CHALLENGE 07",
        title: "Conflict Resolution & Tools",
        desc: "Resolve code merge conflicts manually and master deep git diagnostics.",
        xp: 180,
        badge: { name: "Graduation Badge", icon: "🏆" },
        ytVideoId: "H5GJuap1Y4c",
        overview: "Merge conflicts occur when changes are made to the same line of a file in different branches. You must manually resolve conflict markers <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code>, <code>=======</code>, and <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code> before staging and finalizing.",
        commands: [
            { cmd: "git status", usage: "Locate all conflicting files marked with 'both modified'." },
            { cmd: "git add <file>", usage: "Stage the manually resolved file to mark conflicts solved." },
            { cmd: "git merge --abort", usage: "Cleanly roll back and abort the current merge process." }
        ],
        steps: [
            {
                type: "fix_conflict",
                text: "Clean this merge conflict in <code>app.js</code> by selecting the incoming Agithub branding title and removing all conflict markers:",
                hint: "Keep ONLY: const title = \"Agithub Platform\";",
                conflictText: "<<<<<<< HEAD\nconst title = \"Robotics Hub\";\n=======\nconst title = \"Agithub Platform\";\n>>>>>>> feature-title",
                correct: "const title = \"Agithub Platform\";",
                action: function(repo) {
                    repo.conflictResolved = true;
                }
            },
            {
                type: "multiple_choice",
                text: "After manually resolving a merge conflict inside a file, what is your next step?",
                hint: "Stage the resolved file modifications, then execute git commit to finalize.",
                options: [
                    "Run git commit without staging.",
                    "Stage the resolved file using git add, then commit.",
                    "Run git push --force immediately.",
                    "Delete the conflicting branch and start over."
                ],
                correct: 1,
                action: function(repo) {}
            },
            {
                type: "multiple_choice",
                text: "Which command cancels an in-progress merge conflict state and restores original files?",
                hint: "Use merge --abort to cancel.",
                options: [
                    "git merge --abort",
                    "git reset --hard HEAD",
                    "git checkout --abort",
                    "git cancel merge"
                ],
                correct: 0,
                action: function(repo) {}
            }
        ],
        svgGen: function(stepIdx, repo) {
            let resolved = !!repo.conflictResolved;
            return `<svg width="100%" height="100%" viewBox="0 0 350 180">
                <text x="20" y="25" fill="var(--text-secondary)" font-size="12" font-weight="bold">CONFLICT RESOLUTION STATUS</text>
                <g transform="translate(175, 95)">
                    <rect x="-90" y="-45" width="180" height="90" rx="8" fill="var(--bg-accent)" stroke="${resolved ? 'var(--success)' : 'var(--danger)'}" stroke-width="2" />
                    <text x="0" y="-22" text-anchor="middle" fill="white" font-weight="bold" font-size="12">app.js code state</text>
                    <text x="0" y="2" text-anchor="middle" fill="${resolved ? 'var(--success)' : 'var(--danger)'}" font-size="12" font-weight="bold">
                        ${resolved ? '✓ CONFLICT RESOLVED' : '⚠ CONFLICT MARKERS DETECTED'}
                    </text>
                    <text x="0" y="22" text-anchor="middle" fill="var(--text-secondary)" font-size="9">
                        ${resolved ? 'Clean master branch rebuild' : '<<<<<<< HEAD vs >>>>>>> branch'}
                    </text>
                </g>
            </svg>`;
        }
    }
];

// --- APP SETUP ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    setupAuthListeners();
    setupNavigationListeners();
    setupProfileListeners();
    setupWorkspaceListeners();
    checkSession();
    bindGlobalCommandCopyHandlers();
}

// --- SESSION MANAGER ---
async function checkSession() {
    try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data.success) {
            currentUser = data.profile;
            showDashboard();
            updateHeaderStatus();
            document.getElementById('main-nav-links').classList.remove('hidden');
        } else {
            showScreen('auth-screen');
            document.getElementById('main-nav-links').classList.add('hidden');
        }
    } catch (e) {
        showScreen('auth-screen');
        document.getElementById('main-nav-links').classList.add('hidden');
    }
}

// --- NAV & ROUTER ---
function showScreen(screenId) {
    const screens = ['auth-screen', 'dashboard-screen', 'learning-screen', 'profile-screen', 'workspace-screen', 'reference-screen'];
    
    // Stop iframe video audio from playing in the background
    if (screenId !== 'learning-screen') {
        const learningIframe = document.querySelector('#active-topic-panel iframe');
        if (learningIframe) {
            learningIframe.src = '';
        }
    }

    screens.forEach(id => {
        const el = document.getElementById(id);
        if (id === screenId) {
            el.classList.add('active-screen');
            el.classList.remove('hidden-screen');
        } else {
            el.classList.remove('active-screen');
            el.classList.add('hidden-screen');
        }
    });

    // Sync header navigation active class
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('data-tab') === screenId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

let activeTopicIndex = 0;

function setupNavigationListeners() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const target = link.getAttribute('data-tab');
            if (target === 'dashboard-screen') {
                showDashboard();
            } else if (target === 'learning-screen') {
                showLearningHub();
            } else if (target === 'profile-screen') {
                showProfileScreen();
            } else if (target === 'reference-screen') {
                showReferenceScreen();
            }
        });
    });
}

function updateHeaderStatus() {
    const headerBadge = document.getElementById('header-user-badge');
    if (!currentUser) {
        headerBadge.innerHTML = '';
        return;
    }
    
    headerBadge.innerHTML = `
        <div class="user-badge-container">
            <span class="badge-username">${currentUser.username}</span>
            <span class="badge-level">LVL ${currentUser.level}</span>
            <button class="btn-header-logout" onclick="logoutOperator()">LOGOUT</button>
        </div>
    `;
}

async function logoutOperator() {
    await fetch('/api/logout', { method: 'POST' });
    currentUser = null;
    updateHeaderStatus();
    checkSession();
}

// --- AUTHENTICATION LISTENERS ---
function setupAuthListeners() {
    const btnToggleLogin = document.getElementById('btn-toggle-login');
    const btnToggleRegister = document.getElementById('btn-toggle-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorBox = document.getElementById('auth-error');

    btnToggleLogin.addEventListener('click', () => {
        btnToggleLogin.classList.add('active');
        btnToggleRegister.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        errorBox.classList.add('hidden');
    });

    btnToggleRegister.addEventListener('click', () => {
        btnToggleRegister.classList.add('active');
        btnToggleLogin.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        errorBox.classList.add('hidden');
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username_or_email = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        errorBox.classList.add('hidden');
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username_or_email, password })
            });
            const data = await res.json();
            if (data.success) {
                checkSession();
            } else {
                showAuthError(data.message || "Invalid credentials.");
            }
        } catch (err) {
            showAuthError("Server unreachable.");
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        errorBox.classList.add('hidden');
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();
            if (data.success) {
                checkSession();
            } else {
                showAuthError(data.message || "Registration failed.");
            }
        } catch (err) {
            showAuthError("Server unreachable.");
        }
    });
}

async function handleOAuthLogin(provider) {
    const mockEmail = provider === 'google' ? 'google_student@gmail.com' : 'github_student@gmail.com';
    const mockUsername = provider === 'google' ? 'GoogleStudent' : 'GitHubStudent';
    const errBox = document.getElementById('auth-error');
    errBox.classList.add('hidden');
    
    try {
        const res = await fetch('/api/oauth-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, email: mockEmail, username: mockUsername })
        });
        const data = await res.json();
        if (data.success) {
            currentUser = data.user;
            showDashboard();
            updateHeaderStatus();
            document.getElementById('main-nav-links').classList.remove('hidden');
        } else {
            errBox.textContent = data.message || "OAuth authentication failed.";
            errBox.classList.remove('hidden');
        }
    } catch (e) {
        errBox.textContent = "OAuth server communication failure.";
        errBox.classList.remove('hidden');
    }
}

function showAuthError(msg) {
    const errorBox = document.getElementById('auth-error');
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
}

// --- PROFILE SETTINGS ---
function showProfileScreen() {
    showScreen('profile-screen');
    if (!currentUser) return;

    document.getElementById('profile-username-input').value = currentUser.username;
    document.getElementById('profile-email-input').value = currentUser.email;
    
    // Pick active avatar
    const avatar = currentUser.badges.includes("Avatar") ? currentUser.badges[0] : '🎓';
    const options = document.querySelectorAll('.avatar-option');
    options.forEach(opt => {
        if (opt.textContent === avatar) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });
}

function setupProfileListeners() {
    const options = document.querySelectorAll('.avatar-option');
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        });
    });

    const form = document.getElementById('profile-update-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('profile-username-input').value;
        const activeAvatar = document.querySelector('.avatar-option.active').textContent;
        
        currentUser.username = name;
        
        if (currentUser.badges.length > 0 && ['🎓','💻','🛠️','🐙','🚀','🔑','🏆','🌟'].includes(currentUser.badges[0])) {
            currentUser.badges[0] = activeAvatar;
        } else {
            currentUser.badges.unshift(activeAvatar);
        }

        try {
            await fetch('/api/update-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level: currentUser.level,
                    xp: currentUser.xp,
                    badges: currentUser.badges,
                    progress: currentUser.progress
                })
            });
            
            const res = await fetch('/api/profile');
            const data = await res.json();
            if (data.success) {
                currentUser = data.profile;
                updateHeaderStatus();
                alert("Profile credentials updated successfully.");
                showDashboard();
            }
        } catch (err) {
            alert("Failed to sync profile configuration details.");
        }
    });
}

// --- DASHBOARD MECHANICS ---
function showDashboard() {
    showScreen('dashboard-screen');
    updateDashboardUI();
}

function updateDashboardUI() {
    if (!currentUser) return;

    document.getElementById('profile-operator-name').textContent = currentUser.username.toUpperCase();
    document.getElementById('profile-level').textContent = currentUser.level;
    document.getElementById('profile-xp').textContent = `${currentUser.xp} XP`;

    // Avatar pick
    let activeAvatar = '🎓';
    if (currentUser.badges.length > 0 && ['🎓','💻','🛠️','🐙','🚀','🔑','🏆','🌟'].includes(currentUser.badges[0])) {
        activeAvatar = currentUser.badges[0];
    }
    document.getElementById('profile-avatar-char').textContent = activeAvatar;

    // Rank Tag
    let rank = "Git Apprentice";
    if (currentUser.level >= 6) rank = "Git Master";
    else if (currentUser.level >= 4) rank = "Version Control Professional";
    else if (currentUser.level >= 2) rank = "Repository Maintainer";
    document.getElementById('profile-operator-rank').textContent = rank;

    // Syllabus Completion
    const completedCount = Object.values(currentUser.progress).filter(p => p === 'completed').length;
    const progressPercent = Math.round((completedCount / CHALLENGES.length) * 100);
    document.getElementById('syllabus-percent').textContent = `${progressPercent}%`;
    document.getElementById('syllabus-fill').style.width = `${progressPercent}%`;

    // Certificate Unlock state Check
    const certWidget = document.getElementById('certificate-widget');
    const certOpenBtn = document.getElementById('btn-open-cert');
    const certStatusText = document.getElementById('cert-status-text');

    if (completedCount >= CHALLENGES.length) {
        certWidget.classList.remove('locked');
        certWidget.classList.add('unlocked');
        certOpenBtn.disabled = false;
        certStatusText.textContent = "Graduation complete! You are qualified as a Certified Git & GitHub Collaboration Expert.";
    } else {
        certWidget.classList.add('locked');
        certWidget.classList.remove('unlocked');
        certOpenBtn.disabled = true;
        certStatusText.textContent = "Complete all 7 Git challenges to unlock your graduation credentials.";
    }

    // Bind Certificate Modal Open
    certOpenBtn.onclick = () => {
        document.getElementById('cert-name-display').textContent = currentUser.username.toUpperCase();
        document.getElementById('cert-verification-id').textContent = `AGIT-${currentUser.id || '99'}${currentUser.xp}A`;
        document.getElementById('cert-overlay').classList.remove('hidden');
    };
    document.getElementById('cert-modal-close').onclick = () => {
        document.getElementById('cert-overlay').classList.add('hidden');
    };

    renderChallengesChecklist();
}

function renderChallengesChecklist() {
    const grid = document.getElementById('challenges-grid');
    grid.innerHTML = '';

    CHALLENGES.forEach((c, idx) => {
        const status = currentUser.progress[c.id.toString()] || 'locked';
        let rowClass = "challenge-row-card";
        
        let isClickable = false;
        if (idx === 0 || currentUser.progress[(c.id - 1).toString()] === 'completed') {
            isClickable = true;
        }

        let buttonHTML = '';
        if (status === 'completed') {
            rowClass += " completed";
            buttonHTML = `
                <div class="challenge-status-btn">
                    <span class="status-badge completed">✓ Completed</span>
                </div>
            `;
        } else if (isClickable) {
            buttonHTML = `
                <div class="challenge-status-btn">
                    <button class="btn btn-small btn-primary" onclick="launchChallengeById(${c.id})">Start Challenge</button>
                </div>
            `;
        } else {
            buttonHTML = `
                <div class="challenge-status-btn">
                    <span class="status-badge locked">🔒 Locked</span>
                </div>
            `;
        }

        const card = document.createElement('div');
        card.className = rowClass;
        card.innerHTML = `
            <div class="challenge-num">${String(c.id).padStart(2, '0')}</div>
            <div class="challenge-info">
                <div class="challenge-row-header">
                    <h4>${c.title}</h4>
                    <span class="xp-bounty">${c.xp} XP</span>
                </div>
                <p class="challenge-desc">${c.desc}</p>
            </div>
            ${buttonHTML}
        `;
        grid.appendChild(card);
    });
}

function launchChallengeById(id) {
    const chal = CHALLENGES.find(c => c.id === id);
    if (chal) startChallenge(chal);
}

// --- LEARNING HUB TAB ---
function showLearningHub() {
    showScreen('learning-screen');
    renderLearningHubMenu();
}

function renderLearningHubMenu() {
    const menu = document.getElementById('topics-navigation-menu');
    menu.innerHTML = '';

    CHALLENGES.forEach((c, idx) => {
        const item = document.createElement('div');
        item.className = "topic-menu-item";
        if (idx === activeTopicIndex) {
            item.classList.add('active');
            renderActiveLearningTopic(c);
        }
        item.innerHTML = `<span>${c.badge.icon}</span> ${c.title}`;
        
        item.addEventListener('click', () => {
            document.querySelectorAll('.topic-menu-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            activeTopicIndex = idx;
            renderActiveLearningTopic(c);
        });

        menu.appendChild(item);
    });
}

function renderActiveLearningTopic(topic) {
    const panel = document.getElementById('active-topic-panel');
    
    let cmdListHTML = '';
    topic.commands.forEach(cmdObj => {
        cmdListHTML += `<code>${cmdObj.cmd}</code> - ${cmdObj.usage}\n`;
    });

    panel.innerHTML = `
        <div class="card topic-detail-card">
            <div class="topic-title-area">
                <h3>${topic.title}</h3>
                <span class="xp-bounty">${topic.xp} XP Challenge Bounty</span>
            </div>

            <!-- YouTube Iframe Responsive player -->
            <div class="video-wrapper">
                <iframe src="https://www.youtube.com/embed/${topic.ytVideoId}" allowfullscreen></iframe>
            </div>

            <div class="learning-syllabus-text">
                <p>${topic.overview}</p>
                
                <div class="topic-cheat-card">
                    <h4>Common Git Operations Cheatcode</h4>
                    <pre>${cmdListHTML}</pre>
                </div>

                <button class="btn btn-primary" onclick="launchChallengeById(${topic.id})">Tackle ${topic.title} Challenge</button>
            </div>
        </div>
    `;
}

// --- WORKSPACE SIMULATOR ---
function startChallenge(challenge) {
    currentChallenge = challenge;
    currentStepIndex = 0;
    
    // Reset simulated repo
    virtualRepo = {
        initialized: false,
        configName: '',
        configEmail: '',
        stagedFiles: [],
        committedFiles: [],
        commits: [],
        branches: ['master'],
        currentBranch: 'master',
        remotes: {},
        pushed: false,
        conflictResolved: false
    };

    // Prepopulate git history state based on completed milestones
    if (challenge.id > 1) {
        virtualRepo.initialized = true;
        virtualRepo.configName = currentUser.username;
        virtualRepo.configEmail = currentUser.email;
    }
    if (challenge.id > 2) {
        virtualRepo.committedFiles.push('index.html');
        virtualRepo.commits.push("initial commit");
    }
    if (challenge.id > 3) {
        virtualRepo.branches.push('feature-login');
    }
    if (challenge.id > 4) {
        virtualRepo.committedFiles.push('login.js');
    }
    if (challenge.id > 5) {
        virtualRepo.remotes['origin'] = 'https://github.com/student/gitopia.git';
        virtualRepo.pushed = true;
    }

    // Set header labels
    document.getElementById('active-challenge-tag').textContent = challenge.tag;
    document.getElementById('active-challenge-title').textContent = challenge.title.toUpperCase();

    // Reset console lines
    const list = document.getElementById('workspace-terminal-history');
    list.innerHTML = `
        <div class="term-line welcome-text">Agithub Terminal Simulator [Ready]</div>
        <div class="term-line welcome-text">Working Directory: /home/student/projects/gitopia</div>
        <div class="term-line welcome-text">Solve the instructions on the left. Type commands here.</div>
    `;

    renderWorkspaceStepMarkers();
    renderWorkspaceStepInstructions();
    updateWorkspaceCAD();

    showScreen('workspace-screen');
}

function setupWorkspaceListeners() {
    // Back to dashboard
    document.getElementById('workspace-back-btn').addEventListener('click', () => {
        showDashboard();
    });

    // Reset simulator
    document.getElementById('workspace-reset-btn').addEventListener('click', () => {
        startChallenge(currentChallenge);
    });

    // Terminal keystroke
    const input = document.getElementById('workspace-terminal-input');
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = input.value.trim();
            if (val) {
                executeWorkspaceCommand(val);
                input.value = '';
            }
        }
    });

    // Claim reward button on overlay
    document.getElementById('modal-reward-claim-btn').addEventListener('click', () => {
        document.getElementById('reward-overlay').classList.add('hidden');
        showDashboard();
    });
    
    // Claim next challenge button on overlay
    document.getElementById('modal-reward-next-btn').onclick = () => {
        document.getElementById('reward-overlay').classList.add('hidden');
        const nextId = currentChallenge.id + 1;
        const nextChal = CHALLENGES.find(c => c.id === nextId);
        if (nextChal) {
            startChallenge(nextChal);
        } else {
            showDashboard();
        }
    };
}

function renderWorkspaceStepMarkers() {
    const markers = document.getElementById('active-step-markers');
    markers.innerHTML = '';
    
    currentChallenge.steps.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = "step-marker-dot";
        if (idx === currentStepIndex) {
            dot.classList.add('active');
        } else if (idx < currentStepIndex) {
            dot.classList.add('completed');
        }
        markers.appendChild(dot);
    });
}

function renderWorkspaceStepInstructions() {
    const box = document.getElementById('active-step-instruction');
    const step = currentChallenge.steps[currentStepIndex];

    if (hintTimerInterval) clearInterval(hintTimerInterval);

    stepAttempts = 0;
    stepStartTime = Date.now();

    let interactiveHTML = '';
    
    if (step.type === 'multiple_choice') {
        interactiveHTML = `
            <div class="mcq-options-container">
                ${step.options.map((opt, i) => `
                    <button class="btn-mcq-option" onclick="submitMCQAnswer(${i})">${opt}</button>
                `).join('')}
            </div>
        `;
        setTerminalInputState(false, "Select an option to answer.");
    } else if (step.type === 'order') {
        window.currentOrderSelection = [];
        window.currentOrderAvailable = [...step.items];
        interactiveHTML = renderOrderingInterface();
        setTerminalInputState(false, "Arrange items in correct sequence.");
    } else if (step.type === 'fix_conflict') {
        const textToFix = step.conflictText || "";
        interactiveHTML = `
            <div class="conflict-editor-container">
                <textarea id="conflict-text-editor" class="conflict-textarea" rows="6">${textToFix}</textarea>
                <button class="btn btn-primary" onclick="submitConflictFix()">Submit Fix</button>
            </div>
        `;
        setTerminalInputState(false, "Resolve the conflict in the editor.");
    } else {
        interactiveHTML = `
            <div class="terminal-instruction-notice" style="margin-top: 10px; color: var(--text-secondary); font-size: 0.85rem;">
                <p>Type the correct command in the terminal on the right.</p>
            </div>
        `;
        setTerminalInputState(true);
    }

    box.innerHTML = `
        <div class="step-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h4 style="margin:0;">STEP ${currentStepIndex + 1} OF ${currentChallenge.steps.length}</h4>
            <span class="xp-bounty" style="font-size:0.8rem;">+${step.xp || 40} XP</span>
        </div>
        <p class="step-text-prompt">${step.text}</p>
        
        ${interactiveHTML}

        <div id="step-feedback-box" class="step-feedback-banner hidden"></div>

        <div id="step-hint-box" class="topic-cheat-card step-hint-card hidden animate-fade-in" style="margin-top: 14px; padding: 12px; border-left: 4px solid var(--accent); background: var(--bg-main);">
            <strong style="color: var(--accent);">💡 REFERENCE HINT:</strong> 
            <p style="margin: 4px 0 0 0; font-size: 0.85rem; line-height: 1.4;">${step.hint}</p>
        </div>
    `;

    hintTimerInterval = setInterval(() => {
        const elapsed = (Date.now() - stepStartTime) / 1000;
        if (elapsed >= 30) {
            showStepHint();
            clearInterval(hintTimerInterval);
        }
    }, 1000);
}

function setTerminalInputState(enabled, placeholderMessage = "Type commands here...") {
    const input = document.getElementById('workspace-terminal-input');
    const prompt = document.querySelector('.console-input-row .prompt');
    if (input) {
        input.disabled = !enabled;
        if (enabled) {
            input.placeholder = placeholderMessage;
            if (prompt) prompt.style.opacity = '1';
        } else {
            input.placeholder = placeholderMessage;
            if (prompt) prompt.style.opacity = '0.3';
        }
    }
}

function submitMCQAnswer(index) {
    const step = currentChallenge.steps[currentStepIndex];
    if (index === step.correct) {
        showStepSuccess("Correct! Proceeding...");
        setTimeout(() => {
            advanceWorkspaceStep();
        }, 1200);
    } else {
        stepAttempts++;
        showStepFailure("Incorrect option. Try again!");
        if (stepAttempts >= 5) {
            showStepHint();
        }
    }
}

function renderOrderingInterface() {
    return `
        <div class="ordering-container">
            <div class="order-pool-title">Available Steps (Click to add):</div>
            <div class="order-chips-pool" id="order-pool">
                ${window.currentOrderAvailable.map((item, i) => `
                    <span class="order-chip" onclick="selectOrderItem(${i})">${item}</span>
                `).join('')}
                ${window.currentOrderAvailable.length === 0 ? '<span style="color:var(--text-muted); font-size:0.8rem;">[All selected]</span>' : ''}
            </div>
            
            <div class="order-pool-title">Your Sequence:</div>
            <div class="order-chips-sequence" id="order-sequence">
                ${window.currentOrderSelection.map((item, i) => `
                    <span class="order-chip selected-chip" onclick="deselectOrderItem(${i})">${item}</span>
                `).join('')}
                ${window.currentOrderSelection.length === 0 ? '<span style="color:var(--text-muted); font-size:0.8rem;">[Empty sequence]</span>' : ''}
            </div>

            <div class="ordering-actions">
                <button class="btn btn-secondary btn-small" onclick="resetOrderSelection()">Reset</button>
                <button class="btn btn-primary btn-small" onclick="submitOrderSelection()">Submit</button>
            </div>
        </div>
    `;
}

window.selectOrderItem = function(idx) {
    const item = window.currentOrderAvailable[idx];
    window.currentOrderAvailable.splice(idx, 1);
    window.currentOrderSelection.push(item);
    refreshOrderingUI();
};

window.deselectOrderItem = function(idx) {
    const item = window.currentOrderSelection[idx];
    window.currentOrderSelection.splice(idx, 1);
    window.currentOrderAvailable.push(item);
    refreshOrderingUI();
};

window.resetOrderSelection = function() {
    const step = currentChallenge.steps[currentStepIndex];
    window.currentOrderAvailable = [...step.items];
    window.currentOrderSelection = [];
    refreshOrderingUI();
};

function refreshOrderingUI() {
    const container = document.querySelector('.ordering-container');
    if (container) {
        container.outerHTML = renderOrderingInterface();
    }
}

window.submitOrderSelection = function() {
    const step = currentChallenge.steps[currentStepIndex];
    if (window.currentOrderSelection.length !== step.correct.length) {
        showStepFailure("Sequence is incomplete!");
        return;
    }
    
    const isCorrect = window.currentOrderSelection.every((val, i) => val === step.correct[i]);
    if (isCorrect) {
        showStepSuccess("Correct sequence!");
        setTimeout(() => {
            advanceWorkspaceStep();
        }, 1200);
    } else {
        stepAttempts++;
        showStepFailure("Incorrect order. Try again!");
        if (stepAttempts >= 5) {
            showStepHint();
        }
    }
};

window.submitConflictFix = function() {
    const step = currentChallenge.steps[currentStepIndex];
    const editor = document.getElementById('conflict-text-editor');
    if (!editor) return;
    
    // Normalize lines
    const val = editor.value.trim().replace(/\r\n/g, '\n');
    const expected = step.correct.trim().replace(/\r\n/g, '\n');
    
    if (val === expected) {
        if (step.action) step.action(virtualRepo);
        showStepSuccess("Conflict resolved successfully!");
        setTimeout(() => {
            advanceWorkspaceStep();
        }, 1200);
    } else {
        stepAttempts++;
        showStepFailure("Your resolution does not match the clean code file.");
        if (stepAttempts >= 5) {
            showStepHint();
        }
    }
};

function showStepSuccess(msg) {
    const fb = document.getElementById('step-feedback-box');
    if (fb) {
        fb.textContent = msg;
        fb.className = "step-feedback-banner success";
        fb.classList.remove('hidden');
    }
}

function showStepFailure(msg) {
    const fb = document.getElementById('step-feedback-box');
    if (fb) {
        fb.textContent = msg;
        fb.className = "step-feedback-banner error";
        fb.classList.remove('hidden');
    }
}

function showStepHint() {
    const hintBox = document.getElementById('step-hint-box');
    if (hintBox) {
        hintBox.classList.remove('hidden');
    }
}

function advanceWorkspaceStep() {
    if (hintTimerInterval) clearInterval(hintTimerInterval);
    
    currentStepIndex++;
    if (currentStepIndex >= currentChallenge.steps.length) {
        triggerChallengeSuccess();
    } else {
        renderWorkspaceStepMarkers();
        renderWorkspaceStepInstructions();
        updateWorkspaceCAD();
    }
}

function updateWorkspaceCAD() {
    const viewport = document.getElementById('active-cad-viewer');
    viewport.innerHTML = currentChallenge.svgGen(currentStepIndex, virtualRepo);
}

// --- TERMINAL ENGINE ---
function executeWorkspaceCommand(cmd) {
    const list = document.getElementById('workspace-terminal-history');
    
    const echo = document.createElement('div');
    echo.className = "term-line cmd-echo";
    echo.style.color = "var(--primary)";
    echo.textContent = `student@gitopia:~$ ${cmd}`;
    list.appendChild(echo);

    const clean = cmd.trim();

    if (clean === 'clear') {
        list.innerHTML = '';
        scrollConsole();
        return;
    }
    if (clean === 'help') {
        appendConsoleLine("utilities: clear, help, git, ls", "welcome-text");
        scrollConsole();
        return;
    }
    if (clean === 'ls') {
        let files = [];
        if (virtualRepo.initialized) {
            files.push('.git/');
        }
        if (virtualRepo.committedFiles.includes('index.html') || virtualRepo.stagedFiles.includes('index.html')) {
            files.push('index.html');
        }
        if (virtualRepo.committedFiles.includes('login.js')) {
            files.push('login.js');
        }
        appendConsoleLine(files.join('  ') || '[empty]', 'welcome-text');
        scrollConsole();
        return;
    }

    if (clean.startsWith('git ')) {
        handleGitWorkspaceCommand(clean);
    } else {
        appendConsoleLine(`Command not found: '${clean}'. Type 'help' for support.`, 'cmd-error');
    }

    scrollConsole();
}

function appendConsoleLine(text, className = '') {
    const list = document.getElementById('workspace-terminal-history');
    const line = document.createElement('div');
    line.className = `term-line ${className}`;
    line.textContent = text;
    list.appendChild(line);
}

function scrollConsole() {
    const list = document.getElementById('workspace-terminal-history');
    list.scrollTop = list.scrollHeight;
}

function handleGitWorkspaceCommand(cmd) {
    const parts = cmd.split(/\s+/);
    const sub = parts[1];

    if (!virtualRepo.initialized && sub !== 'init') {
        appendConsoleLine("fatal: not a git repository (or any of the parent directories): .git", "cmd-error");
        return;
    }

    const step = currentChallenge.steps[currentStepIndex];
    const isMatching = step && step.expected && step.expected.test(cmd);

    // Dynamic responses for Git commands
    if (sub === 'init') {
        virtualRepo.initialized = true;
        appendConsoleLine("Initialized empty Git repository in /home/student/projects/gitopia/.git/", "cmd-success");
    } 
    else if (sub === 'status') {
        let out = `On branch ${virtualRepo.currentBranch}\n`;
        if (virtualRepo.stagedFiles.length > 0) {
            out += "Changes to be committed:\n";
            virtualRepo.stagedFiles.forEach(f => {
                out += `\tnew file:   ${f}\n`;
            });
        } else if (virtualRepo.committedFiles.includes('index.html')) {
            out += "nothing to commit, working tree clean";
        } else {
            out += "Untracked files:\n\tindex.html\n\nnothing added to commit but untracked files present";
        }
        appendConsoleLine(out);
    } 
    else if (sub === 'add') {
        const file = parts[2];
        if (file === '.' || file === 'index.html') {
            if (!virtualRepo.stagedFiles.includes('index.html')) {
                virtualRepo.stagedFiles.push('index.html');
            }
            appendConsoleLine("Staged index.html successfully.", "cmd-success");
        } else {
            appendConsoleLine(`fatal: pathspec '${file}' did not match any files`, "cmd-error");
        }
    } 
    else if (sub === 'commit') {
        const flag = parts[2];
        const msg = parts.slice(3).join(' ');
        if (flag !== '-m' || !msg) {
            appendConsoleLine("error: switch \`m\` requires a value", "cmd-error");
            return;
        }
        if (virtualRepo.stagedFiles.length === 0) {
            appendConsoleLine("nothing to commit (use \"git add\" to stage)", "welcome-text");
            return;
        }
        virtualRepo.stagedFiles.forEach(f => {
            if (!virtualRepo.committedFiles.includes(f)) virtualRepo.committedFiles.push(f);
        });
        virtualRepo.stagedFiles = [];
        virtualRepo.commits.push(msg);
        appendConsoleLine(`[${virtualRepo.currentBranch} d3b90a8] ${msg}\n 1 file changed, 14 insertions(+)`, "cmd-success");
    } 
    else if (sub === 'branch') {
        const name = parts[2];
        if (!name) {
            appendConsoleLine(virtualRepo.branches.map(b => b === virtualRepo.currentBranch ? `* ${b}` : `  ${b}`).join('\n'));
        } else {
            if (!virtualRepo.branches.includes(name)) virtualRepo.branches.push(name);
            appendConsoleLine(`Branch '${name}' configured.`, "cmd-success");
        }
    } 
    else if (sub === 'checkout' || sub === 'switch') {
        const target = parts[2] || parts[3]; // handle switch -c
        if (target) {
            if (cmd.includes('-b') || cmd.includes('-c')) {
                const bname = parts[parts.length - 1];
                if (!virtualRepo.branches.includes(bname)) virtualRepo.branches.push(bname);
                virtualRepo.currentBranch = bname;
                appendConsoleLine(`Switched to a new branch '${bname}'`, "cmd-success");
            } else if (virtualRepo.branches.includes(target)) {
                virtualRepo.currentBranch = target;
                appendConsoleLine(`Switched to branch '${target}'`, "cmd-success");
            } else {
                appendConsoleLine(`error: branch ${target} not found.`, "cmd-error");
            }
        }
    } 
    else if (sub === 'merge') {
        const branch = parts[2];
        if (branch === 'feature-login') {
            if (!virtualRepo.committedFiles.includes('login.js')) virtualRepo.committedFiles.push('login.js');
            appendConsoleLine(`Updating ${virtualRepo.currentBranch}... fast-forward\n Merged branch '${branch}'.`, "cmd-success");
        } else {
            appendConsoleLine("Merge target branch not found.", "cmd-error");
        }
    } 
    else if (sub === 'remote') {
        if (parts[2] === 'add') {
            const name = parts[3];
            const url = parts[4];
            virtualRepo.remotes[name] = url;
            appendConsoleLine(`Remote origin registry established: ${url}`, "cmd-success");
        }
    } 
    else if (sub === 'push') {
        virtualRepo.pushed = true;
        appendConsoleLine("Counting objects: 100% (5/5), done.\nPush complete to remote origin.", "cmd-success");
    } 
    else if (sub === 'rebase') {
        appendConsoleLine("Successfully rebased current branch refs.", "cmd-success");
    } 
    else {
        appendConsoleLine("Unsupported instruction command.", "cmd-error");
    }

    // Step verification validation logic
    if (isMatching) {
        if (step.action) step.action(virtualRepo, cmd);
        showStepSuccess(step.successMsg || "Command correct!");
        setTimeout(() => {
            advanceWorkspaceStep();
        }, 1200);
    } else {
        stepAttempts++;
        appendConsoleLine("Warning: Command executed, but does not match checklist expectation.", "cmd-error");
        if (stepAttempts >= 5) {
            showStepHint();
        }
    }
}

// --- SUCCESS POPUPS ---
async function triggerChallengeSuccess() {
    document.getElementById('modal-reward-challenge-name').textContent = currentChallenge.title.toUpperCase();
    document.getElementById('modal-reward-xp-val').textContent = `+${currentChallenge.xp}`;

    let firstUnlock = false;
    if (!currentUser.badges.includes(currentChallenge.badge.name)) {
        currentUser.badges.push(currentChallenge.badge.name);
        firstUnlock = true;
    }

    currentUser.xp += currentChallenge.xp;
    currentUser.progress[currentChallenge.id.toString()] = 'completed';

    const newLvl = Math.floor(currentUser.xp / 200) + 1;
    if (newLvl > currentUser.level) {
        currentUser.level = newLvl;
        alert(`Congratulations! You leveled up to Level ${newLvl}!`);
    }

    // Show achievement section in reward overlay if newly unlocked
    const badgeSection = document.getElementById('modal-badge-award-section');
    if (firstUnlock) {
        document.getElementById('modal-badge-award-icon').textContent = currentChallenge.badge.icon;
        document.getElementById('modal-badge-award-name').textContent = currentChallenge.badge.name;
        badgeSection.classList.remove('hidden');
    } else {
        badgeSection.classList.add('hidden');
    }

    try {
        await fetch('/api/update-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                level: currentUser.level,
                xp: currentUser.xp,
                badges: currentUser.badges,
                progress: currentUser.progress
            })
        });
    } catch (e) {
        console.error("Failed to sync progress to database.");
    }

    document.getElementById('reward-overlay').classList.remove('hidden');
}

// --- GIT OS REFERENCE TAB DATA & CONTROLLER ---
const OS_COMMANDS = {
    windows: {
        name: "Windows",
        icon: "🪟",
        install: [
            "Download the Git for Windows installer from the official website: <a href='https://git-scm.com/download/win' target='_blank' style='color: var(--primary); text-decoration: underline;'>git-scm.com</a>.",
            "Run the <code>.exe</code> installation file and select default settings. Make sure 'Git Bash' is enabled.",
            "Open the <b>Git Bash</b> application (recommended) or use <b>PowerShell</b> / <b>Command Prompt</b>."
        ],
        commands: [
            { category: "Setup", cmd: "git config --global user.name \"Name\"", desc: "Configure global operator name identity." },
            { category: "Setup", cmd: "git config --global user.email \"email@domain.com\"", desc: "Configure global operator email contact." },
            { category: "Basics", cmd: "git init", desc: "Initialize a new Git repository database locally." },
            { category: "Basics", cmd: "git clone <url>", desc: "Clone a remote repository into a new subdirectory." },
            { category: "Basics", cmd: "git status", desc: "Show active file states (untracked, modified, staged)." },
            { category: "Basics", cmd: "git add <file>", desc: "Add a file to the staging conveyor belt (index)." },
            { category: "Basics", cmd: "git add .", desc: "Stage all modified and untracked files in directory." },
            { category: "Basics", cmd: "git commit -m \"message\"", desc: "Weld staged modifications permanently in version history." },
            { category: "Branching", cmd: "git branch", desc: "List all local development branches. The active branch has an asterisk." },
            { category: "Branching", cmd: "git branch <name>", desc: "Weld a new isolated branch under specified name." },
            { category: "Branching", cmd: "git checkout <branch>", desc: "Shift active engineering focus to the target branch." },
            { category: "Branching", cmd: "git checkout -b <branch>", desc: "Create a new branch and checkout onto it immediately." },
            { category: "Branching", cmd: "git merge <branch>", desc: "Integrate modifications from the target branch into active branch." },
            { category: "Collaboration", cmd: "git remote add origin <url>", desc: "Add a remote lab cloud repository reference coordinate." },
            { category: "Collaboration", cmd: "git push -u origin master", desc: "Upload master branch commits to central lab cloud registry." },
            { category: "Collaboration", cmd: "git push", desc: "Upload commits to active remote tracking branch." },
            { category: "Collaboration", cmd: "git pull", desc: "Download and automatically integrate remote branch upgrades." },
            { category: "Collaboration", cmd: "git fetch", desc: "Download remote repository branch updates without merging them." },
            { category: "Advanced", cmd: "git rebase <branch>", desc: "Re-align branch commits to run linear history on top of base." },
            { category: "Troubleshooting", cmd: "git log --oneline", desc: "Review clean compressed list of historical welds (commits)." },
            { category: "Troubleshooting", cmd: "git reset --hard HEAD~1", desc: "Discard all changes and reset back one commit (DANGER: destroys work)." }
        ]
    },
    macos: {
        name: "macOS",
        icon: "🍎",
        install: [
            "Option A: Open the macOS <b>Terminal</b> and type <code>git --version</code>. If not installed, macOS will prompt you to install Xcode Command Line Tools.",
            "Option B (Recommended): Install using <b>Homebrew</b>. Run <code>brew install git</code> in Terminal.",
            "Verify installation by typing <code>git --version</code>."
        ],
        commands: [
            { category: "Setup", cmd: "git config --global user.name \"Name\"", desc: "Configure global operator name identity." },
            { category: "Setup", cmd: "git config --global user.email \"email@domain.com\"", desc: "Configure global operator email contact." },
            { category: "Basics", cmd: "git init", desc: "Initialize a new Git repository database locally." },
            { category: "Basics", cmd: "git clone <url>", desc: "Clone a remote repository into a new subdirectory." },
            { category: "Basics", cmd: "git status", desc: "Show active file states (untracked, modified, staged)." },
            { category: "Basics", cmd: "git add <file>", desc: "Add a file to the staging conveyor belt (index)." },
            { category: "Basics", cmd: "git add .", desc: "Stage all modified and untracked files in directory." },
            { category: "Basics", cmd: "git commit -m \"message\"", desc: "Weld staged modifications permanently in version history." },
            { category: "Branching", cmd: "git branch", desc: "List all local development branches. The active branch has an asterisk." },
            { category: "Branching", cmd: "git branch <name>", desc: "Weld a new isolated branch under specified name." },
            { category: "Branching", cmd: "git checkout <branch>", desc: "Shift active engineering focus to the target branch." },
            { category: "Branching", cmd: "git checkout -b <branch>", desc: "Create a new branch and checkout onto it immediately." },
            { category: "Branching", cmd: "git merge <branch>", desc: "Integrate modifications from the target branch into active branch." },
            { category: "Collaboration", cmd: "git remote add origin <url>", desc: "Add a remote lab cloud repository reference coordinate." },
            { category: "Collaboration", cmd: "git push -u origin master", desc: "Upload master branch commits to central lab cloud registry." },
            { category: "Collaboration", cmd: "git push", desc: "Upload commits to active remote tracking branch." },
            { category: "Collaboration", cmd: "git pull", desc: "Download and automatically integrate remote branch upgrades." },
            { category: "Collaboration", cmd: "git fetch", desc: "Download remote repository branch updates without merging them." },
            { category: "Advanced", cmd: "git rebase <branch>", desc: "Re-align branch commits to run linear history on top of base." },
            { category: "Troubleshooting", cmd: "git log --oneline", desc: "Review clean compressed list of historical welds (commits)." },
            { category: "Troubleshooting", cmd: "git reset --hard HEAD~1", desc: "Discard all changes and reset back one commit (DANGER: destroys work)." }
        ]
    },
    linux: {
        name: "Linux",
        icon: "🐧",
        install: [
            "For <b>Debian/Ubuntu</b>: Run <code>sudo apt update && sudo apt install git</code> in Terminal.",
            "For <b>Fedora/RHEL</b>: Run <code>sudo dnf install git</code> in Terminal.",
            "For <b>Arch Linux</b>: Run <code>sudo pacman -S git</code> in Terminal."
        ],
        commands: [
            { category: "Setup", cmd: "git config --global user.name \"Name\"", desc: "Configure global operator name identity." },
            { category: "Setup", cmd: "git config --global user.email \"email@domain.com\"", desc: "Configure global operator email contact." },
            { category: "Basics", cmd: "git init", desc: "Initialize a new Git repository database locally." },
            { category: "Basics", cmd: "git clone <url>", desc: "Clone a remote repository into a new subdirectory." },
            { category: "Basics", cmd: "git status", desc: "Show active file states (untracked, modified, staged)." },
            { category: "Basics", cmd: "git add <file>", desc: "Add a file to the staging conveyor belt (index)." },
            { category: "Basics", cmd: "git add .", desc: "Stage all modified and untracked files in directory." },
            { category: "Basics", cmd: "git commit -m \"message\"", desc: "Weld staged modifications permanently in version history." },
            { category: "Branching", cmd: "git branch", desc: "List all local development branches. The active branch has an asterisk." },
            { category: "Branching", cmd: "git branch <name>", desc: "Weld a new isolated branch under specified name." },
            { category: "Branching", cmd: "git checkout <branch>", desc: "Shift active engineering focus to the target branch." },
            { category: "Branching", cmd: "git checkout -b <branch>", desc: "Create a new branch and checkout onto it immediately." },
            { category: "Branching", cmd: "git merge <branch>", desc: "Integrate modifications from the target branch into active branch." },
            { category: "Collaboration", cmd: "git remote add origin <url>", desc: "Add a remote lab cloud repository reference coordinate." },
            { category: "Collaboration", cmd: "git push -u origin master", desc: "Upload master branch commits to central lab cloud registry." },
            { category: "Collaboration", cmd: "git push", desc: "Upload commits to active remote tracking branch." },
            { category: "Collaboration", cmd: "git pull", desc: "Download and automatically integrate remote branch upgrades." },
            { category: "Collaboration", cmd: "git fetch", desc: "Download remote repository branch updates without merging them." },
            { category: "Advanced", cmd: "git rebase <branch>", desc: "Re-align branch commits to run linear history on top of base." },
            { category: "Troubleshooting", cmd: "git log --oneline", desc: "Review clean compressed list of historical welds (commits)." },
            { category: "Troubleshooting", cmd: "git reset --hard HEAD~1", desc: "Discard all changes and reset back one commit (DANGER: destroys work)." }
        ]
    },
    cheatcodes: {
        name: "Git Cheatcodes",
        icon: "📋",
        install: [
            "Click on any command or copy button to instantly copy it to your clipboard.",
            "Use the search input above to instantly filter through all 60 daily and advanced Git commands."
        ],
        commands: [
    {
        "category": "Repository Setup & Configuration",
        "cmd": "git init",
        "desc": "Initialize a new Git repository in the current directory (Examples: git init, git init my-project)"
    },
    {
        "category": "Repository Setup & Configuration",
        "cmd": "git clone",
        "desc": "Create a local copy of a remote repository (Examples: git clone https://github.com/user/repo.git, git clone git@github.com:user/repo.git)"
    },
    {
        "category": "Repository Setup & Configuration",
        "cmd": "git config",
        "desc": "Set configuration options for Git (Examples: git config --global user.name \"Your Name\", git config --global user.email \"your.email@example.com\", git config --list)"
    },
    {
        "category": "Basic Commands",
        "cmd": "git status",
        "desc": "Show the working tree status (Examples: git status, git status -s)"
    },
    {
        "category": "Basic Commands",
        "cmd": "git add",
        "desc": "Add file contents to the staging area (Examples: git add filename.txt, git add ., git add -A)"
    },
    {
        "category": "Basic Commands",
        "cmd": "git commit",
        "desc": "Record changes to the repository (Examples: git commit -m \"Commit message\", git commit -am \"Add and commit\")"
    },
    {
        "category": "Basic Commands",
        "cmd": "git log",
        "desc": "Show commit history (Examples: git log, git log --oneline, git log --graph)"
    },
    {
        "category": "Basic Commands",
        "cmd": "git diff",
        "desc": "Show changes between commits, commit and working tree, etc (Examples: git diff, git diff --staged, git diff HEAD~1)"
    },
    {
        "category": "Branching & Merging",
        "cmd": "git branch",
        "desc": "List, create, or delete branches (Examples: git branch, git branch loginpage, git branch -d old-branch)"
    },
    {
        "category": "Branching & Merging",
        "cmd": "git checkout",
        "desc": "Switch branches or restore working tree files (Examples: git checkout main, git checkout -b new-branch, git checkout -- filename)"
    },
    {
        "category": "Branching & Merging",
        "cmd": "git switch",
        "desc": "Switch to a different branch (Examples: git switch main, git switch -c new-branch)"
    },
    {
        "category": "Branching & Merging",
        "cmd": "git merge",
        "desc": "Join two or more development histories together (Examples: git merge loginpage, git merge --no-ff loginpage)"
    },
    {
        "category": "Branching & Merging",
        "cmd": "git rebase",
        "desc": "Reapply commits on top of another base tip (Examples: git rebase main, git rebase -i HEAD~3)"
    },
    {
        "category": "Remote Repositories",
        "cmd": "git remote",
        "desc": "Manage set of tracked repositories (Examples: git remote -v, git remote add origin url, git remote remove origin)"
    },
    {
        "category": "Remote Repositories",
        "cmd": "git fetch",
        "desc": "Download objects and refs from another repository (Examples: git fetch, git fetch origin, git fetch --all)"
    },
    {
        "category": "Remote Repositories",
        "cmd": "git pull",
        "desc": "Fetch from and integrate with another repository or local branch (Examples: git pull, git pull origin main, git pull --rebase)"
    },
    {
        "category": "Remote Repositories",
        "cmd": "git push",
        "desc": "Update remote refs along with associated objects (Examples: git push, git push origin main, git push -u origin loginpage)"
    },
    {
        "category": "Inspection & Comparison",
        "cmd": "git show",
        "desc": "Show various types of objects (commits, tags, etc.) (Examples: git show, git show HEAD, git show commit-hash)"
    },
    {
        "category": "Inspection & Comparison",
        "cmd": "git blame",
        "desc": "Show what revision and author last modified each line of a file (Examples: git blame filename.txt, git blame -L 10,20 filename.txt)"
    },
    {
        "category": "Inspection & Comparison",
        "cmd": "git log (Formatting)",
        "desc": "Show commit logs with various formatting options (Examples: git log --graph --all, git log --author=\"Name\", git log --since=\"2 weeks ago\")"
    },
    {
        "category": "Undoing Changes",
        "cmd": "git reset",
        "desc": "Reset current HEAD to the specified state (Examples: git reset HEAD~1, git reset --hard origin/main, git reset --soft HEAD~1)"
    },
    {
        "category": "Undoing Changes",
        "cmd": "git revert",
        "desc": "Create new commit that undoes changes from previous commits (Examples: git revert HEAD, git revert commit-hash, git revert HEAD~3..HEAD)"
    },
    {
        "category": "Undoing Changes",
        "cmd": "git clean",
        "desc": "Remove untracked files from the working tree (Examples: git clean -f, git clean -fd, git clean -n)"
    },
    {
        "category": "Stashing",
        "cmd": "git stash",
        "desc": "Temporarily save changes in a dirty working directory (Examples: git stash, git stash save \"message\", git stash -u)"
    },
    {
        "category": "Stashing",
        "cmd": "git stash pop",
        "desc": "Apply stashed changes and remove them from stash (Examples: git stash pop, git stash pop stash@{2})"
    },
    {
        "category": "Stashing",
        "cmd": "git stash list",
        "desc": "List all stashes (Examples: git stash list)"
    },
    {
        "category": "Stashing",
        "cmd": "git stash apply",
        "desc": "Apply stashed changes without removing them from stash (Examples: git stash apply, git stash apply stash@{1})"
    },
    {
        "category": "Advanced Operations",
        "cmd": "git cherry-pick",
        "desc": "Apply the changes introduced by some existing commits (Examples: git cherry-pick commit-hash, git cherry-pick branch-name)"
    },
    {
        "category": "Advanced Operations",
        "cmd": "git reflog",
        "desc": "Show a log of where your HEAD and branch references have been (Examples: git reflog, git reflog show main)"
    },
    {
        "category": "Advanced Operations",
        "cmd": "git bisect",
        "desc": "Use binary search to find the commit that introduced a bug (Examples: git bisect start, git bisect bad, git bisect good commit-hash)"
    },
    {
        "category": "Advanced Operations",
        "cmd": "git tag",
        "desc": "Create, list, delete or verify tags (Examples: git tag, git tag v1.0, git tag -a v1.0 -m \"Version 1.0\")"
    },
    {
        "category": "File Management",
        "cmd": "git rm",
        "desc": "Remove files from the working tree and from the index (Examples: git rm filename, git rm --cached filename, git rm -r directory/)"
    },
    {
        "category": "File Management",
        "cmd": "git mv",
        "desc": "Move or rename a file, directory, or symlink (Examples: git mv oldname newname, git mv file.txt directory/)"
    },
    {
        "category": "Modern Alternatives",
        "cmd": "git restore",
        "desc": "Restore working tree files (Examples: git restore filename, git restore --staged filename)"
    },
    {
        "category": "Modern Alternatives",
        "cmd": "git switch",
        "desc": "Switch to a different branch (Examples: git switch main, git switch -c loginpage)"
    },
    {
        "category": "Submodules & Worktrees",
        "cmd": "git submodule",
        "desc": "Initialize, update or inspect submodules (Examples: git submodule add url, git submodule update --init)"
    },
    {
        "category": "Submodules & Worktrees",
        "cmd": "git worktree",
        "desc": "Manage multiple working trees (Examples: git worktree add ../path branch, git worktree list)"
    },
    {
        "category": "Submodules & Worktrees",
        "cmd": "git sparse-checkout",
        "desc": "Reduce working tree to a subset of directories (Examples: git sparse-checkout init, git sparse-checkout set dir/)"
    },
    {
        "category": "Collaboration & Patching",
        "cmd": "git format-patch",
        "desc": "Prepare patches for e-mail submission (Examples: git format-patch main, git format-patch -1 HEAD)"
    },
    {
        "category": "Collaboration & Patching",
        "cmd": "git am",
        "desc": "Apply a series of patches from a mailbox (Examples: git am patch-file.patch, git am --continue)"
    },
    {
        "category": "Collaboration & Patching",
        "cmd": "git shortlog",
        "desc": "Summarize git log output (Examples: git shortlog, git shortlog -sn)"
    },
    {
        "category": "Internal Inspection",
        "cmd": "git grep",
        "desc": "Print lines matching a pattern (Examples: git grep \"search-term\", git grep -n \"term\")"
    },
    {
        "category": "Internal Inspection",
        "cmd": "git describe",
        "desc": "Give an object a human readable name based on an available ref (Examples: git describe, git describe --tags)"
    },
    {
        "category": "Internal Inspection",
        "cmd": "git rev-parse",
        "desc": "Pick out and massage parameters (Examples: git rev-parse --show-toplevel, git rev-parse HEAD)"
    },
    {
        "category": "Advanced Utility",
        "cmd": "git archive",
        "desc": "Create an archive of files from a named tree (Examples: git archive --format=zip HEAD > project.zip)"
    },
    {
        "category": "Advanced Utility",
        "cmd": "git instaweb",
        "desc": "Instantly browse your working repository in gitweb (Examples: git instaweb, git instaweb --stop)"
    },
    {
        "category": "Advanced Utility",
        "cmd": "git notes",
        "desc": "Add or inspect object notes (Examples: git notes add -m \"Comment\", git notes show)"
    },
    {
        "category": "Deep Maintenance",
        "cmd": "git maintenance",
        "desc": "Run tasks to keep repository optimized (Examples: git maintenance start, git maintenance run)"
    },
    {
        "category": "Deep Maintenance",
        "cmd": "git prune",
        "desc": "Prune all unreachable objects from the object database (Examples: git prune, git prune --dry-run)"
    },
    {
        "category": "Deep Maintenance",
        "cmd": "git count-objects",
        "desc": "Count unpacked number of objects and their disk consumption (Examples: git count-objects -v)"
    },
    {
        "category": "Daily GitHub Workflows",
        "cmd": "git clone https://github.com/user/repo.git",
        "desc": "Clone a GitHub repository locally (Equivalent to downloading the codebase)."
    },
    {
        "category": "Daily GitHub Workflows",
        "cmd": "git remote add upstream https://github.com/original/repo.git",
        "desc": "Set the upstream repository coordinate to pull changes from the original repository in forks."
    },
    {
        "category": "Daily GitHub Workflows",
        "cmd": "git fetch upstream",
        "desc": "Download all branches and updates from the upstream GitHub repo without merging them."
    },
    {
        "category": "Daily GitHub Workflows",
        "cmd": "git merge upstream/main",
        "desc": "Merge the latest upstream main branch upgrades into your local active branch to keep it synced."
    },
    {
        "category": "Daily GitHub Workflows",
        "cmd": "git push -u origin feature-branch",
        "desc": "Push a new local feature branch to your GitHub fork and set tracking to open a Pull Request."
    },
    {
        "category": "Daily GitHub Workflows",
        "cmd": "git pull upstream main",
        "desc": "Download and merge upstream changes from the original repository directly into your local branch."
    },
    {
        "category": "Daily GitHub Workflows",
        "cmd": "git push origin --delete feature-branch",
        "desc": "Delete a branch on the remote GitHub repository after its Pull Request has been merged."
    },
    {
        "category": "Daily GitHub Workflows",
        "cmd": "git remote -v",
        "desc": "Verify all linked remote connections (fetch & push URLs) for your GitHub repository."
    },
    {
        "category": "Daily GitHub Workflows",
        "cmd": "git commit --amend -m \"updated message\"",
        "desc": "Modify the most recent local commit message before pushing to GitHub."
    },
    {
        "category": "Daily GitHub Workflows",
        "cmd": "git cherry-pick <commit-hash>",
        "desc": "Apply a specific commit from another developer's branch or fork directly onto your current branch."
    }
]
    }
};

let activeOS = 'windows';

function showReferenceScreen() {
    showScreen('reference-screen');
    document.getElementById('ref-search-input').value = '';
    renderOSReference(activeOS);
}

function switchOSReference(os) {
    activeOS = os;
    document.querySelectorAll('.os-toggle-btn').forEach(btn => {
        if (btn.id === `btn-os-${os}`) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderOSReference(os);
}

function renderOSReference(os) {
    const container = document.getElementById('reference-os-details');
    const osData = OS_COMMANDS[os];
    const searchVal = document.getElementById('ref-search-input').value.trim().toLowerCase();

    // Build installation steps
    let installHTML = '';
    osData.install.forEach((step, idx) => {
        installHTML += `
            <div class="os-step-item">
                <div class="os-step-num">${idx + 1}</div>
                <div class="os-step-text">${step}</div>
            </div>
        `;
    });

    // Filter commands based on search
    const filtered = osData.commands.filter(c => 
        c.cmd.toLowerCase().includes(searchVal) || 
        c.desc.toLowerCase().includes(searchVal) || 
        c.category.toLowerCase().includes(searchVal)
    );

    // Build table rows
    let tableRowsHTML = '';
    if (filtered.length > 0) {
        filtered.forEach((c, idx) => {
            tableRowsHTML += `
                <tr>
                    <td><span class="xp-bounty">${c.category}</span></td>
                    <td><code class="copyable-cmd">${c.cmd}</code></td>
                    <td><span class="cmd-desc">${c.desc}</span></td>
                    <td>
                        <button class="btn-copy-cmd" onclick="copyCommandText(this, '${c.cmd.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')">
                            📋 Copy
                        </button>
                    </td>
                </tr>
            `;
        });
    } else {
        tableRowsHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                    No matching Git commands found for "${searchVal}"
                </td>
            </tr>
        `;
    }

    container.innerHTML = `
        <div class="os-install-box">
            <h3>${osData.icon} Tips & Installing Git on ${osData.name}</h3>
            <div class="os-install-steps">
                ${installHTML}
            </div>
        </div>

        <div class="commands-table-container">
            <table class="commands-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Command</th>
                        <th>Description</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHTML}
                </tbody>
            </table>
        </div>
    `;
}

function filterReferenceCommands() {
    renderOSReference(activeOS);
}

function copyCommandText(element, text) {
    const isButton = element && element.tagName === 'BUTTON';
    
    function showSuccessFeedback() {
        if (isButton) {
            const originalText = element.innerHTML;
            element.textContent = "✓ Copied";
            element.classList.add('copied');
            setTimeout(() => {
                element.innerHTML = originalText;
                element.classList.remove('copied');
            }, 2000);
        } else if (element) {
            const oldTooltip = element.querySelector('.copy-tooltip');
            if (oldTooltip) oldTooltip.remove();
            
            const tooltip = document.createElement('span');
            tooltip.className = 'copy-tooltip';
            tooltip.textContent = '✓ Copied!';
            element.appendChild(tooltip);
            
            setTimeout(() => {
                tooltip.remove();
            }, 1500);
        }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showSuccessFeedback();
        }).catch(err => {
            fallbackCopy(element, text, showSuccessFeedback);
        });
    } else {
        fallbackCopy(element, text, showSuccessFeedback);
    }
}

function fallbackCopy(element, text, callback) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            callback();
        } else {
            console.error('Fallback copy command failed');
        }
    } catch (err) {
        console.error('Fallback copy error: ', err);
    }
    document.body.removeChild(textArea);
}

function bindGlobalCommandCopyHandlers() {
    document.addEventListener('click', (e) => {
        const codeElement = e.target.closest('code.copyable-cmd, .topic-cheat-card code');
        if (codeElement && !e.target.closest('button.btn-copy-cmd')) {
            let text = codeElement.textContent.trim();
            if (text.startsWith('$ ')) {
                text = text.slice(2);
            }
            copyCommandText(codeElement, text);
        }
    });
}
