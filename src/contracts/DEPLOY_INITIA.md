# Tienda -- Initia Deployment Guide

Complete guide to deploying Tienda as a Minitia (Initia L2 rollup), integrating InterwovenKit, and leveraging Initia-native features.

---

## Table of Contents

1. [Deploy a Minitia (Initia L2 Rollup)](#1-deploy-a-minitia-initia-l2-rollup)
2. [InterwovenKit Integration](#2-interwovenkit-integration)
3. [Auto-Signing Sessions](#3-auto-signing-sessions)
4. [Interwoven Bridge](#4-interwoven-bridge)
5. [Initia Usernames (.init)](#5-initia-usernames-init)
6. [CLI Commands Reference](#6-cli-commands-reference)

---

## 1. Deploy a Minitia (Initia L2 Rollup)

### Prerequisites

```bash
# Install Initia CLI (initiad)
curl -sSL https://raw.githubusercontent.com/initia-labs/initia/main/scripts/install.sh | bash

# Verify installation
initiad version

# Install opinitd (the rollup operator daemon)
go install github.com/initia-labs/opinit-bots/cmd/opinitd@latest
```

### Step 1: Generate Operator Keys

```bash
# Create the operator key (this signs L1 submissions)
initiad keys add tienda-operator --keyring-backend test

# Create the challenger key (for fraud proofs)
initiad keys add tienda-challenger --keyring-backend test

# Fund both accounts on Initia L1 testnet
# Use the faucet: https://faucet.testnet.initia.xyz/
```

### Step 2: Configure Minitia Genesis

Create `minitia-config.json`:

```json
{
  "chain_id": "tienda-1",
  "moniker": "tienda-rollup",
  "vm_type": "move",
  "l1_chain_id": "initiation-2",
  "submission_interval": "3600s",
  "finalization_period": "604800s",
  "batch_submitter": "<tienda-operator-address>",
  "challenger": "<tienda-challenger-address>",
  "metadata": {
    "name": "Tienda",
    "description": "Commerce rollup for LATAM merchants",
    "website": "https://github.com/xpandia/tienda"
  }
}
```

### Step 3: Initialize the Minitia

```bash
# Initialize the rollup node
minitiad init tienda-rollup --chain-id tienda-1

# Copy the marketplace.move module into the genesis modules directory
cp src/contracts/marketplace.move ~/.minitia/config/genesis_modules/

# Configure the genesis state
minitiad genesis add-account <operator-address> 1000000000umin

# Set the L1 bridge configuration
minitiad genesis set-bridge-info \
  --l1-chain-id initiation-2 \
  --l1-client-id 07-tendermint-0 \
  --bridge-id 1
```

### Step 4: Register on Initia L1

```bash
# Register the Minitia on the L1 (requires L1 gas)
initiad tx ophost create-bridge \
  --chain-id initiation-2 \
  --from tienda-operator \
  --l2-chain-id tienda-1 \
  --challenger <challenger-address> \
  --proposer <operator-address> \
  --submission-interval 3600s \
  --finalization-period 604800s \
  --node https://rpc.testnet.initia.xyz:443 \
  --gas auto \
  --gas-adjustment 1.5 \
  --fees 10000uinit
```

### Step 5: Start the Rollup

```bash
# Start the minitia node
minitiad start --log_level info

# In a separate terminal, start the batch submitter
opinitd start \
  --l1-rpc https://rpc.testnet.initia.xyz:443 \
  --l2-rpc http://localhost:26657 \
  --bridge-id 1
```

### Step 6: Deploy the Move Module

```bash
# Compile the marketplace module
aptos move compile --package-dir src/contracts/

# Publish to the Minitia
minitiad tx move publish \
  --move-module-path src/contracts/build/marketplace/bytecode_modules/marketplace.mv \
  --from tienda-operator \
  --chain-id tienda-1 \
  --gas auto \
  --gas-adjustment 1.5
```

---

## 2. InterwovenKit Integration

InterwovenKit (`@initia/interwovenkit-react`) provides wallet connection, transaction signing, and cross-chain bridging as React components.

### Installation

```bash
npm install @initia/interwovenkit-react @initia/initia.js
```

### Provider Setup

Wrap your application with the InterwovenKit provider:

```tsx
import {
  InterwovenKitProvider,
  ChainProvider,
  WalletProvider,
} from '@initia/interwovenkit-react';

const TIENDA_CHAIN = {
  chainId: 'tienda-1',
  chainName: 'Tienda',
  rpc: 'https://rpc.tienda.initia.xyz',
  rest: 'https://lcd.tienda.initia.xyz',
  bech32Prefix: 'init',
  currencies: [
    {
      coinDenom: 'INIT',
      coinMinimalDenom: 'uinit',
      coinDecimals: 6,
    },
  ],
};

function App() {
  return (
    <InterwovenKitProvider>
      <ChainProvider chains={[TIENDA_CHAIN]}>
        <WalletProvider>
          <TiendaApp />
        </WalletProvider>
      </ChainProvider>
    </InterwovenKitProvider>
  );
}
```

### Wallet Connection

```tsx
import { useWallet, ConnectButton } from '@initia/interwovenkit-react';

function NavBar() {
  const { address, isConnected, disconnect } = useWallet();

  return (
    <nav>
      {isConnected ? (
        <div>
          <span>Connected: {address}</span>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <ConnectButton />
      )}
    </nav>
  );
}
```

### Sending Transactions (e.g., Place an Order)

```tsx
import { useWallet, useSignAndBroadcast } from '@initia/interwovenkit-react';
import { MsgExecute } from '@initia/initia.js';

function BuyButton({ productId, price }) {
  const { address } = useWallet();
  const { signAndBroadcast, isLoading } = useSignAndBroadcast();

  const handleBuy = async () => {
    const msg = new MsgExecute(
      address,
      MARKETPLACE_MODULE_ADDR,
      'marketplace',
      'create_order',
      [],
      [productId, '1'] // product_id, quantity
    );

    const result = await signAndBroadcast({
      msgs: [msg],
      memo: 'Tienda order',
    });

    console.log('Order tx:', result.txhash);
  };

  return (
    <button onClick={handleBuy} disabled={isLoading}>
      {isLoading ? 'Processing...' : `Buy for ${price} INIT`}
    </button>
  );
}
```

---

## 3. Auto-Signing Sessions

Auto-signing sessions allow users to approve a "session key" that can sign transactions on their behalf for a limited time, removing the need for wallet popups on every action.

### How It Works

1. User connects wallet and creates a session (one-time approval)
2. A temporary session key is generated client-side
3. The session key is authorized on-chain with spending limits and expiry
4. Subsequent transactions are signed automatically by the session key
5. Session expires after the configured time (e.g., 30 minutes)

### Implementation

```tsx
import { useSession } from '@initia/interwovenkit-react';

function SessionManager() {
  const {
    createSession,
    endSession,
    isSessionActive,
    sessionExpiry,
  } = useSession();

  const startShopping = async () => {
    await createSession({
      // Allow up to 100 INIT spending per session
      spendLimit: { denom: 'uinit', amount: '100000000' },
      // Session valid for 30 minutes
      expiry: Math.floor(Date.now() / 1000) + 1800,
      // Only allow marketplace module interactions
      allowedMsgs: [
        {
          moduleAddress: MARKETPLACE_MODULE_ADDR,
          moduleName: 'marketplace',
          functionNames: ['create_order', 'confirm_delivery', 'leave_review'],
        },
      ],
    });
  };

  return (
    <div>
      {isSessionActive ? (
        <div>
          <p>Session active until {new Date(sessionExpiry * 1000).toLocaleTimeString()}</p>
          <button onClick={endSession}>End Session</button>
        </div>
      ) : (
        <button onClick={startShopping}>
          Start Shopping Session (approve once)
        </button>
      )}
    </div>
  );
}
```

### Use Case for Tienda

- Buyer approves a session, then browses and buys multiple items without repeated wallet popups
- Merchant approves a session to list products, update inventory, and process orders seamlessly
- Sessions are scoped to only marketplace functions -- cannot drain the wallet

---

## 4. Interwoven Bridge

The Interwoven Bridge enables cross-chain asset transfers between Initia L1, Tienda (our Minitia), and other Initia rollups via native IBC.

### Bridging Assets to Tienda

```tsx
import { useBridge } from '@initia/interwovenkit-react';

function BridgeToTienda() {
  const { bridge, isLoading, txHash } = useBridge();

  const bridgeTokens = async () => {
    await bridge({
      sourceChainId: 'initiation-2',      // Initia L1 testnet
      destinationChainId: 'tienda-1',      // Tienda Minitia
      denom: 'uinit',
      amount: '10000000',                  // 10 INIT
      receiver: 'init1...buyer_address',
    });
  };

  return (
    <button onClick={bridgeTokens} disabled={isLoading}>
      Bridge 10 INIT to Tienda
    </button>
  );
}
```

### Enabling Enshrined Liquidity

Tienda benefits from Initia's enshrined liquidity -- tokens bridged from L1 are natively available on the rollup without third-party bridges.

```bash
# Register a token pair on L1 for enshrined liquidity
initiad tx ophost set-bridge-token \
  --bridge-id 1 \
  --l1-denom uinit \
  --l2-denom uinit \
  --from tienda-operator \
  --chain-id initiation-2 \
  --node https://rpc.testnet.initia.xyz:443
```

### Cross-Rollup Payments

A buyer on another Initia rollup can pay a Tienda merchant without leaving their rollup:

```tsx
function CrossChainBuy({ productId, merchantChainId }) {
  const { bridge } = useBridge();
  const { signAndBroadcast } = useSignAndBroadcast();

  const handleCrossChainPurchase = async () => {
    // Step 1: Bridge payment to Tienda rollup
    const bridgeTx = await bridge({
      sourceChainId: 'other-rollup-1',
      destinationChainId: 'tienda-1',
      denom: 'uinit',
      amount: '18500000', // 18.5 INIT
    });

    // Step 2: Execute order on Tienda (via IBC message or after bridging)
    // The bridge callback triggers the order creation automatically
  };
}
```

---

## 5. Initia Usernames (.init)

Initia Usernames replace long wallet addresses with human-readable `.init` names (e.g., `cafemaria.init`).

### Resolving Usernames

```tsx
import { useUsername } from '@initia/interwovenkit-react';

function MerchantProfile({ address }) {
  const { username, isLoading } = useUsername(address);

  return (
    <div>
      <h2>{username || address}</h2>
      {/* Shows "cafemaria.init" instead of "init1abc...xyz" */}
    </div>
  );
}
```

### Registering a Username for a Merchant

```tsx
import { useRegisterUsername } from '@initia/interwovenkit-react';

function RegisterUsername() {
  const { register, isLoading } = useRegisterUsername();

  const claimName = async () => {
    await register({
      username: 'cafemaria',  // becomes cafemaria.init
    });
  };

  return (
    <button onClick={claimName} disabled={isLoading}>
      Claim cafemaria.init
    </button>
  );
}
```

### Integration in Tienda

- Merchants get a `.init` username during onboarding (e.g., `cafemaria.init`)
- Buyers can send payments to `cafemaria.init` instead of a raw address
- Store URLs become shareable: `tienda.app/cafemaria.init`
- Reviews display reviewer usernames instead of wallet addresses

### Resolving .init to Address (Backend)

```javascript
const { LCDClient } = require('@initia/initia.js');

async function resolveUsername(username) {
  const lcd = new LCDClient('https://lcd.testnet.initia.xyz', {
    chainId: 'initiation-2',
  });

  // Query the usernames module
  const result = await lcd.move.viewFunction(
    '0x1',            // usernames module address
    'usernames',
    'resolve',
    [],
    [username.replace('.init', '')]
  );

  return result.data; // returns the wallet address
}
```

---

## 6. CLI Commands Reference

### Environment Setup

```bash
# Set environment variables
export INITIA_RPC="https://rpc.testnet.initia.xyz:443"
export INITIA_LCD="https://lcd.testnet.initia.xyz"
export INITIA_CHAIN_ID="initiation-2"
export TIENDA_CHAIN_ID="tienda-1"
```

### Key Management

```bash
# Create keys
initiad keys add tienda-operator --keyring-backend test
initiad keys add tienda-challenger --keyring-backend test

# List keys
initiad keys list --keyring-backend test

# Export key (for backend .env)
initiad keys export tienda-operator --keyring-backend test --unarmored-hex --unsafe

# Get address
initiad keys show tienda-operator -a --keyring-backend test
```

### Minitia Operations

```bash
# Initialize minitia
minitiad init tienda-rollup --chain-id tienda-1

# Start minitia node
minitiad start

# Check node status
minitiad status

# Query account balance on minitia
minitiad query bank balances <address> --node http://localhost:26657
```

### Move Module Deployment

```bash
# Compile Move module
aptos move compile --package-dir src/contracts/

# Publish module to minitia
minitiad tx move publish \
  --move-module-path src/contracts/build/marketplace/bytecode_modules/marketplace.mv \
  --from tienda-operator \
  --chain-id tienda-1 \
  --gas auto --gas-adjustment 1.5

# Execute a Move function (e.g., register merchant)
minitiad tx move execute \
  <module-address> marketplace register_merchant \
  --args "string:init1abc..." "string:Cafe Maria" "string:Best coffee" "string:CO" "string:Medellin" "string:[food]" \
  --from tienda-operator \
  --chain-id tienda-1

# Query Move module state
minitiad query move view \
  <module-address> marketplace get_merchant \
  --args "string:init1abc..."
```

### Bridge Operations

```bash
# Bridge INIT from L1 to Tienda minitia
initiad tx ibc-transfer transfer \
  transfer channel-0 \
  <recipient-on-tienda> \
  10000000uinit \
  --from tienda-operator \
  --chain-id initiation-2 \
  --node https://rpc.testnet.initia.xyz:443

# Check bridge status
initiad query ophost bridge 1 --node https://rpc.testnet.initia.xyz:443
```

### Backend Server

```bash
# Start backend (from src/backend/)
cd src/backend && npm install && npm start

# Start with environment overrides
PORT=3001 INITIA_LCD_URL=https://lcd.testnet.initia.xyz npm start

# Run tests
npm test
```

---

## Deployment Checklist

- [ ] Operator and challenger keys generated and funded on L1 testnet
- [ ] Minitia genesis configured with marketplace.move module
- [ ] Bridge registered on L1
- [ ] Minitia node running and syncing
- [ ] Batch submitter (opinitd) running
- [ ] Move module published on minitia
- [ ] Backend `.env` configured with minitia LCD endpoint
- [ ] InterwovenKit provider configured with Tienda chain info
- [ ] Enshrined liquidity token pairs registered
- [ ] Merchant usernames (.init) registered

---

## Current Status

**Testnet deployment is in progress.** The Move module (`marketplace.move`) and backend API (`server.js`) are complete and tested locally. Minitia registration on `initiation-2` is the next milestone.

For questions or issues, open a GitHub issue at https://github.com/xpandia/tienda.
