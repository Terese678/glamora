
import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("sbtc-token tests", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  it("returns correct token name", () => {
    const { result } = simnet.callReadOnlyFn(
      "sbtc-token",
      "get-name",
      [],
      deployer
    );
    expect(result).toBeOk(Cl.stringAscii("Stacked Bitcoin"));
  });

  it("returns correct token symbol", () => {
    const { result } = simnet.callReadOnlyFn(
      "sbtc-token",
      "get-symbol",
      [],
      deployer
    );
    expect(result).toBeOk(Cl.stringAscii("sBTC"));
  });

  it("returns correct decimals (8 decimal places)", () => {
    const { result } = simnet.callReadOnlyFn(
      "sbtc-token",
      "get-decimals",
      [],
      deployer
    );
    expect(result).toBeOk(Cl.uint(8));
  });

  it("mints tokens successfully to a wallet", () => {
    const { result } = simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(1000000), Cl.principal(wallet1)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("updates recipient balance after minting", () => {
    simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(1000000), Cl.principal(wallet1)],
      deployer
    );

    const { result } = simnet.callReadOnlyFn(
      "sbtc-token",
      "get-balance",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result).toBeOk(Cl.uint(1000000));
  });

  it("can mint to multiple wallets independently", () => {
    simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(500000), Cl.principal(wallet1)],
      deployer
    );

    simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(750000), Cl.principal(wallet2)],
      deployer
    );

    const balance1 = simnet.callReadOnlyFn(
      "sbtc-token",
      "get-balance",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(balance1.result).toBeOk(Cl.uint(500000));

    const balance2 = simnet.callReadOnlyFn(
      "sbtc-token",
      "get-balance",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(balance2.result).toBeOk(Cl.uint(750000));
  });

  it("accumulates minted tokens for same recipient", () => {
    simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(300000), Cl.principal(wallet1)],
      deployer
    );

    simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(200000), Cl.principal(wallet1)],
      deployer
    );

    const { result } = simnet.callReadOnlyFn(
      "sbtc-token",
      "get-balance",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result).toBeOk(Cl.uint(500000));
  });

  it("returns zero balance for wallet with no tokens", () => {
    const { result } = simnet.callReadOnlyFn(
      "sbtc-token",
      "get-balance",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result).toBeOk(Cl.uint(0));
  });

  it("tracks balance correctly after multiple operations", () => {
    simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(1000000), Cl.principal(wallet1)],
      deployer
    );

    simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(500000), Cl.principal(wallet1)],
      deployer
    );

    const { result } = simnet.callReadOnlyFn(
      "sbtc-token",
      "get-balance",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result).toBeOk(Cl.uint(1500000));
  });

  it("transfers tokens successfully between wallets", () => {
    simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(1000000), Cl.principal(wallet1)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "sbtc-token",
      "transfer",
      [
        Cl.uint(300000),
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.none()
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("updates sender balance after transfer", () => {
    simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(1000000), Cl.principal(wallet1)],
      deployer
    );

    simnet.callPublicFn(
      "sbtc-token",
      "transfer",
      [
        Cl.uint(300000),
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.none()
      ],
      wallet1
    );

    const { result } = simnet.callReadOnlyFn(
      "sbtc-token",
      "get-balance",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result).toBeOk(Cl.uint(700000));
  });

  it("updates recipient balance after transfer", () => {
    simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(1000000), Cl.principal(wallet1)],
      deployer
    );

    simnet.callPublicFn(
      "sbtc-token",
      "transfer",
      [
        Cl.uint(300000),
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.none()
      ],
      wallet1
    );

    const { result } = simnet.callReadOnlyFn(
      "sbtc-token",
      "get-balance",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(result).toBeOk(Cl.uint(300000));
  });

  it("fails when sender is not tx-sender", () => {
    simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(1000000), Cl.principal(wallet1)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "sbtc-token",
      "transfer",
      [
        Cl.uint(300000),
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.none()
      ],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(1));
  });

  it("handles multiple transfers correctly", () => {
    simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(1000000), Cl.principal(wallet1)],
      deployer
    );

    simnet.callPublicFn(
      "sbtc-token",
      "transfer",
      [
        Cl.uint(200000),
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.none()
      ],
      wallet1
    );

    simnet.callPublicFn(
      "sbtc-token",
      "transfer",
      [
        Cl.uint(300000),
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.none()
      ],
      wallet1
    );

    const balance1 = simnet.callReadOnlyFn(
      "sbtc-token",
      "get-balance",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(balance1.result).toBeOk(Cl.uint(500000));

    const balance2 = simnet.callReadOnlyFn(
      "sbtc-token",
      "get-balance",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(balance2.result).toBeOk(Cl.uint(500000));
  });

  it("allows transfer with optional memo parameter", () => {
    simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(1000000), Cl.principal(wallet1)],
      deployer
    );

    const memo = Cl.some(Cl.bufferFromUtf8("Payment for services"));
    const { result } = simnet.callPublicFn(
      "sbtc-token",
      "transfer",
      [
        Cl.uint(250000),
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        memo
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  // ✅ NEW TEST 1 - ADD THIS
  it("handles zero amount mint", () => {
    const { result } = simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(0), Cl.principal(wallet1)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(2));
  });

  // ✅ NEW TEST 2 - ADD THIS
  it("handles zero amount transfer", () => {
    simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(1000000), Cl.principal(wallet1)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "sbtc-token",
      "transfer",
      [
        Cl.uint(0),
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.none()
      ],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(2));
  });

  it("handles very large token amounts", () => {
    const largeAmount = Cl.uint(1000000000000);
    const { result } = simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [largeAmount, Cl.principal(wallet1)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    const { result: balance } = simnet.callReadOnlyFn(
      "sbtc-token",
      "get-balance",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(balance).toBeOk(Cl.uint(1000000000000));
  });

  it("simulates platform tip flow", () => {
    simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(5000000), Cl.principal(wallet1)],
      deployer
    );

    const tipAmount = Cl.uint(100000);
    const { result } = simnet.callPublicFn(
      "sbtc-token",
      "transfer",
      [
        tipAmount,
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.some(Cl.bufferFromUtf8("Tip for great content!"))
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("simulates subscription payment flow", () => {
    simnet.callPublicFn(
      "sbtc-token",
      "mint",
      [Cl.uint(10000000), Cl.principal(wallet1)],
      deployer
    );

    const subscriptionFee = Cl.uint(500000);
    const { result } = simnet.callPublicFn(
      "sbtc-token",
      "transfer",
      [
        subscriptionFee,
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.some(Cl.bufferFromUtf8("Monthly subscription"))
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    const { result: creatorBalance } = simnet.callReadOnlyFn(
      "sbtc-token",
      "get-balance",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(creatorBalance).toBeOk(Cl.uint(500000));
  });
});
