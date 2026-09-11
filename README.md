# Ask Until Sure

This is a multi-source research agent where each data source is an x402-gated paid endpoint. An orchestrating agent starts with a low-confidence guess, selectively pays for the sources whose expected confidence gain exceeds their price, and stops when confidence crosses a threshold or a budget cap is hit. The demo centerpiece is a live confidence meter + receipt log in the browser dashboard.

## Start Here

Install dependencies, configure your environment, and start the development server:

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Fill in `.env`:

```env
ALGORAND_NETWORK=testnet
PAY_TO_ADDRESS=YOUR_RECEIVER_TESTNET_ADDRESS
CLIENT_MNEMONIC="your disposable payer wallet 25-word mnemonic"
DEMO_MODE=true
CONFIDENCE_THRESHOLD=85
BUDGET_CAP_USD=1.00
```

Open `http://localhost:3000` to run the visual demo.

## Paid Endpoints

- `GET /api/research/regulatory` -> $0.10
- `GET /api/research/caselaw` -> $0.15
- `GET /api/research/specialist` -> $0.20

## Included Tools

```bash
pnpm build
pnpm test
pnpm smoke
pnpm simulate
pnpm client:agent
```

## Folder Map

```text
.
├── AGENTS.md
├── skills.md
├── PROJECT_BRIEF.md
├── client/
├── docs/resources/
├── scripts/
├── src/
└── test/
```

## Safety

- Do not commit `.env`.
- Do not log mnemonics.
- Use disposable TestNet wallets locally.
- Keep payer and receiver as different accounts.
- Keep `DEMO_MODE=false` outside local TestNet demos.
- Reject invalid input before payment middleware.
