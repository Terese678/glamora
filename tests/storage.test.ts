
import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;
const wallet4 = accounts.get("wallet_4")!;

/*
 * STORAGE CONTRACT TESTS
 * 
 * This test suite validates the storage contract functionality
 * Testing Areas:
 * 1. Authorization & Security
 * 2. Creator Profile Management
 * 3. Public User Profile Management
 * 4. Content Management
 * 5. Tip Recording
 * 6. Follow System
 * 7. Subscription Management
 * 8. NFT Data Storage
 * 9. Marketplace Listings
 */

describe("Storage Contract Tests", () => {

  describe("Authorization & Security", () => {

    it("should set deployer as initial authorized contract", () => {
      const response = simnet.callReadOnlyFn(
        "storage",
        "get-authorized-contract",
        [],
        deployer
      );

      expect(response.result).toBePrincipal(deployer);
    });

    it("should set deployer as initial admin", () => {
      const response = simnet.callReadOnlyFn(
        "storage",
        "get-contract-admin",
        [],
        deployer
      );

      expect(response.result).toBePrincipal(deployer);
    });

    it("should allow admin to update authorized contract", () => {
      const { result } = simnet.callPublicFn(
        "storage",
        "set-authorized-contract",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify the change
      const response = simnet.callReadOnlyFn(
        "storage",
        "get-authorized-contract",
        [],
        deployer
      );

      expect(response.result).toBePrincipal(wallet1);
    });

    it("should prevent non-admin from updating authorized contract", () => {
      const { result } = simnet.callPublicFn(
        "storage",
        "set-authorized-contract",
        [Cl.principal(wallet2)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });
  });

  describe("Creator Profile Management", () => {

    beforeEach(() => {
      simnet.callPublicFn(
        "storage",
        "set-authorized-contract",
        [Cl.principal(deployer)],
        deployer
      );
    });

    it("should create a new creator profile successfully", () => {
      const { result } = simnet.callPublicFn(
        "storage",
        "create-creator-profile",
        [
          Cl.principal(wallet1),
          Cl.stringAscii("fashionista"),
          Cl.stringUtf8("Fashion Creator"),
          Cl.stringUtf8("Luxury fashion designer from Lagos")
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify profile was created
      const profile = simnet.callReadOnlyFn(
        "storage",
        "get-creator-profile",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(profile.result).toBeSome(
        Cl.tuple({
          "creator-username": Cl.stringAscii("fashionista"),
          "display-name": Cl.stringUtf8("Fashion Creator"),
          "bio": Cl.stringUtf8("Luxury fashion designer from Lagos"),
          "creation-date": Cl.uint(simnet.blockHeight),
          "follower-count": Cl.uint(0),
          "following-count": Cl.uint(0),
          "total-content": Cl.uint(0),
          "total-tips-received": Cl.uint(0),
          "total-tips-sent": Cl.uint(0)
        })
      );
    });

    it("should prevent duplicate usernames", () => {
      simnet.callPublicFn(
        "storage",
        "create-creator-profile",
        [
          Cl.principal(wallet1),
          Cl.stringAscii("fashionista"),
          Cl.stringUtf8("User One"),
          Cl.stringUtf8("First user")
        ],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "storage",
        "create-creator-profile",
        [
          Cl.principal(wallet2),
          Cl.stringAscii("fashionista"),
          Cl.stringUtf8("User Two"),
          Cl.stringUtf8("Second user")
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(102)); // ERR-USERNAME-TAKEN
    });

    it("should update creator profile successfully", () => {
      simnet.callPublicFn(
        "storage",
        "create-creator-profile",
        [
          Cl.principal(wallet1),
          Cl.stringAscii("fashionista"),
          Cl.stringUtf8("Old Name"),
          Cl.stringUtf8("Old bio")
        ],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "storage",
        "update-creator-profile",
        [
          Cl.principal(wallet1),
          Cl.stringUtf8("New Name"),
          Cl.stringUtf8("New bio about fashion")
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Public User Profile Management", () => {

    beforeEach(() => {
      simnet.callPublicFn(
        "storage",
        "set-authorized-contract",
        [Cl.principal(deployer)],
        deployer
      );
    });

    it("should create a new public user profile successfully", () => {
      const { result } = simnet.callPublicFn(
        "storage",
        "create-public-user-profile",
        [
          Cl.principal(wallet1),
          Cl.stringAscii("fashionfan"),
          Cl.stringUtf8("Fashion Lover"),
          Cl.stringUtf8("I love fashion!")
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should update public user profile successfully", () => {
      simnet.callPublicFn(
        "storage",
        "create-public-user-profile",
        [
          Cl.principal(wallet1),
          Cl.stringAscii("fashionfan"),
          Cl.stringUtf8("Old Name"),
          Cl.stringUtf8("Old bio")
        ],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "storage",
        "update-public-user-profile",
        [
          Cl.principal(wallet1),
          Cl.stringUtf8("Updated Name"),
          Cl.stringUtf8("Updated bio")
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Content Management", () => {

    beforeEach(() => {
      simnet.callPublicFn(
        "storage",
        "set-authorized-contract",
        [Cl.principal(deployer)],
        deployer
      );

      simnet.callPublicFn(
        "storage",
        "create-creator-profile",
        [
          Cl.principal(wallet1),
          Cl.stringAscii("creator"),
          Cl.stringUtf8("Creator"),
          Cl.stringUtf8("Bio")
        ],
        deployer
      );
    });

    it("should create content successfully", () => {
      const contentHash = new Uint8Array(32).fill(1);
      
      const { result } = simnet.callPublicFn(
        "storage",
        "create-content",
        [
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.stringUtf8("Fashion Show 2024"),
          Cl.stringUtf8("Amazing runway collection"),
          Cl.buffer(contentHash),
          Cl.some(Cl.stringAscii("QmXxxx1234567890")),
          Cl.uint(1)
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should delete content successfully", () => {
      const contentHash = new Uint8Array(32).fill(1);
      
      simnet.callPublicFn(
        "storage",
        "create-content",
        [
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.stringUtf8("Content"),
          Cl.stringUtf8("Description"),
          Cl.buffer(contentHash),
          Cl.none(),
          Cl.uint(1)
        ],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "storage",
        "delete-content",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Follow System", () => {

    beforeEach(() => {
      simnet.callPublicFn(
        "storage",
        "set-authorized-contract",
        [Cl.principal(deployer)],
        deployer
      );

      simnet.callPublicFn(
        "storage",
        "create-creator-profile",
        [
          Cl.principal(wallet1),
          Cl.stringAscii("creator1"),
          Cl.stringUtf8("Creator 1"),
          Cl.stringUtf8("Bio 1")
        ],
        deployer
      );

      simnet.callPublicFn(
        "storage",
        "create-creator-profile",
        [
          Cl.principal(wallet2),
          Cl.stringAscii("creator2"),
          Cl.stringUtf8("Creator 2"),
          Cl.stringUtf8("Bio 2")
        ],
        deployer
      );
    });

    it("should create follow relationship successfully", () => {
      const { result } = simnet.callPublicFn(
        "storage",
        "create-follow",
        [Cl.principal(wallet1), Cl.principal(wallet2)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should return true for is-following when active", () => {
      simnet.callPublicFn(
        "storage",
        "create-follow",
        [Cl.principal(wallet1), Cl.principal(wallet2)],
        deployer
      );

      const isFollowing = simnet.callReadOnlyFn(
        "storage",
        "is-following",
        [Cl.principal(wallet1), Cl.principal(wallet2)],
        deployer
      );

      expect(isFollowing.result).toBeBool(true);
    });

    it("should remove follow relationship successfully", () => {
      simnet.callPublicFn(
        "storage",
        "create-follow",
        [Cl.principal(wallet1), Cl.principal(wallet2)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "storage",
        "remove-follow",
        [Cl.principal(wallet1), Cl.principal(wallet2)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Subscription Management", () => {

    beforeEach(() => {
      simnet.callPublicFn(
        "storage",
        "set-authorized-contract",
        [Cl.principal(deployer)],
        deployer
      );

      simnet.callPublicFn(
        "storage",
        "create-creator-profile",
        [
          Cl.principal(wallet1),
          Cl.stringAscii("creator"),
          Cl.stringUtf8("Creator"),
          Cl.stringUtf8("Bio")
        ],
        deployer
      );
    });

    it("should create subscription successfully", () => {
      const expiryBlock = simnet.blockHeight + 4320;

      const { result } = simnet.callPublicFn(
        "storage",
        "create-subscription",
        [
          Cl.principal(wallet2),
          Cl.principal(wallet1),
          Cl.uint(1), // Basic tier
          Cl.uint(2000000),
          Cl.uint(expiryBlock),
          Cl.uint(1), // tier-basic
          Cl.uint(2), // tier-premium
          Cl.uint(3)  // tier-vip
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should cancel subscription successfully", () => {
      const expiryBlock = simnet.blockHeight + 4320;

      simnet.callPublicFn(
        "storage",
        "create-subscription",
        [
          Cl.principal(wallet2),
          Cl.principal(wallet1),
          Cl.uint(1),
          Cl.uint(2000000),
          Cl.uint(expiryBlock),
          Cl.uint(1),
          Cl.uint(2),
          Cl.uint(3)
        ],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "storage",
        "cancel-subscription",
        [
          Cl.principal(wallet2),
          Cl.uint(1),
          Cl.uint(2),
          Cl.uint(3)
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("NFT Data Storage", () => {

    beforeEach(() => {
      simnet.callPublicFn(
        "storage",
        "set-authorized-contract",
        [Cl.principal(deployer)],
        deployer
      );
    });

    it("should store collection data successfully", () => {
      const { result } = simnet.callPublicFn(
        "storage",
        "store-collection-data",
        [
          Cl.uint(1),
          Cl.stringUtf8("Summer Collection"),
          Cl.principal(wallet1),
          Cl.stringUtf8("Amazing summer fashion"),
          Cl.uint(100)
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should store NFT metadata successfully", () => {
      const { result } = simnet.callPublicFn(
        "storage",
        "store-nft-metadata",
        [
          Cl.uint(1),
          Cl.stringUtf8("Fashion NFT #1"),
          Cl.stringUtf8("Exclusive fashion piece"),
          Cl.stringAscii("QmTestHash123"),
          Cl.none(),
          Cl.none(),
          Cl.none()
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Marketplace Listings", () => {

    beforeEach(() => {
      simnet.callPublicFn(
        "storage",
        "set-authorized-contract",
        [Cl.principal(deployer)],
        deployer
      );
    });

    it("should create NFT listing successfully", () => {
      const { result } = simnet.callPublicFn(
        "storage",
        "create-nft-listing",
        [
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.uint(10000000)
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should complete NFT sale successfully", () => {
      simnet.callPublicFn(
        "storage",
        "create-nft-listing",
        [
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.uint(10000000)
        ],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "storage",
        "complete-nft-sale",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(10000000)
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should cancel NFT listing successfully", () => {
      simnet.callPublicFn(
        "storage",
        "create-nft-listing",
        [
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.uint(10000000)
        ],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "storage",
        "cancel-nft-listing",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });
  });
});

