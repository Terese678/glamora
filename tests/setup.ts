
import { beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

// ADD THIS LINE:
declare const simnet: any;

beforeEach(async () => {
  const accounts = simnet.getAccounts();
  const deployer = accounts.get("deployer")!;
  
  console.log("🔧 Setting up authorization...");
  
  const storageAuth = simnet.callPublicFn(
    "storage",
    "set-authorized-contract",
    [Cl.principal(`${deployer}.main`)],
    deployer
  );
  
  if (storageAuth.result.type !== "ok") {
    console.error("❌ Storage authorization FAILED:", storageAuth.result);
    throw new Error("Failed to authorize storage");
  }
  
  const nftAuth = simnet.callPublicFn(
    "glamora-nft",
    "set-authorized-caller",
    [Cl.contractPrincipal(deployer, "main")],
    deployer
  );
  
  if (nftAuth.result.type !== "ok") {
    console.error("❌ NFT authorization FAILED:", nftAuth.result);
    throw new Error("Failed to authorize NFT contract");
  }
  
  console.log("✅ Authorization successful");
});