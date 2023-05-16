
# Bonds


## State architecture

![image description](diagram.png)

## Testing

Run metaplex enabled validator with:

    solana-test-validator --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s metaplex_token_metadata_program.so --reset

Then  you need to:
1. `anchor build`
2. `anchor deploy`
3. `anchor run test`

## TODOs:
- Make accounts as small as possible to save costs
- Inputs to functions can be smaller (as for percent input)
- Remove `msg!`
- Before deployment hardcode program ID
- Take a cut from bond issuance to us and ibo deployer
- Take a cut from bond resale to us and ibo deployer
- I think `mint_key` in `buy_bond_gated()` and in setting up that gate is redundant
- Take some SOL for splitting bond/ticket
- Implement withdraw for liquidity tokens stored at ibo PDA
- createIBO needs to take some sort of pubkey which represents the desired bond token to purchase
- need withdraw of leftover bond tokens past some hardcoded date
- change lock_up to lockup