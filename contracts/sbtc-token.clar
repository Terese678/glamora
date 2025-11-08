;;=======================================
;; title: sbtc-token
;; version: 3.0

;; summary: Mock sBTC Token, a testing tool for local development

;; description: This is a mock sBTC token contract I created for testing Glamora locally on my computer.
;; it works exactly like the real sBTC token you can transfer it between wallets, check balances, 
;; and use it for payments, but the tokens have no real value and only exist in my development environment.
;; I built this so I can test all the tipping, subscription, and NFT marketplace features without needing
;; to deploy to testnet or spend real money. The contract follows the SIP-010 fungible token standard,
;; which means it has the same interface as the actual sBTC contract. 
;; When I'm ready to launch Glamora for real users, I will cahnge this mock contract address for the real sBTC contract address,
;; and everything will work the same way but with actual Bitcoin-backed tokens.

;; author: "Timothy Terese Chimbiv"

(define-constant ERR-NOT-AUTHORIZED (err u1)) ;; 
(define-constant ERR-INVALID-AMOUNT (err u2)) ;; 

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

;; TRANSFER TOKENS BETWEEN WALLETS
;; this is the main function that makes all payments work on Glamora
;; when fans tip creators or buy subscriptions, this function moves the tokens from one wallet to another
;; i made sure it matches the real sBTC contract's interface so I can swap them seamlessly later
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
        ;; ensure the that amount is greater than zero
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        
        ;; first I check that the person calling this function is actually the sender
        ;; this prevents anyone from moving tokens they don't own
        (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
        
        ;; now I perform the actual transfer, moving tokens from sender to recipient
        ;; if this fails for any reason like insufficient balance, the whole transaction stops
        (try! (ft-transfer? sbtc amount sender recipient))
        
        ;; everything worked so return success
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
