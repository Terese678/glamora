;;=======================================
;; title: sbtc-token
;; version: 3.0

;; title: sbtc-token
;; version: 3.0

;; summary: Mock sBTC Token for Testnet Development

;; description: this is a mock sBTC token contract deployed on Stacks testnet for testing Glamora.
;; It works exactly like the real sBTC token - you can transfer it between wallets, check balances, 
;; and use it for payments, but the tokens have no real value and only exist for testing purposes.
;; This allows testing of all tipping, subscription, and NFT marketplace features on testnet
;; without needing real Bitcoin-backed tokens. The contract follows the SIP-010 fungible token standard,
;; which means it has the same interface as the actual sBTC contract.
;; When Glamora launches on mainnet, this mock contract address will be replaced with the real 
;; sBTC contract address, and everything will work the same way but with actual Bitcoin-backed tokens.
;;
;; Deployed on: Stacks Testnet
;; Contract Address: STC5KHM41H6WHAST7MWWDD807YSPRQKJ68T330BQ.sbtc-token

;; author: "Timothy Terese Chimbiv"

(define-constant ERR-NOT-AUTHORIZED (err u101)) ;; 
(define-constant ERR-INVALID-AMOUNT (err u102)) ;; 
(define-constant ERR-TRANSFER-FAILED (err u103))

;;===============================================
;; FUNGIBLE TOKEN DEFINITION
;;===============================================

;; test token defination called 'sbtc'
;; this creates the foundation for all the token operations below
(define-fungible-token sbtc)

;;===============================================
;; PUBLIC FUNCTIONS
;;===============================================

;; MINT TEST TOKENS
;; I use this function to create tokens for testing purposes
;; in production this won't exist since real sBTC is backed by actual Bitcoin
;; but for testing i need a way to give myself and test users tokens to work with
;; i just specify how many tokens to create and which wallet should receive them
(define-public (mint (amount uint) (recipient principal))
    (begin
        ;; ensure that amount is greater than zero
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        
        ;; this built-in function creates the tokens and adds them to the recipient's balance
        (try! (ft-mint? sbtc amount recipient))
        
        ;; return success explicitly
        (ok true)
    )
)

;; TRANSFER sBTC BETWEEN WALLETS
;; This is the core function that powers all Glamora payments (tips, subscriptions, purchases)
;; When fans support creators, this moves sBTC from their wallet to the creator's wallet
;;
;; AUTHORIZATION LOGIC:
;; We allow transfers if EITHER:
;;   1. tx-sender is the token owner (direct wallet-to-wallet transfer)
;;   2. contract-caller is the token owner (Glamora main contract calling on user's behalf)
;; This dual-check lets the main.clar contract process payments during tips/subscriptions
;; while still protecting against unauthorized transfers
;;
;; @param amount - how many sBTC microtokens to transfer (1 sBTC = 100,000,000 microtokens)
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
        (try! (ft-transfer? sbtc amount sender recipient))
        
        (ok true)
    )
)

;;===============================================
;; READ-ONLY FUNCTIONS
;;===============================================

;; CHECK WALLET BALANCE
;; I use this to look up how many tokens any wallet has
;; it's helpful for checking if users have enough balance before they try to make a payment
(define-read-only (get-balance (account principal))
    ;; this looks up the balance and returns it
    ;; for example, if someone has half an sBTC, this returns 50000000 micro sBTC
    (ok (ft-get-balance sbtc account))
)

;; GET TOKEN NAME
;; I return the full name of my token here
;; wallets and block explorers use this to display the token properly to users
(define-read-only (get-name)
    (ok "Stacked Bitcoin")
)

;; GET TOKEN SYMBOL  
;; I return the short symbol that represents this token
;; it shows up next to amounts in wallets, like how you see "BTC" or "USD"
(define-read-only (get-symbol)
    (ok "sBTC")
)

;; GET DECIMAL PLACES
;; I specify that this token uses 8 decimal places just like Bitcoin
;; this means 1 sBTC equals 100,000,000 satoshis
;; wallets need this information to format amounts correctly
(define-read-only (get-decimals)
    (ok u8)
)
