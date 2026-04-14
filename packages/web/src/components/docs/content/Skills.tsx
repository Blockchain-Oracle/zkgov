import { CodeBlock, Callout } from '../CodeBlock';

export function SkillsContent() {
  return (
    <>
      <p className="lead">
        ZKGov ships as an <strong>agent skill</strong> — a procedural instruction file that teaches
        any AI agent when and how to use ZKGov tools. Skills work with Claude Code, Cursor,
        Windsurf, Codex, Gemini CLI, GitHub Copilot, and 12+ other agent platforms.
      </p>

      <h2>What is a skill</h2>
      <p>
        A skill is a <code>SKILL.md</code> file with YAML frontmatter and markdown instructions.
        It tells the agent:
      </p>
      <ul>
        <li><strong>When to activate</strong> — trigger keywords like "governance", "voting", "ZKGov", "proposals"</li>
        <li><strong>Which tools to use</strong> — the 11 MCP tools or CLI commands</li>
        <li><strong>How to handle responses</strong> — workflow steps, error handling, wallet management</li>
        <li><strong>What NOT to do</strong> — avoid triggering on general blockchain questions</li>
      </ul>

      <Callout type="info" title="Skill vs MCP server">
        The MCP server gives the agent the <em>ability</em> to call contract functions.
        The skill gives the agent the <em>judgment</em> to know when and how to use them.
        Install both for the best experience.
      </Callout>

      <h2>Install via the community skills CLI</h2>
      <p>
        The <a href="https://github.com/vercel-labs/skills">skills CLI</a> (maintained by Vercel Labs)
        handles installation across all supported agent platforms automatically:
      </p>

      <CodeBlock
        language="bash"
        filename="terminal"
        code={`# Install the ZKGov skill from GitHub
pnpm dlx skills add github:Blockchain-Oracle/zkgov --skill zkgov

# List installed skills
pnpm dlx skills list

# Update to latest version
pnpm dlx skills update zkgov`}
      />

      <p>
        This downloads the <code>SKILL.md</code> from the ZKGov repo, creates symlinks
        in your agent directories, and records the installation in <code>skills-lock.json</code>.
      </p>

      <h2>Install manually</h2>
      <p>
        If you prefer not to use the skills CLI, copy the file directly:
      </p>

      <CodeBlock
        language="bash"
        filename="terminal"
        code={`# For Claude Code
mkdir -p ~/.claude/skills/zkgov
cp packages/skills/zkgov/SKILL.md ~/.claude/skills/zkgov/SKILL.md

# For universal agents (Cursor, Windsurf, Codex, etc.)
mkdir -p .agents/skills/zkgov
cp packages/skills/zkgov/SKILL.md .agents/skills/zkgov/SKILL.md`}
      />

      <h2>What the skill contains</h2>
      <p>
        The <code>SKILL.md</code> file has these sections:
      </p>

      <ul>
        <li><strong>YAML frontmatter</strong> — name, description, trigger keywords for auto-invocation</li>
        <li><strong>Mode priority</strong> — MCP tools first, CLI fallback</li>
        <li><strong>Tool catalog</strong> — all 11 tools with MCP name, CLI equivalent, and description</li>
        <li><strong>Wallet management</strong> — how the agent's wallet is created and funded</li>
        <li><strong>Workflow</strong> — step-by-step: stats → register → vote → finalize</li>
        <li><strong>Error handling</strong> — what to do for common errors (already voted, insufficient balance, etc.)</li>
      </ul>

      <CodeBlock
        language="yaml"
        filename="SKILL.md (frontmatter)"
        code={`---
name: zkgov
description: Anonymous governance on HashKey Chain using
  zero-knowledge proofs. Query proposals, check voter status,
  register, create proposals, vote anonymously with ZK proofs,
  and finalize outcomes.
---`}
      />

      <h2>How agents discover skills</h2>
      <p>
        When an agent starts a session, it reads all installed <code>SKILL.md</code> files.
        Based on the <code>description</code> field and the conversation context, it decides
        whether to activate the skill. For example, if you say "check the latest governance
        proposals", the agent matches keywords like "governance" and "proposals" and starts
        using the ZKGov tools.
      </p>

      <Callout type="tip" title="Works everywhere">
        The same <code>SKILL.md</code> file works across 12+ agent platforms. The skills CLI
        handles the differences — some agents use <code>.claude/skills/</code>, others use
        <code>.agents/skills/</code>, and the CLI creates the right symlinks for each.
      </Callout>

      <h2>Combine with MCP server</h2>
      <p>
        For the full setup, install both the MCP server and the skill:
      </p>

      <CodeBlock
        language="bash"
        filename="terminal"
        code={`# 1. Add MCP server (gives tools)
claude mcp add zkgov npx @zkgov/mcp

# 2. Add skill (teaches when to use them)
pnpm dlx skills add github:Blockchain-Oracle/zkgov --skill zkgov`}
      />

      <p>
        Now your agent can autonomously monitor proposals, evaluate them against your
        guidelines, and vote — all with ZK-verified privacy.
      </p>
    </>
  );
}
