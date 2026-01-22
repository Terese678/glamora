;;==============================================
;; BRIDGE-ADAPTER: this is the payment Intelligence for Glamora
;;==============================================

;; THE REASON THIS CONTRACT EXISTS:
;; creators lose money to gas fees when withdrawing small crypto payments.
;; 
;; THE PROBLEM:
;; a user in Lagos gets 20 tips of $3 each = $60 total
;; withdraws each tip separately = Pays $5 gas multiplied by 20 = $100 in fees
;; Result: user LOSES $40 trying to access her own money
;; 
;; OUR SOLUTION:
;; Creator vault system earnings accumulate until reaching $50 threshold
;; Then ONE withdrawal to Ethereum = ONE $5 gas fee = Keeps $55
;; Savings: $95 in gas fees avoided
;; 
;; WHAT THIS CONTRACT DOES:
;; 1. Tracks payment sources (bridge vs native)
;; 2. Creator vaults (accumulate earnings, batch withdrawals)
;; 3. Payment intents (save user intentions, execute when funded)
;; 4. Bridge deposit verification (proof of Ethereum transfers)

;;===============================
;; CONSTANTS
;;===============================

;; ERROR CODES
(define-constant ERR-NOT-AUTHORIZED (err u600))
(define-constant ERR-INVALID-AMOUNT (err u601))
(define-constant ERR-INVALID-TOKEN (err u602))
(define-constant ERR-VAULT-NOT-FOUND (err u603))
(define-constant ERR-INSUFFICIENT-BALANCE (err u604))
(define-constant ERR-INTENT-NOT-FOUND (err u605))
(define-constant ERR-INTENT-ALREADY-EXECUTED (err u606))
(define-constant ERR-DEPOSIT-NOT-FOUND (err u607))
(define-constant ERR-STORAGE-FAILED (err u608))
(define-constant ERR-INVALID-DATA (err u609))

;; PAYMENT SOURCE TYPES
(define-constant SOURCE-BRIDGE u1)     ;; Payment came from Ethereum bridge
(define-constant SOURCE-NATIVE u2)     ;; Payment came from Stacks wallet

;; PAYMENT INTENT TYPES
(define-constant INTENT-TIP u1)        ;; User wants to tip a post
(define-constant INTENT-SUBSCRIPTION u2) ;; User wants to subscribe

;; TOKEN TYPES
(define-constant TOKEN-SBTC u1)
(define-constant TOKEN-USDCX u2)

;; Default withdrawal threshold is $50 (50,000,000 microtokens)
;; Why $50? Balance between waiting too long vs withdrawing too early
(define-constant DEFAULT-WITHDRAWAL-THRESHOLD u50000000)

;; Nigerian Naira exchange rate: 1 USD = 1,500 Naira
;; In production, this would come from a price oracle
(define-constant USD-TO-NIGERIAN-NAIRA-RATE u1500)

;; CONTRACT REFERENCES
(define-constant STORAGE-CONTRACT .storage-v2)
(define-constant MAIN-CONTRACT .main)
(define-constant USDCX-CONTRACT .usdcx-token)

;;===============================
;; DATA VARIABLES
;;===============================

;; Tracks next intent ID to assign (starts at 1, increments forever)
(define-data-var next-intent-id uint u1)

;; Tracks next deposit ID to assign
(define-data-var next-deposit-id uint u1)

;;===============================
;; READ-ONLY HELPER FUNCTIONS
;;===============================

;; This shows what ID the next intent will get (for testing)
(define-read-only (get-next-intent-id)
    (var-get next-intent-id)
)

;; This shows what ID the next deposit will get (for testing)
(define-read-only (get-next-deposit-id)
    (var-get next-deposit-id)
)

;;===============================
;; PRIVATE HELPER FUNCTIONS
;;===============================

;; Checks if the caller is authorized to use this contract
;; Only main.clar can call most functions to prevent unauthorized access
(define-private (is-authorized)
    (is-eq contract-caller MAIN-CONTRACT)
)

;; Gets current intent ID and increases the counter for next time
;; Like a ticket dispenser: gives you #47, then sets next ticket to #48
(define-private (get-and-increment-intent-id)
    (let
        (
            (current-id (var-get next-intent-id))
        )
        ;; Save the new ID (current + 1) for next time
        (var-set next-intent-id (+ current-id u1))
        ;; Return the current ID to the caller
        current-id
    )
)

