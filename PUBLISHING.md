# Publishing checklist — @qbistlab/mcp-server

The server is fully built and tested locally. The three publishing steps
below require **human credentials** (npm login, GitHub auth, Smithery web
form) and cannot be performed autonomously by an agent on this machine.

## 1. npm publish

The agent does not have npm credentials. To publish:

```bash
cd /home/pudding/qbistlab-mcp
npm login                       # prompts for OTP / 2FA
npm publish --access public     # @qbistlab is a scoped package
```

Verify:
```bash
npm view @qbistlab/mcp-server
```

A pre-built tarball is already in this directory:
`qbistlab-mcp-server-0.1.0.tgz` (also runnable via `npm publish ./qbistlab-mcp-server-0.1.0.tgz`).

## 2. GitHub repo + PR to modelcontextprotocol/servers

Push this directory to `github.com/qbistlab/qbistlab-mcp` (already
configured in package.json `repository`):

```bash
cd /home/pudding/qbistlab-mcp
gh repo create qbistlab/qbistlab-mcp --public --source=. --remote=origin --push
```

Then submit a PR to the registry:

```bash
gh repo fork modelcontextprotocol/servers --clone=true
cd servers
# Add an entry under the community / third-party section per their
# CONTRIBUTING.md (link to https://github.com/qbistlab/qbistlab-mcp).
git checkout -b add-qbistlab-mcp
# edit README.md / src/.../catalog.json depending on registry layout
git commit -am "Add @qbistlab/mcp-server (QBist Lab working papers)"
gh pr create --title "Add @qbistlab/mcp-server" --body "..."
```

## 3. Smithery submission

Smithery's submission flow is a web form. Open
<https://smithery.ai/submit> in a browser and submit:

- Server name: `qbistlab`
- Display name: QBist Lab Working Papers
- Description: see `smithery.yaml` `description`
- npm package: `@qbistlab/mcp-server`
- GitHub repo: `https://github.com/qbistlab/qbistlab-mcp`
- Category: agent-commerce / scholarly-articles
- Icon URL: <https://qbistlab.com/images/qbistlab-icon.png>

The `smithery.yaml` in this directory mirrors the form fields for fast
copy-paste. After submission, verify by searching `qbistlab` on
<https://smithery.ai/search>.

## Verification commands once published

```bash
# 1. npm
npm view @qbistlab/mcp-server

# 2. Smithery
curl -s "https://smithery.ai/api/search?q=qbistlab" | head

# 3. End-to-end
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  | npx -y @qbistlab/mcp-server | jq .
```
