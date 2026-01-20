;;=======================================
;; USDCX-TOKEN: Stable USD Payments for Glamora
;; Author: Timothy Terese Chimbiv
;;=======================================

;; THE REASON THIS EXISTS:
;; Nigerian creators face 30-40% currency swings. Most families can't plan when their earnings 
;; lose half their value overnight. Glamora offers choice; sBTC (Bitcoin volatility) 
;; or USDCx (USD stability). This testnet mock lets me test both payment rails.

;; TTHE TECHNICAL PART:
;; - SIP-010 compliant (its identical interface to mainnet Circle USDCx)
;; - 6 decimals (USDC standard: 1.00 = 1,000,000 micro-units)
;; - Mainnet migration = swap contract address only, zero code changes

;;=======================================
;; ERROR CODES 
;;=======================================

(define-constant ERR-NOT-AUTHORIZED (err u201)) ;; Stops theft - only token owners can move their funds
(define-constant ERR-INVALID-AMOUNT (err u202)) ;; Prevents zero transfers and user mistakes

;;=======================================
;; TOKEN
;;=======================================

(define-fungible-token usdcx) ;; This creates the entire USDCx economy blockchain tracks all balances

;;=======================================
;; MINT (Testnet Only)
;;=======================================
;; Production: Only Circle's bridge mints (when users deposit USDC from Ethereum)
;; Testnet: Unrestricted minting for payment testing without real money

(define-public (mint (amount uint) (recipient principal))
    (begin
        ;; no need to mint zero tokens that's waste of gas
        (asserts! (> amount u0) ERR-INVALID-AMOUNT) 

         ;; create tokens and credit recipient's wallet
        (try! (ft-mint? usdcx amount recipient))

        ;; confirm mint succeeded
        (ok true) 
    )
)

;; TRANSFER USDCx BETWEEN WALLETS
;; Identical to sBTC transfer but for USDCx (stable dollar token)
;; USDCx is pegged to USD so 1,000,000 microtokens = $1.00
;; Most Glamora users prefer USDCx because subscription prices stay stable
;;
;; AUTHORIZATION LOGIC:
;; We allow transfers if EITHER:
;;   1. tx-sender is the token owner (direct wallet-to-wallet transfer)
;;   2. contract-caller is the token owner (Glamora main contract calling on user's behalf)
;; This dual-check lets the main.clar contract process payments during tips/subscriptions
;; while still protecting against unauthorized transfers
;;
;; @param amount - how many USDCx microtokens to transfer (1,000,000 microtokens = $1.00)
;; @param sender - wallet address that owns the tokens being transferred
;; @param recipient - wallet address receiving the tokens
;; @param memo - optional note attached to transfer (not used currently, but standard SIP-010)
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
        ;; Can't transfer zero or negative amounts
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        
        ;; Security: only the token owner OR Glamora contract can initiate transfers
        ;; This prevents random contracts from stealing user funds
        (asserts! (or (is-eq tx-sender sender) (is-eq contract-caller sender)) ERR-NOT-AUTHORIZED)
        
        ;; Execute the actual token transfer using Clarity's built-in fungible token function
        (try! (ft-transfer? usdcx amount sender recipient))
        
        (ok true)
    )
)

;;=======================================
;; READ-ONLY FUNCTIONS
;;=======================================

;; Frontend will check this before allowing payments
(define-read-only (get-balance (account principal))
    (ok (ft-get-balance usdcx account)) 
)

;; readable name for wallets and explorers
(define-read-only (get-name)
    (ok "Circle USD") 
)

;; displays in wallet UI like "BTC" for Bitcoin
(define-read-only (get-symbol)
    (ok "USDCx") 
)

;; 6 decimals (not 8 like Bitcoin)
;; Examples: 5.00 USDCx = 5,000,000 | 0.10 USDCx = 100,000
(define-read-only (get-decimals)
    (ok u6) ;; USDC standard, if we get this wrong it will break the payment math
)

;; this shows total USDCx minted across all wallets
(define-read-only (get-total-supply)
    (ok (ft-get-supply usdcx)) 
)

;; the official USDC info displayed in block explorers
(define-read-only (get-token-uri)
    (ok (some u"https://www.circle.com/en/usdc")) 
)