;; Gets current deposit ID and increases the counter
(define-private (get-and-increment-deposit-id)
    (let
        (
            (current-id (var-get next-deposit-id))
        )
        (var-set next-deposit-id (+ current-id u1))
        current-id
    )
)

;;===============================
;; PUBLIC FUNCTIONS - DATA QUERIES
;;===============================

;; Shows where a user's payments came from (bridge vs native)
;; Example: "You bridged $200 from Ethereum, used $50 from Stacks wallet"
(define-public (get-payment-source-stats (user principal))
    (ok (contract-call? .storage-v2 get-payment-source user))
)

;; thid shows creator's vault status: earnings, available balance, withdrawals
(define-public (get-vault-balance (creator principal))
    (ok (contract-call? .storage-v2 get-creator-vault creator))
)

;; this function looks up a specific payment intent by ID number
(define-public (get-intent-details (intent-id uint))
    (ok (contract-call? .storage-v2 get-payment-intent intent-id))
)

;; this function looks up a specific bridge deposit by ID
(define-public (get-deposit-details (deposit-id uint))
    (ok (contract-call? .storage-v2 get-bridge-deposit deposit-id))
)

;; this converts USDCx amount to Nigerian Naira value
;; and shows creators "You earned 75,000 Naira" instead of just "$50"
(define-read-only (calculate-nigerian-naira-value (usdcx-amount uint))
    (let
        (
            ;; Convert microtokens to actual USD (divide by 1,000,000)
            (usd-value (/ usdcx-amount u1000000))
            ;; Multiply by exchange rate to get Naira
            (nigerian-naira-value (* usd-value USD-TO-NIGERIAN-NAIRA-RATE))
        )
        nigerian-naira-value
    )
)

;; This will show creator's earnings in USDCx, USD, and Nigerian Naira
;; it proves the stability benefit vs volatile Bitcoin
(define-public (get-earnings-stability-report (creator principal))
    (ok (match (contract-call? .storage-v2 get-creator-vault creator)
        vault-data
            (let
                (
                    ;; Get microtoken values from vault
                    (total-earned-usdcx (get total-earned vault-data))
                    (available-usdcx (get available-balance vault-data))
                    ;; Convert to USD
                    (total-usd (/ total-earned-usdcx u1000000))
                    (available-usd (/ available-usdcx u1000000))
                    ;; Convert to Nigerian Naira
                    (total-nigerian-naira (* total-usd USD-TO-NIGERIAN-NAIRA-RATE))
                    (available-nigerian-naira (* available-usd USD-TO-NIGERIAN-NAIRA-RATE))
                )
                {
                    creator: creator,
                    total-earned-usdcx: total-earned-usdcx,
                    total-earned-usd: total-usd,
                    total-earned-nigerian-naira: total-nigerian-naira,
                    available-balance-usdcx: available-usdcx,
                    available-balance-usd: available-usd,
                    available-balance-nigerian-naira: available-nigerian-naira,
                    stability-message: "Your earnings stay stable at $1 = 1 USDCx, no 30-40% Bitcoin swings"
                }
            )
        ;; If vault doesn't exist, return zeros
        {
            creator: creator,
            total-earned-usdcx: u0,
            total-earned-usd: u0,
            total-earned-nigerian-naira: u0,
            available-balance-usdcx: u0,
            available-balance-usd: u0,
            available-balance-nigerian-naira: u0,
            stability-message: "Vault not found - create creator profile first"
        }
    ))
)

;;===============================
;; PUBLIC FUNCTIONS - PAYMENT SOURCE TRACKING
;;===============================

