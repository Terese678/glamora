
import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

/*
 * SIP-009 NFT TRAIT TESTS
 * 
 * This test suite validates that the glamora-nft contract properly implements
 * the SIP-009 NFT standard trait definition
 * 
 * Testing Areas:
 * 1. Trait Interface Compliance
 * 2. Function Signature Validation
 * 3. Integration with glamora-nft Contract
 */

describe("SIP-009 Trait Tests", () => {

  describe("Trait Definition Validation", () => {

    it("should have valid trait definition for nft-trait", () => {
      // This test verifies that the sip-009 contract defines the trait correctly
      // The trait should be available for other contracts to implement
      
      // If the contract deployed successfully, the trait is defined
      const contractInfo = simnet.getContractSource("sip-009");
      expect(contractInfo).toBeDefined();
    });

    it("should define all required SIP-009 trait functions", () => {
      // The SIP-009 trait should define these functions:
      // 1. get-last-token-id
      // 2. get-token-uri
      // 3. get-owner
      // 4. transfer
      
      const contractSource = simnet.getContractSource("sip-009");
      
      // Verify trait defines get-last-token-id
      expect(contractSource).toContain("get-last-token-id");
      
      // Verify trait defines get-token-uri
      expect(contractSource).toContain("get-token-uri");
      
      // Verify trait defines get-owner
      expect(contractSource).toContain("get-owner");
      
      // Verify trait defines transfer
      expect(contractSource).toContain("transfer");
    });
  });

  describe("Trait Implementation by glamora-nft", () => {

    it("should verify glamora-nft implements the nft-trait", () => {
      // Check that glamora-nft contract implements the trait
      const glamoraNftSource = simnet.getContractSource("glamora-nft");
      
      // The contract should have impl-trait declaration
      expect(glamoraNftSource).toContain("impl-trait");
      expect(glamoraNftSource).toContain("sip-009");
      expect(glamoraNftSource).toContain("nft-trait");
    });

    it("should verify get-last-token-id function exists in glamora-nft", () => {
      // Try calling the function - it should exist and return ok
      const response = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-last-token-id",
        [],
        deployer
      );
      
      // Should return ok with uint (even if 0)
      expect(response.result).toBeOk(Cl.uint(0));
    });

    it("should verify get-token-uri function exists in glamora-nft", () => {
      // Try calling the function with a token ID
      const response = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-token-uri",
        [Cl.uint(1)],
        deployer
      );
      
      // Should return ok (even if none for non-existent token)
      expect(response.result).toBeOk(Cl.none());
    });

    it("should verify get-owner function exists in glamora-nft", () => {
      // Try calling the function with a token ID
      const response = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      
      // Should return ok (even if none for non-existent token)
      expect(response.result).toBeOk(Cl.none());
    });

    it("should verify transfer function exists in glamora-nft", () => {
      // The transfer function should exist
      // We can't test it without minting an NFT first, but we can verify
      // the contract has the function by checking the source
      const glamoraNftSource = simnet.getContractSource("glamora-nft");
      
      expect(glamoraNftSource).toContain("define-public (transfer");
    });
  });

  describe("Trait Function Signatures", () => {

    it("should verify get-last-token-id returns response uint uint", () => {
      const response = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-last-token-id",
        [],
        deployer
      );
      
      // Response should be (response uint uint) format
      expect(response.result).toBeOk(Cl.uint(0));
    });

    it("should verify get-token-uri accepts uint and returns correct type", () => {
      const response = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-token-uri",
        [Cl.uint(999)], // Non-existent token
        deployer
      );
      
      // Should return (response (optional (string-ascii 256)) uint)
      expect(response.result).toBeOk(Cl.none());
    });

    it("should verify get-owner accepts uint and returns correct type", () => {
      const response = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-owner",
        [Cl.uint(999)], // Non-existent token
        deployer
      );
      
      // Should return (response (optional principal) uint)
      expect(response.result).toBeOk(Cl.none());
    });
  });

  describe("Trait Standard Compliance", () => {

    it("should follow SIP-009 naming conventions", () => {
      // All function names should match SIP-009 standard exactly
      const glamoraNftSource = simnet.getContractSource("glamora-nft");
      
      // Function names must match exactly (kebab-case)
      expect(glamoraNftSource).toContain("get-last-token-id");
      expect(glamoraNftSource).toContain("get-token-uri");
      expect(glamoraNftSource).toContain("get-owner");
      expect(glamoraNftSource).toContain("transfer");
    });

    it("should have proper trait import structure", () => {
      const glamoraNftSource = simnet.getContractSource("glamora-nft");
      
      // Should implement trait with proper syntax
      expect(glamoraNftSource).toContain("impl-trait .sip-009.nft-trait");
    });

    it("should verify trait is properly defined in sip-009", () => {
      const sip009Source = simnet.getContractSource("sip-009");
      
      // Should have define-trait declaration
      expect(sip009Source).toContain("define-trait nft-trait");
      
      // Should define all required functions in trait
      expect(sip009Source).toContain("get-last-token-id");
      expect(sip009Source).toContain("get-token-uri");
      expect(sip009Source).toContain("get-owner");
      expect(sip009Source).toContain("transfer");
    });
  });

  describe("Integration Testing with Trait", () => {

    it("should work with NFT marketplaces expecting SIP-009", () => {
      // This test verifies that the implementation is compatible with
      // external contracts that expect SIP-009 compliance
      
      // Any contract expecting SIP-009 should be able to call these functions
      const response1 = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-last-token-id",
        [],
        deployer
      );
      expect(response1.result).toBeOk(Cl.uint(0));
      
      const response2 = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(response2.result).toBeOk(Cl.none());
    });

    it("should return correct response types for all trait functions", () => {
      // get-last-token-id should return (response uint uint)
      const lastTokenId = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-last-token-id",
        [],
        deployer
      );
      expect(lastTokenId.result).toBeOk(Cl.uint(0));
      
      // get-token-uri should return (response (optional (string-ascii 256)) uint)
      const tokenUri = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-token-uri",
        [Cl.uint(1)],
        deployer
      );
      expect(tokenUri.result).toBeOk(Cl.none());
      
      // get-owner should return (response (optional principal) uint)
      const owner = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(owner.result).toBeOk(Cl.none());
    });
  });

  describe("Trait Documentation and Standards", () => {

    it("should verify trait defines proper return types", () => {
      const sip009Source = simnet.getContractSource("sip-009");
      
      // Verify response types are defined correctly in trait
      expect(sip009Source).toContain("response uint uint"); // get-last-token-id
      expect(sip009Source).toContain("response (optional"); // get-token-uri and get-owner
      expect(sip009Source).toContain("response bool uint"); // transfer
    });

    it("should verify trait parameter types", () => {
      const sip009Source = simnet.getContractSource("sip-009");
      
      // get-token-uri should accept uint
      expect(sip009Source).toMatch(/get-token-uri.*uint/);
      
      // get-owner should accept uint
      expect(sip009Source).toMatch(/get-owner.*uint/);
      
      // transfer should accept uint principal principal
      expect(sip009Source).toMatch(/transfer.*uint principal principal/);
    });
  });

  describe("Error Handling with Trait Functions", () => {

    it("should handle non-existent token IDs gracefully", () => {
      // get-owner should return (ok none) for non-existent tokens
      const response = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-owner",
        [Cl.uint(999999)],
        deployer
      );
      
      expect(response.result).toBeOk(Cl.none());
    });

    it("should handle non-existent token URIs gracefully", () => {
      // get-token-uri should return (ok none) for non-existent tokens
      const response = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-token-uri",
        [Cl.uint(999999)],
        deployer
      );
      
      expect(response.result).toBeOk(Cl.none());
    });
  });

  describe("Trait Compatibility", () => {

    it("should be compatible with external NFT tools", () => {
      // External tools expecting SIP-009 should work with glamora-nft
      // This test verifies the contract exposes the required interface
      
      const lastTokenId = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-last-token-id",
        [],
        deployer
      );
      
      // As long as this returns ok, external tools can work with it
      expect(lastTokenId.result).toBeDefined();
    });

    it("should support NFT wallet integrations", () => {
      // Wallets need to:
      // 1. Get last token ID to know range
      // 2. Get owner to check ownership
      // 3. Get token URI to display metadata
      
      const lastTokenId = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-last-token-id",
        [],
        deployer
      );
      expect(lastTokenId.result).toBeOk(Cl.uint(0));
      
      const owner = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(owner.result).toBeDefined();
      
      const uri = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-token-uri",
        [Cl.uint(1)],
        deployer
      );
      expect(uri.result).toBeDefined();
    });

    it("should support NFT marketplace integrations", () => {
      // Marketplaces need all trait functions to work properly
      const glamoraNftSource = simnet.getContractSource("glamora-nft");
      
      // Verify all required functions exist
      expect(glamoraNftSource).toContain("get-last-token-id");
      expect(glamoraNftSource).toContain("get-token-uri");
      expect(glamoraNftSource).toContain("get-owner");
      expect(glamoraNftSource).toContain("transfer");
    });
  });
});
