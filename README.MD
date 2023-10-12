# Bonds

BondFort is a decentralized finance (DeFi) protocol built on the Solana blockchain, which allows participants to engage in the issuance, trading, and management of tokenized bonds. The platform works by allowing an entity, (referred to as the bond master), to issue bonds. Each bond represents a promise to pay a certain amount (the face value) at a future date (maturity date).

![image description](pepe_bond.png)

For each bond, the bond master can set different lock-up types. Each of these lock-up types would have their own unique set of parameters:

- Lock-up period: This is the length of time during which the bond must be held before it can be fully redeemed. This period could range from a few months to several years. During this time, the bondholder can't redeem the bond for its full value, although they might be able to sell it to another user.

- APY: The Annual Percentage Yield represents the rate of return that bondholders can expect over a one-year period, taking into account the effect of compounding. The bond master can set different APYs for different lock-up types, offering higher returns for longer lock-up periods as an incentive for users to hold the bond for a longer time.

The bond master can also introduce additional restrictions or features for each lock-up type:

- NFT community restrictions: The bond master can restrict certain lock-up types to be exclusive to specific NFT communities.

- Maturity-only claims: In some cases, the bond master might set up a lock-up type where the returns can only be claimed when the bond reaches maturity. This would mean that the bondholders have to hold the bond for the entire lock-up period to get their returns. This could be used to encourage long-term holding and stabilize the price of the bond.

These bonds are represented by a unique record entry for this specic bond offering. This fractionalisation allows for the easy and secure transfer of ownership of these bonds.

Once issued, these bonds are available for purchase by the users. A user purchases a bond by paying in the underlying token specified by the bond master. The purchased bond earns interest over time, which is paid out to the bondholder. The interest can be withdrawn by the bondholder as it accrues, which provides an income stream for the bondholder. Though interest is calculated based on compounding APY, this is done once at the start, after that locked tokens are released linearly.

Additionally, bondholders can sell their bonds to other users. This is facilitated by a secondary market function within the platform, where bonds can be listed for sale. The seller can set the sale price, and potential buyers can browse the listed bonds and purchase ones they are interested in. When a bond is sold, the sale price is divided among various parties. The seller receives the majority of the sale price. However, a portion of the sale price is taken as a cut by the bond master. This cut is further divided between the bond master and the master master.

Each bond offering also includes lockups. These prevent bond master from draining the bond PDA of underlying token or introducing lockups that favour them over those that have already pruchsed some bonds.

## State architecture

![image description](diagram.png)

## Testing

Run metaplex enabled validator with:

    solana-test-validator --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s metaplex_token_metadata_program.so --reset

Then you need to:

1. `anchor build`
2. `anchor deploy`
3. `anchor run test`

## TODOs:

### Clean-up

[x] change lockup to lockup  
[x] Lock up to bond params
[x] change ticket to bond  
[x] In the diagram change:

- Bond counter to Bond offering counter
- Ticket to Bond  
  [ ] Remove any fucking american spelling
  [ ] Diagram does not relfect at all current accoutn layout. ie gates are derived per IBO, not per lockup but can be reused for each lock up

### Functionality

[x] Implement withdraw for liquidity tokens stored at ibo PDA  
[x] Need to withdraw of leftover bond tokens past some hardcoded date  
[x] Ability to remove lockups and gates before it is locked  
[ ] Reuse functionality for NFTs:  
 NFTs owned by the ibo account.  
 Above NFT purchase specific tokens released linearly to the given bond for a user.  
 Bond tokens can be used to claim NFT at a set price level.  
 Or they can be resold. On purchase they are burned, and two step invocation for a VRF is made.  
 Based on that a random NFT is selected and can be withdrawn. Would need a wheel to iterate over all of the remaining NFTs using the obtained randomness.  
[x] ~~Option for a price look-up. Rather than having a fixed price, instead need a call to an oracle to fetch latest price and use that~~ abandoned
[ ] With SPL gate need to ensure that user has above certain amount and that it is burned when they convert it to bonds. So they can't get more than their WL allowance
[ ] There is an optional limits on bond purchases per given lock-up types. Those can't be exceeded
[ ] There is a bond start and gate end on the bond account (`purchase_period`), that override main bond. So even if the main ibo hasn't started someone could use that lockup (that is ideally gated) to buy before veryone else driving hype. Likewise if main IBO time expires (and organisers can withdraw leftover bonds if they are frozen) lockup with longer purchase date could still purchase any bonds provided there are any left.

### Revenue

[x] Take a cut from bond issuance to us

- When user buys underlying, they get exact conversion but reuser gets slight cut in liquidity that they receive  
  [x] Take a cut from bond resale to us and ibo deployer
- When user buys a swap, seller is charged a small cut from what they receive  
  [x] Take some SOL for splitting bond/bond  
  [x] SOL fee for spinning up an IBO

### Safety

[x] createIBO needs to take some sort of pubkey which represents the desired bond token to purchase  
[x] Correct ATA and ata mint/owner provided as the master recipient
[ ] Use the safe math from staking for calculation of total interest
[ ] Use compound math, use different price ranges to subtract comppound gain from (0-t1) - (0-t2) to get difference between invocations. Subbed from main balance.

### Optimisation

[ ] Make accounts as small as possible to save costs  
[ ] Inputs to functions can be smaller (as for percent input)  
[ ] Before deployment hardcode program ID  
[x] I think `mint_key` in `buy_bond_gated()` and in setting up that gate is redundant
[x] Move GatedSettingss so they spawn of counter at bond account

### Testing

[ ] Multiple files and/or `describe()` so that deployment can happen once, but can skip doing same thing or a reptetive set-up  
[x] Test kept invocation counter incremented at the end of a function  
[x] Test for taking cut to us on bond purchase
[ ] Tests for removing gate from a given lock-up
[ ] Need to test a lock-up with both types WL SPL + collection

# Running it

It runs now on 1.16.3

If it gets stuck, restartd validator and redeploy.

If it throws `FetchError: request to http://localhost:8899/ failed, reason: connect ECONNREFUSED ::1:8899` change to node 16 with `nvm use 16`.

Need this to build:

`solana-install init 1.16.3`

Tests work too.

~~Can't build with `anchor build` so use `cargo build`, `anchor deploy` works though.~~

Kill existing instance

kill -9 $(lsof -t -i:9900)

Kill all npm or node `pkill -9 -f "node|npm"`

# NextJs

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
