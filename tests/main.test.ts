import { describe, expect, it, beforeAll } from "vitest";
import { Cl } from "@stacks/transactions";

const simnet = (globalThis as any).simnet;

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("DIAGNOSTIC - Find the Issue", () => {
  
  beforeAll(() => {
    const mainContract = `${deployer}.main`;
    
    simnet.callPublicFn(
      "storage",
      "set-authorized-contract",
      [Cl.principal(mainContract)],
      deployer
    );
    
    console.log("✅ Authorization complete");
  });

  it("Step 2: Call through main contract", () => {
    // Debug what storage actually sees
    const debugCall = simnet.callReadOnlyFn(  
      "storage",
      "get-authorized-contract",
      [],
      deployer
    );
    
    console.log("\n📍 Debug - what storage sees:");
    console.log("   Authorized:", debugCall.result);
    console.log("   Deployer address:", deployer);
    
    const mainCall = simnet.callPublicFn(
      "main",
      "create-creator-profile",
      [
        Cl.stringAscii("maintest"),
        Cl.stringUtf8("Main Test"),
        Cl.stringUtf8("Bio")
      ],
      wallet1
    );
    
    console.log("   Result:", mainCall.result);
  });
});
