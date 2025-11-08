
import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

/*
 * GLAMORA-NFT CONTRACT TEST SUITE
 * 
 * This test suite validates the glamora-nft.clar contract which implements
 * the SIP-009 NFT standard for fashion-related NFTs on the Glamora platform.
 * 
 * Test Coverage:
 * - SIP-009 standard compliance
 * - Admin functions (set-authorized-caller)
 * - Collection creation and management
 * - NFT minting
 * - NFT transfers
 * - Read-only functions
 * - Authorization checks
 * - Edge cases and error handling
 */

describe("glamora-nft contract tests", () => {
  
  describe("Initial State & Admin Functions", () => {
    
    it("initial total NFTs minted is zero", () => {
      const { result } = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-total-nfts-minted",
        [],
        deployer
      );

      expect(result).toBeUint(0);
    });

    it("initial next collection ID is 1", () => {
      const { result } = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-next-collection-id",
        [],
        deployer
      );

      expect(result).toBeUint(1);
    });

    it("deployer is initial authorized caller", () => {
      const { result } = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-authorized-caller",
        [],
        deployer
      );

      expect(result).toBePrincipal(deployer);
    });

    it("deployer is initial admin", () => {
      const { result } = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-admin",
        [],
        deployer
      );

      expect(result).toBePrincipal(deployer);
    });

    it("admin can update authorized caller", () => {
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "set-authorized-caller",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify update
      const check = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-authorized-caller",
        [],
        deployer
      );
      expect(check.result).toBePrincipal(wallet1);
    });

    it("non-admin cannot update authorized caller", () => {
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "set-authorized-caller",
        [Cl.principal(wallet2)],
        wallet1 // Not admin!
      );

      expect(result).toBeErr(Cl.uint(202)); // ERR-NOT-AUTHORIZED
    });

    it("is-admin returns true for admin", () => {
      const { result } = simnet.callReadOnlyFn(
        "glamora-nft",
        "is-admin",
        [Cl.principal(deployer)],
        deployer
      );

      expect(result).toBeBool(true);
    });

    it("is-admin returns false for non-admin", () => {
      const { result } = simnet.callReadOnlyFn(
        "glamora-nft",
        "is-admin",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(result).toBeBool(false);
    });

    it("is-caller-authorized returns true for authorized caller", () => {
      const { result } = simnet.callReadOnlyFn(
        "glamora-nft",
        "is-caller-authorized",
        [Cl.principal(deployer)],
        deployer
      );

      expect(result).toBeBool(true);
    });

    it("is-caller-authorized returns false for unauthorized caller", () => {
      const { result } = simnet.callReadOnlyFn(
        "glamora-nft",
        "is-caller-authorized",
        [Cl.principal(wallet2)],
        deployer
      );

      expect(result).toBeBool(false);
    });
  });

  describe("Collection Name Validation", () => {
    
    it("is-valid-collection-name returns true for valid name", () => {
      const { result } = simnet.callReadOnlyFn(
        "glamora-nft",
        "is-valid-collection-name",
        [Cl.stringUtf8("Summer Collection")],
        deployer
      );

      expect(result).toBeBool(true);
    });

    it("is-valid-collection-name returns false for empty name", () => {
      const { result } = simnet.callReadOnlyFn(
        "glamora-nft",
        "is-valid-collection-name",
        [Cl.stringUtf8("")],
        deployer
      );

      expect(result).toBeBool(false);
    });
  });

  describe("Collection Creation", () => {
    
    it("creates fashion collection successfully", () => {
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "create-fashion-collection",
        [
          Cl.stringUtf8("Summer 2024"),
          Cl.stringUtf8("Summer fashion collection"),
          Cl.uint(100) // max-editions
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1)); // Returns collection-id 1
    });

    it("increments collection ID after creation", () => {
      // Create first collection
      simnet.callPublicFn(
        "glamora-nft",
        "create-fashion-collection",
        [
          Cl.stringUtf8("First Collection"),
          Cl.stringUtf8("First"),
          Cl.uint(50)
        ],
        deployer
      );

      // Create second collection
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "create-fashion-collection",
        [
          Cl.stringUtf8("Second Collection"),
          Cl.stringUtf8("Second"),
          Cl.uint(75)
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(2)); // Second collection gets ID 2
    });

    it("fails with empty collection name", () => {
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "create-fashion-collection",
        [
          Cl.stringUtf8(""), // Empty name!
          Cl.stringUtf8("Description"),
          Cl.uint(100)
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(203)); // ERR-INVALID-COLLECTION-NAME
    });

    it("fails with empty description", () => {
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "create-fashion-collection",
        [
          Cl.stringUtf8("Collection Name"),
          Cl.stringUtf8(""), // Empty description!
          Cl.uint(100)
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(204)); // ERR-INVALID-INPUT
    });

    it("fails with max-editions below minimum (0)", () => {
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "create-fashion-collection",
        [
          Cl.stringUtf8("Invalid Collection"),
          Cl.stringUtf8("Has zero max editions"),
          Cl.uint(0) // Below MIN-COLLECTION-SIZE (1)
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(204)); // ERR-INVALID-INPUT
    });

    it("fails with max-editions above maximum (10,000)", () => {
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "create-fashion-collection",
        [
          Cl.stringUtf8("Too Large Collection"),
          Cl.stringUtf8("Exceeds maximum size"),
          Cl.uint(10001) // Above MAX-COLLECTION-SIZE (10,000)
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(204)); // ERR-INVALID-INPUT
    });

    it("accepts max-editions at minimum boundary (1)", () => {
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "create-fashion-collection",
        [
          Cl.stringUtf8("Minimum Collection"),
          Cl.stringUtf8("Has exactly 1 max edition"),
          Cl.uint(1) // MIN-COLLECTION-SIZE
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("accepts max-editions at maximum boundary (10,000)", () => {
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "create-fashion-collection",
        [
          Cl.stringUtf8("Maximum Collection"),
          Cl.stringUtf8("Has 10,000 max editions"),
          Cl.uint(10000) // MAX-COLLECTION-SIZE
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("only authorized caller can create collection", () => {
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "create-fashion-collection",
        [
          Cl.stringUtf8("Unauthorized Collection"),
          Cl.stringUtf8("Should fail"),
          Cl.uint(50)
        ],
        wallet1 // Not authorized!
      );

      expect(result).toBeErr(Cl.uint(202)); // ERR-NOT-AUTHORIZED
    });
  });

  describe("NFT Minting", () => {
    
    beforeEach(() => {
      // Create a collection before each mint test
      simnet.callPublicFn(
        "glamora-nft",
        "create-fashion-collection",
        [
          Cl.stringUtf8("Test Collection"),
          Cl.stringUtf8("For minting tests"),
          Cl.uint(100) // max-editions
        ],
        deployer
      );
    });

    it("mints NFT successfully", () => {
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "mint-fashion-nft",
        [
          Cl.uint(1), // collection-id
          Cl.principal(wallet1), // recipient
          Cl.stringUtf8("Fashion NFT #1"),
          Cl.stringUtf8("Beautiful dress design"),
          Cl.stringAscii("QmImageHash123"),
          Cl.none(), // animation-ipfs-hash
          Cl.none(), // external-url
          Cl.none()  // attributes-ipfs-hash
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1)); // Returns token-id 1
    });

    it("increments total NFTs minted", () => {
      // Mint first NFT
      simnet.callPublicFn(
        "glamora-nft",
        "mint-fashion-nft",
        [
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.stringUtf8("NFT #1"),
          Cl.stringUtf8("First NFT"),
          Cl.stringAscii("QmHash1"),
          Cl.none(),
          Cl.none(),
          Cl.none()
        ],
        deployer
      );

      // Check total
      const { result } = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-total-nfts-minted",
        [],
        deployer
      );

      expect(result).toBeUint(1);
    });

    it("mints multiple NFTs with sequential IDs", () => {
      // Mint first NFT
      const mint1 = simnet.callPublicFn(
        "glamora-nft",
        "mint-fashion-nft",
        [
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.stringUtf8("NFT #1"),
          Cl.stringUtf8("First"),
          Cl.stringAscii("QmHash1"),
          Cl.none(),
          Cl.none(),
          Cl.none()
        ],
        deployer
      );
      expect(mint1.result).toBeOk(Cl.uint(1));

      // Mint second NFT
      const mint2 = simnet.callPublicFn(
        "glamora-nft",
        "mint-fashion-nft",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.stringUtf8("NFT #2"),
          Cl.stringUtf8("Second"),
          Cl.stringAscii("QmHash2"),
          Cl.none(),
          Cl.none(),
          Cl.none()
        ],
        deployer
      );
      expect(mint2.result).toBeOk(Cl.uint(2));
    });

    it("mints NFT with all optional metadata", () => {
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "mint-fashion-nft",
        [
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.stringUtf8("Complete NFT"),
          Cl.stringUtf8("Has all metadata"),
          Cl.stringAscii("QmImageHash"),
          Cl.some(Cl.stringAscii("QmAnimationHash")), // animation
          Cl.some(Cl.stringAscii("https://glamora.fashion/nft/1")), // external-url
          Cl.some(Cl.stringAscii("QmAttributesHash")) // attributes
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("only collection creator can mint NFTs", () => {
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "mint-fashion-nft",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.stringUtf8("Unauthorized NFT"),
          Cl.stringUtf8("Should fail"),
          Cl.stringAscii("QmFail"),
          Cl.none(),
          Cl.none(),
          Cl.none()
        ],
        wallet1 // Not the collection creator!
      );

      expect(result).toBeErr(Cl.uint(202)); // ERR-NOT-AUTHORIZED
    });

    it("fails when minting to non-existent collection", () => {
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "mint-fashion-nft",
        [
          Cl.uint(999), // Non-existent collection!
          Cl.principal(wallet1),
          Cl.stringUtf8("NFT"),
          Cl.stringUtf8("Description"),
          Cl.stringAscii("QmHash"),
          Cl.none(),
          Cl.none(),
          Cl.none()
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(204)); // ERR-INVALID-INPUT
    });

    it("fails when exceeding max-editions", () => {
      // Create collection with max 2 editions
      simnet.callPublicFn(
        "glamora-nft",
        "create-fashion-collection",
        [
          Cl.stringUtf8("Small Collection"),
          Cl.stringUtf8("Only 2 NFTs allowed"),
          Cl.uint(2) // max-editions = 2
        ],
        deployer
      );

      // Mint first NFT
      simnet.callPublicFn(
        "glamora-nft",
        "mint-fashion-nft",
        [
          Cl.uint(2), // collection-id 2
          Cl.principal(wallet1),
          Cl.stringUtf8("NFT #1"),
          Cl.stringUtf8("First"),
          Cl.stringAscii("QmHash1"),
          Cl.none(),
          Cl.none(),
          Cl.none()
        ],
        deployer
      );

      // Mint second NFT
      simnet.callPublicFn(
        "glamora-nft",
        "mint-fashion-nft",
        [
          Cl.uint(2),
          Cl.principal(wallet2),
          Cl.stringUtf8("NFT #2"),
          Cl.stringUtf8("Second"),
          Cl.stringAscii("QmHash2"),
          Cl.none(),
          Cl.none(),
          Cl.none()
        ],
        deployer
      );

      // Try to mint third NFT (should fail)
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "mint-fashion-nft",
        [
          Cl.uint(2),
          Cl.principal(wallet3),
          Cl.stringUtf8("NFT #3"),
          Cl.stringUtf8("Third - exceeds limit"),
          Cl.stringAscii("QmHash3"),
          Cl.none(),
          Cl.none(),
          Cl.none()
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(204)); // ERR-INVALID-INPUT
    });
  });

  describe("SIP-009 Standard Functions", () => {
    
    beforeEach(() => {
      // Setup: Create collection and mint NFT
      simnet.callPublicFn(
        "glamora-nft",
        "create-fashion-collection",
        [
          Cl.stringUtf8("SIP-009 Test"),
          Cl.stringUtf8("Testing standard compliance"),
          Cl.uint(50)
        ],
        deployer
      );

      simnet.callPublicFn(
        "glamora-nft",
        "mint-fashion-nft",
        [
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.stringUtf8("Test NFT"),
          Cl.stringUtf8("For SIP-009 tests"),
          Cl.stringAscii("QmTestHash"),
          Cl.none(),
          Cl.none(),
          Cl.none()
        ],
        deployer
      );
    });

    it("get-last-token-id returns correct value", () => {
      const { result } = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-last-token-id",
        [],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("get-owner returns correct owner", () => {
      const { result } = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeOk(Cl.some(Cl.principal(wallet1)));
    });

    it("get-owner returns none for non-existent NFT", () => {
      const { result } = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-owner",
        [Cl.uint(999)],
        deployer
      );

      expect(result).toBeOk(Cl.none());
    });

    it("get-token-uri returns IPFS URI", () => {
      const { result } = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-token-uri",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeOk(Cl.some(Cl.stringAscii("ipfs://QmTestHash")));
    });

    it("get-token-uri returns none for non-existent NFT", () => {
      const { result } = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-token-uri",
        [Cl.uint(999)],
        deployer
      );

      expect(result).toBeOk(Cl.none());
    });
  });

  describe("NFT Transfer", () => {
    
    beforeEach(() => {
      // Setup: Create collection and mint NFT to wallet1
      simnet.callPublicFn(
        "glamora-nft",
        "create-fashion-collection",
        [
          Cl.stringUtf8("Transfer Test"),
          Cl.stringUtf8("For transfer tests"),
          Cl.uint(50)
        ],
        deployer
      );

      simnet.callPublicFn(
        "glamora-nft",
        "mint-fashion-nft",
        [
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.stringUtf8("Transferable NFT"),
          Cl.stringUtf8("Will be transferred"),
          Cl.stringAscii("QmTransfer"),
          Cl.none(),
          Cl.none(),
          Cl.none()
        ],
        deployer
      );
    });

    it("transfers NFT successfully", () => {
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "transfer",
        [
          Cl.uint(1), // token-id
          Cl.principal(wallet1), // sender (current owner)
          Cl.principal(wallet2) // recipient
        ],
        wallet1 // Must be called by current owner
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("updates owner after transfer", () => {
      // Transfer NFT
      simnet.callPublicFn(
        "glamora-nft",
        "transfer",
        [
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.principal(wallet2)
        ],
        wallet1
      );

      // Check new owner
      const { result } = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeOk(Cl.some(Cl.principal(wallet2)));
    });

    it("fails when non-owner tries to transfer", () => {
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "transfer",
        [
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.principal(wallet3)
        ],
        wallet2 // wallet2 is not the owner!
      );

      expect(result).toBeErr(Cl.uint(200)); // ERR-NOT-NFT-OWNER
    });

    it("fails when sender is not tx-sender", () => {
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "transfer",
        [
          Cl.uint(1),
          Cl.principal(wallet2), // Claiming to be wallet2
          Cl.principal(wallet3)
        ],
        wallet1 // But tx-sender is wallet1!
      );

      expect(result).toBeErr(Cl.uint(200)); // ERR-NOT-NFT-OWNER
    });

    it("allows multiple sequential transfers", () => {
      // First transfer: wallet1 -> wallet2
      simnet.callPublicFn(
        "glamora-nft",
        "transfer",
        [
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.principal(wallet2)
        ],
        wallet1
      );

      // Second transfer: wallet2 -> wallet3
      const { result } = simnet.callPublicFn(
        "glamora-nft",
        "transfer",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.principal(wallet3)
        ],
        wallet2
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify final owner
      const owner = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(owner.result).toBeOk(Cl.some(Cl.principal(wallet3)));
    });
  });

  describe("Edge Cases & Integration", () => {
    
    it("handles creating many collections", () => {
      // Create 5 collections
      for (let i = 1; i <= 5; i++) {
        const result = simnet.callPublicFn(
          "glamora-nft",
          "create-fashion-collection",
          [
            Cl.stringUtf8(`Collection ${i}`),
            Cl.stringUtf8(`Description ${i}`),
            Cl.uint(10)
          ],
          deployer
        );
        expect(result.result).toBeOk(Cl.uint(i));
      }

      // Verify next collection ID
      const nextId = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-next-collection-id",
        [],
        deployer
      );
      expect(nextId.result).toBeUint(6);
    });

    it("handles minting maximum editions correctly", () => {
      // Create collection with max 3 editions
      simnet.callPublicFn(
        "glamora-nft",
        "create-fashion-collection",
        [
          Cl.stringUtf8("Limited Edition"),
          Cl.stringUtf8("Only 3 pieces"),
          Cl.uint(3)
        ],
        deployer
      );

      // Mint 3 NFTs (should all succeed)
      for (let i = 1; i <= 3; i++) {
        const result = simnet.callPublicFn(
          "glamora-nft",
          "mint-fashion-nft",
          [
            Cl.uint(1),
            Cl.principal(wallet1),
            Cl.stringUtf8(`NFT #${i}`),
            Cl.stringUtf8(`Edition ${i}/3`),
            Cl.stringAscii(`QmHash${i}`),
            Cl.none(),
            Cl.none(),
            Cl.none()
          ],
          deployer
        );
        expect(result.result).toBeOk(Cl.uint(i));
      }

      // Try to mint 4th NFT (should fail)
      const failedMint = simnet.callPublicFn(
        "glamora-nft",
        "mint-fashion-nft",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.stringUtf8("NFT #4"),
          Cl.stringUtf8("Exceeds limit"),
          Cl.stringAscii("QmHash4"),
          Cl.none(),
          Cl.none(),
          Cl.none()
        ],
        deployer
      );
      expect(failedMint.result).toBeErr(Cl.uint(204));
    });

    it("demonstrates full collection lifecycle", () => {
      // 1. Create collection
      const collection = simnet.callPublicFn(
        "glamora-nft",
        "create-fashion-collection",
        [
          Cl.stringUtf8("Lifecycle Test"),
          Cl.stringUtf8("Full lifecycle"),
          Cl.uint(10)
        ],
        deployer
      );
      expect(collection.result).toBeOk(Cl.uint(1));

      // 2. Mint NFT
      const mint = simnet.callPublicFn(
        "glamora-nft",
        "mint-fashion-nft",
        [
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.stringUtf8("Lifecycle NFT"),
          Cl.stringUtf8("Full test"),
          Cl.stringAscii("QmLifecycle"),
          Cl.none(),
          Cl.none(),
          Cl.none()
        ],
        deployer
      );
      expect(mint.result).toBeOk(Cl.uint(1));

      // 3. Check owner
      const owner = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(owner.result).toBeOk(Cl.some(Cl.principal(wallet1)));

      // 4. Transfer NFT
      const transfer = simnet.callPublicFn(
        "glamora-nft",
        "transfer",
        [
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.principal(wallet2)
        ],
        wallet1
      );
      expect(transfer.result).toBeOk(Cl.bool(true));

      // 5. Verify new owner
      const newOwner = simnet.callReadOnlyFn(
        "glamora-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(newOwner.result).toBeOk(Cl.some(Cl.principal(wallet2)));
    });
  });
});