;; This function records where a payment came from (bridge or native)
;; It's called by main.clar after every tip or subscription payment
;; This helps creators understand their most committed supporters
(define-public (record-payment-source 
    (user principal) 
    (payment-amount uint) 
    (source-type uint))
    (let
        (
            ;; Get user's existing payment history or start fresh
            (existing-source (default-to 
                {
                    total-bridged: u0,
                    total-native: u0,
                    last-bridge-deposit: u0,
                    bridge-count: u0,
                    preferred-source: u0
                }
                (contract-call? .storage-v2 get-payment-source user)))
            
            ;; Add to bridged total if this was a bridge payment
            (new-total-bridged (if (is-eq source-type SOURCE-BRIDGE)
                                  (+ (get total-bridged existing-source) payment-amount)
                                  (get total-bridged existing-source)))
            
            ;; Add to native total if this was a native payment
            (new-total-native (if (is-eq source-type SOURCE-NATIVE)
                                 (+ (get total-native existing-source) payment-amount)
                                 (get total-native existing-source)))
            
            ;; Count how many times user has bridged
            (new-bridge-count (if (is-eq source-type SOURCE-BRIDGE)
                                 (+ (get bridge-count existing-source) u1)
                                 (get bridge-count existing-source)))
            
            ;; Figure out which source user prefers (whichever has higher total)
            (new-preferred-source (if (> new-total-bridged new-total-native) 
                                     SOURCE-BRIDGE 
                                     SOURCE-NATIVE))
        )
        
        ;; Only main.clar can call this
        (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
        
        ;; Source type must be valid
        (asserts! (or (is-eq source-type SOURCE-BRIDGE) 
                      (is-eq source-type SOURCE-NATIVE)) 
                  ERR-INVALID-DATA)
        
        ;; Save updated payment source data
        (unwrap! (contract-call? .storage-v2 update-payment-source
                    user
                    new-total-bridged
                    new-total-native
                    (if (is-eq source-type SOURCE-BRIDGE) 
                        stacks-block-height 
                        (get last-bridge-deposit existing-source))
                    new-bridge-count
                    new-preferred-source)
                ERR-STORAGE-FAILED)
        
        (ok true)
    )
)

;;===============================
;; PUBLIC FUNCTIONS - CREATOR VAULT SYSTEM
;;===============================

;; It creates a new vault for a creator when they join Glamora
;; The vault starts with zero balance and $50 default withdrawal threshold
(define-public (initialize-vault (creator principal))
    (let
        (
            ;; Check if vault already exists
            (existing-vault (contract-call? .storage-v2 get-creator-vault creator))
        )
        
        ;; Only main.clar can initialize vaults
        (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
        
        ;; Don't create duplicate vault
        (asserts! (is-none existing-vault) ERR-INVALID-DATA)
        
        ;; Create vault with all values starting at zero
        (unwrap! (contract-call? .storage-v2 update-creator-vault
                    creator
                    u0  ;; total-earned
                    u0  ;; available-balance
                    u0  ;; total-withdrawn
                    u0  ;; pending-withdrawal
                    DEFAULT-WITHDRAWAL-THRESHOLD  ;; $50 threshold
                    u0  ;; last-withdrawal-block
                    u0) ;; withdrawal-count
                ERR-STORAGE-FAILED)
        
        (ok true)
    )
)

;; This function adds money to creator's vault instead of sending directly
;; This is how we save gas fees - accumulate first, withdraw in bulk later
(define-public (deposit-to-vault (creator principal) (amount uint))
    (let
        (
            ;; Get creator's current vault data
            (vault-data (unwrap! (contract-call? .storage-v2 get-creator-vault creator) 
                                ERR-VAULT-NOT-FOUND))
            
            ;; Calculate new balances after adding this deposit
            (new-total-earned (+ (get total-earned vault-data) amount))
            (new-available-balance (+ (get available-balance vault-data) amount))
            
            ;; Check if vault reached withdrawal threshold
            (withdrawal-threshold (get withdrawal-threshold vault-data))
            (vault-ready-for-withdrawal (>= new-available-balance withdrawal-threshold))
            
            ;; If ready, flag the entire balance for withdrawal
            (new-pending-withdrawal (if vault-ready-for-withdrawal 
                                       new-available-balance 
                                       (get pending-withdrawal vault-data)))
        )
        
        ;; Only main.clar can deposit
        (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
        
        ;; Amount must be positive
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        
        ;; Update vault balances in storage
        (unwrap! (contract-call? .storage-v2 update-creator-vault
                    creator
                    new-total-earned
                    new-available-balance
                    (get total-withdrawn vault-data)
                    new-pending-withdrawal
                    withdrawal-threshold
                    (get last-withdrawal-block vault-data)
                    (get withdrawal-count vault-data))
                ERR-STORAGE-FAILED)
        
        ;; Log different message if vault hit threshold
(print (if vault-ready-for-withdrawal
    {
        event: "vault-ready-for-withdrawal",
        creator: creator,
        pending-amount: new-pending-withdrawal,
        deposit-amount: u0,
        new-balance: u0,
        threshold: withdrawal-threshold,
        message: "Vault reached $50 threshold! Ready to withdraw and save gas fees."
    }
    {
        event: "vault-deposit",
        creator: creator,
        pending-amount: u0,
        deposit-amount: amount,
        new-balance: new-available-balance,
        threshold: withdrawal-threshold,
        message: "Keep accumulating! Withdraw when vault hits threshold to save gas."
    }
))
        
        (ok true)
    )
)

;; This function updates vault balances after creator withdraws to Ethereum
;; and subtracts withdrawal amount and records the transaction
(define-public (complete-vault-withdrawal (creator principal) (withdrawal-amount uint))
    (let
        (
            ;; Get current vault data
            (vault-data (unwrap! (contract-call? .storage-v2 get-creator-vault creator) 
                                ERR-VAULT-NOT-FOUND))
            
            ;; Calculate balances after withdrawal
            (new-available-balance (- (get available-balance vault-data) withdrawal-amount))
            (new-total-withdrawn (+ (get total-withdrawn vault-data) withdrawal-amount))
            (new-withdrawal-count (+ (get withdrawal-count vault-data) u1))
        )
        
        ;; Only main.clar can process withdrawals
        (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
        
        ;; Check sufficient balance exists
        (asserts! (>= (get available-balance vault-data) withdrawal-amount) 
                  ERR-INSUFFICIENT-BALANCE)
        
        ;; Update vault in storage
        (unwrap! (contract-call? .storage-v2 update-creator-vault
                    creator
                    (get total-earned vault-data)  ;; Total earned never changes
                    new-available-balance
                    new-total-withdrawn
                    u0  ;; Reset pending withdrawal
                    (get withdrawal-threshold vault-data)
                    stacks-block-height  ;; Record when withdrawal happened
                    new-withdrawal-count)
                ERR-STORAGE-FAILED)
        
        (print {
            event: "vault-withdrawal-completed",
            creator: creator,
            withdrawal-amount: withdrawal-amount,
            remaining-balance: new-available-balance,
            total-withdrawals: new-withdrawal-count
        })
        
        (ok true)
    )
)

;; It lets creators customize their withdrawal threshold
;; The default is $50, but high-earners might prefer $100 or $200
(define-public (update-withdrawal-threshold (creator principal) (new-threshold uint))
    (let
        (
            (vault-data (unwrap! (contract-call? .storage-v2 get-creator-vault creator) 
                                ERR-VAULT-NOT-FOUND))
        )
        
        ;; Only the creator themselves can update their threshold
        (asserts! (is-eq tx-sender creator) ERR-NOT-AUTHORIZED)
        
        ;; Minimum threshold is $10 to prevent gas fee losses
        (asserts! (>= new-threshold u10000000) ERR-INVALID-AMOUNT)
        
        ;; Update vault with new threshold
        (unwrap! (contract-call? .storage-v2 update-creator-vault
                    creator
                    (get total-earned vault-data)
                    (get available-balance vault-data)
                    (get total-withdrawn vault-data)
                    (get pending-withdrawal vault-data)
                    new-threshold  ;; Only this changes
                    (get last-withdrawal-block vault-data)
                    (get withdrawal-count vault-data))
                ERR-STORAGE-FAILED)
        
        (ok true)
    )
)

;;===============================
;; PUBLIC FUNCTIONS - PAYMENT INTENT SYSTEM
;;===============================

;; Payment intent system saves user's intention to tip when they don't have funds yet
;; User wants to tip $5 but has no USDCx - we save it and execute later
(define-public (create-tip-intent 
    (user principal) 
    (creator principal) 
    (content-id uint) 
    (tip-amount uint) 
    (message (optional (string-utf8 128))))
    (let
        (
            ;; Get next available intent ID
            (intent-id (get-and-increment-intent-id))
        )
        
        ;; Only main.clar can create intents
        (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
        
        ;; Tip amount must be positive
        (asserts! (> tip-amount u0) ERR-INVALID-AMOUNT)
        
        ;; Save intent with all details
        (unwrap! (contract-call? .storage-v2 create-payment-intent
                    intent-id
                    user
                    INTENT-TIP
                    creator
                    tip-amount
                    (some content-id)  ;; Which post to tip
                    none  ;; No tier for tips
                    message
                    stacks-block-height)
                ERR-STORAGE-FAILED)
        
        (print {
            event: "tip-intent-created",
            intent-id: intent-id,
            user: user,
            creator: creator,
            content-id: content-id,
            amount: tip-amount,
            message: "Intent saved - will execute when user has sufficient USDCx"
        })
        
        ;; Return intent ID so user can track it
        (ok intent-id)
    )
)

;; Save the  user's intention to subscribe when they don't have funds yet
(define-public (create-subscription-intent 
    (user principal) 
    (creator principal) 
    (tier uint) 
    (subscription-price uint))
    (let
        (
            (intent-id (get-and-increment-intent-id))
        )
        
        ;; Only main.clar can create intents
        (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
        
        ;; Validate tier is Basic (1), Premium (2), or VIP (3)
        (asserts! (and (>= tier u1) (<= tier u3)) ERR-INVALID-DATA)
        
        ;; Subscription price must be positive
        (asserts! (> subscription-price u0) ERR-INVALID-AMOUNT)
        
        ;; Save subscription intent
        (unwrap! (contract-call? .storage-v2 create-payment-intent
                    intent-id
                    user
                    INTENT-SUBSCRIPTION
                    creator
                    subscription-price
                    none  ;; No content-id for subscriptions
                    (some tier)  ;; Which tier they want
                    none  ;; No message for subscriptions
                    stacks-block-height)
                ERR-STORAGE-FAILED)
        
        (print {
            event: "subscription-intent-created",
            intent-id: intent-id,
            user: user,
            creator: creator,
            tier: tier,
            price: subscription-price
        })
        
        (ok intent-id)
    )
)

;; This execute-payment-intent marks a payment intent as executed after processing
;; It prevents the same intent from being executed twice
(define-public (execute-payment-intent (intent-id uint))
    (let
        (
            ;; Get the intent details
            (intent-data (unwrap! (contract-call? .storage-v2 get-payment-intent intent-id) 
                                 ERR-INTENT-NOT-FOUND))
        )
        
        ;; Only main.clar can execute intents
        (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
        
        ;; Intent must not already be executed
        (asserts! (not (get executed intent-data)) ERR-INTENT-ALREADY-EXECUTED)
        
        ;; Mark intent as executed
        (unwrap! (contract-call? .storage-v2 mark-intent-executed 
                    intent-id 
                    stacks-block-height)
                ERR-STORAGE-FAILED)
        
        (print {
            event: "intent-executed",
            intent-id: intent-id,
            user: (get user intent-data),
            target: (get target intent-data),
            execution-block: stacks-block-height
        })
        
        (ok true)
    )
)

;;===============================
;; PUBLIC FUNCTIONS - BRIDGE DEPOSIT TRACKING
;;===============================

;; It records when USDCx bridges from Ethereum to Stacks
;; and saves Ethereum transaction hash as proof the bridge happened
(define-public (record-bridge-deposit 
    (user principal) 
    (amount uint) 
    (ethereum-transaction-hash (buff 32)))
    (let
        (
            (deposit-id (get-and-increment-deposit-id))
        )
        
        ;; Only authorized contracts can record deposits
        (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
        
        ;; Amount must be positive
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        
        ;; Save deposit with Ethereum tx hash as proof
        (unwrap! (contract-call? .storage-v2 save-bridge-deposit
                    deposit-id
                    user
                    amount
                    ethereum-transaction-hash
                    stacks-block-height
                    true)  ;; Verified
                ERR-STORAGE-FAILED)
        
        (print {
            event: "bridge-deposit-recorded",
            deposit-id: deposit-id,
            user: user,
            amount: amount,
            ethereum-tx-hash: ethereum-transaction-hash,
            message: "USDCx bridged from Ethereum - ready to use in Glamora!"
        })
        
        (ok deposit-id)
    )
)

