# Publishing checklist — @qbistlab/mcp-server

The server is fully built, tested locally, and the source repo is now
**published to GitHub** at <https://github.com/steven2030/qbistlab-mcp>
(public, MIT). The remaining publishing steps require **human credentials**
(npm OTP/2FA, Smithery web form, MCP Registry GitHub OAuth) and cannot be
performed autonomously by an agent on this machine.

---

## 1. npm publish — REQUIRES STEVEN

The agent does not have npm credentials. To publish:

```bash
cd /home/pudding/qbistlab-mcp
npm login                       # prompts for OTP / 2FA — interactive
npm publish --access public     # @qbistlab is a scoped package
```

If the `@qbistlab` scope is not yet registered on npm under Steven's
account, create it first at <https://www.npmjs.com/org/create>.

Verify:
```bash
npm view @qbistlab/mcp-server
```

A pre-built tarball is already in this directory:
`qbistlab-mcp-server-0.1.0.tgz` (also runnable via `npm publish ./qbistlab-mcp-server-0.1.0.tgz`).

---

## 2. GitHub repo — DONE

Repo is live: <https://github.com/steven2030/qbistlab-mcp>

```bash
gh repo view steven2030/qbistlab-mcp
```

`package.json` `repository.url` already points to this URL.

---

## 3. MCP Registry submission — REPLACES the old "PR to modelcontextprotocol/servers"

Per `modelcontextprotocol/servers/CONTRIBUTING.md` (read 2026-04-27), the
README listing of third-party servers has been **retired**. New servers
should be published to the [MCP Server Registry](https://github.com/modelcontextprotocol/registry)
instead.

Steps (per <https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx>):

1. **Pre-req**: complete step (1) above so the npm package exists.
2. `mcpName` is already added to `package.json` as `io.github.steven2030/qbistlab-mcp`
   (matches GitHub OAuth namespace).
3. Install the publisher CLI: `brew install mcp-publisher` or download the binary.
4. Authenticate via GitHub OAuth: `mcp-publisher login github`.
5. Create `server.json` (template in registry repo) and publish:
   ```bash
   mcp-publisher publish
   ```
6. Verify at <https://registry.modelcontextprotocol.io/> by searching `qbistlab`.

---

## 4. Smithery submission — REQUIRES STEVEN (web form)

Smithery's submission flow is a web form. Open
<https://smithery.ai/submit> in a browser and submit:

- Server name: `qbistlab`
- Display name: QBist Lab Working Papers
- Description: see `smithery.yaml` `description`
- npm package: `@qbistlab/mcp-server`
- GitHub repo: `https://github.com/steven2030/qbistlab-mcp`
- Category: agent-commerce / scholarly-articles
- Icon URL: <https://qbistlab.com/images/qbistlab-icon.png>

The `smithery.yaml` in this directory mirrors the form fields for fast
copy-paste. After submission, verify by searching `qbistlab` on
<https://smithery.ai/search>.

---

## Verification commands once published

```bash
# 1. npm
npm view @qbistlab/mcp-server

# 2. MCP Registry
curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=qbistlab" | jq .

# 3. Smithery
curl -s "https://smithery.ai/api/search?q=qbistlab" | head

# 4. End-to-end
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  | npx -y @qbistlab/mcp-server | jq .
```
