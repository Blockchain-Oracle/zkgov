import { CodeBlock, Callout } from '../CodeBlock';

export function CliContent() {
  return (
    <>
      <p className="lead">
        The <code>zkgov</code> CLI is a single binary that can query contract state,
        register as a voter, create proposals, and cast ZK-verified votes — all from your
        terminal. It shares its core logic with the MCP server.
      </p>

      <h2>Install</h2>
      <CodeBlock
        language="bash"
        filename="terminal"
        code={`npm install -g @zkgov/cli`}
      />

      <p>
        That's it. The <code>zkgov</code> command is now available globally:
      </p>

      <CodeBlock
        language="bash"
        filename="terminal"
        code={`zkgov --help`}
      />

      <h2>Read commands</h2>
      <p>These do not require a wallet and are safe to run anywhere.</p>

      <CodeBlock
        language="bash"
        filename="terminal"
        code={`zkgov stats                            # platform stats
zkgov proposals                        # list all proposals
zkgov proposal 4                       # full detail of proposal #4
zkgov voter 0x1234...                  # check voter registration
zkgov members                          # group Merkle root + size
zkgov activity --limit 10              # recent on-chain events`}
      />

      <h2>Write commands</h2>
      <p>
        These sign and broadcast transactions. On first use, the CLI auto-generates a wallet
        at <code>~/.zkgov/config.json</code> with mode <code>0o600</code>. Fund it with a
        tiny bit of testnet HSK, then:
      </p>

      <CodeBlock
        language="bash"
        filename="terminal"
        code={`zkgov wallet                           # show address + balance + registration
zkgov register                         # register as voter on-chain
zkgov create "Title" \\                 # create proposal
  --description "Body text" \\
  --period 86400 \\
  --quorum 3
zkgov vote 4 for                       # cast ZK vote (for/against/abstain)
zkgov finalize 4                       # finalize proposal after period ends`}
      />

      <Callout type="info" title="Bring your own key">
        Override the stored wallet with an env var: <code>ZKGOV_PRIVATE_KEY=0x... zkgov vote 4 for</code>.
        Useful for CI, automation, or when you already manage keys elsewhere.
      </Callout>

      <h2>Machine output</h2>
      <p>
        Every command supports <code>--json</code> for scripting. The output is a raw JSON
        payload with no ANSI colors, no prompts, and stable keys across versions.
      </p>

      <CodeBlock
        language="bash"
        filename="terminal"
        code={`zkgov proposals --json | jq '.[] | select(.status == "active") | .id'`}
      />

      <h2>What happens under the hood for a vote</h2>
      <ol>
        <li>Loads your wallet + derives Semaphore identity from the private key.</li>
        <li>Fetches all group members via <code>eth_getLogs</code>.</li>
        <li>Builds a Merkle tree in memory.</li>
        <li>Generates a Groth16 proof using snarkjs (~3–5s).</li>
        <li>Calls <code>castVote</code> on the contract, signs, broadcasts.</li>
        <li>Waits for the receipt and prints the tx hash + explorer URL.</li>
      </ol>

      <Callout type="tip" title="Same wallet everywhere">
        Because the Semaphore identity is deterministic from the private key, your CLI wallet
        and its identity match if you import the same key into the web app. Votes cast from
        either interface count the same.
      </Callout>
    </>
  );
}
