;;==================================
;; title: main contract module

;; summary: glamora is a decentralized fashion social platform where creators share content and fashion 
;; enthusiasts discover trends, with direct cryptocurrency tipping and secure data storage in storage.clar

;; description: glamora is a vibrant fashion community where creativity meets direct support 
;; whether you're a fashion creator or fashion lover, this platform connects you with the global fashion world
;; 
;; For Fashion Creators: They join by creating a creator profile, then showcase their fashion expertise 
;; by posting photos and videos across 5 categories - Fashion Shows, Lookbooks, Tutorials, Behind-the-Scenes content,
;; and Reviews. They can share your amazing outfits, styling tips, design processes, or fashion insights.
;; They can also build their follower community and earn direct sBTC tips from fans who their work 
;; (you keep 95%, platform takes only 5%)
;;
;; For Fashion Enthusiasts: They can sign up as a public user to dive into the fashion world without creating content,
;; they can follow their favorite creators, discover emerging fashion trends, explore amazing outfits 
;; from shoes to accessories, and directly support creators they love by sending sBTC tips with personal messages
;; staying connected with the latest fashion styles and designs

;; Author: "Timothy Terese Chimbiv"
;;====================================

;;===============================
;; Constants
;;===============================

;; ERROR CODES - these constants will tell us when something goes wrong with any input information;

(define-constant ERR-INVALID-INPUT (err u301))          ;; happens when user gave us bad or wrong information
(define-constant ERR-USERNAME-TAKEN (err u302))         ;; Someone already has taken that username  
(define-constant ERR-PROFILE-EXISTS (err u303))         ;; this User has already created a profile
(define-constant ERR-PROFILE-NOT-FOUND (err u304))      ;; user's profile can't be found
(define-constant ERR-CONTENT-NOT-FOUND (err u305))      ;; content post can't be found
(define-constant ERR-TRANSFER-FAILED (err u306))        ;; sBTC payment didn't work
(define-constant ERR-ALREADY-FOLLOWING (err u307))      ;; Already following this person
(define-constant ERR-CANNOT-FOLLOW-SELF (err u308))     ;; Can't follow yourself, it is not allowed
(define-constant ERR-NOT-FOLLOWING (err u309))          ;; error if trying to unfollow someone you're not following
(define-constant ERR-UNFOLLOW-FAILED (err u310))       ;; When unfollow operation fails
(define-constant ERR-FOLLOW-FAILED (err u311))         ;; When follow operation fails
(define-constant ERR-STORAGE-FAILED (err u312))        ;; Storage contract failed to process the request
(define-constant ERR-UNAUTHORIZED (err u313))          ;; caller is not authorized to call a function
(define-constant ERR-INVALID-TIER (err u314))           ;; This when a user selects an invalid tier subscription 
(define-constant ERR-SUBSCRIPTION-ACTIVE (err u315))    ;; When user already has active subscription
(define-constant ERR-NO-SUBSCRIPTION (err u316))        ;; If the user has no active subscription  
(define-constant ERR-SUBSCRIPTION-EXPIRED (err u317))   ;; When user's subscription has expired
(define-constant ERR-INVALID-AMOUNT (err u318))        ;; error when tip or payment amount doesn't meet minimum requirements
(define-constant ERR-SUBSCRIPTION-CHECK-FAILED (err u318))
(define-constant ERR-VAULT-INIT-FAILED (err u320))     ;; When creator vault initialization fails

;; CONTRACT IDENTITY CONSTANT FOR TRANSFERS
;; it creates a contract principal that can properly receive tokens
(define-constant CONTRACT-ADDRESS (as-contract tx-sender))

;; Bridge-adapter contract reference for payment intelligence
(define-constant BRIDGE-ADAPTER .bridge-adapter)

;; Payment source types (matches bridge-adapter constants)
(define-constant SOURCE-BRIDGE u1)     ;; Payment came from Ethereum bridge
(define-constant SOURCE-NATIVE u2)     ;; Payment came from Stacks wallet

;; Platform fees
(define-constant PLATFORM-TIP-PERCENTAGE u5)          ;; platform keeps 5% of tips received from creators
(define-constant MARKETPLACE-FEE-PERCENTAGE u5)       ;; Marketplace fee percentage (5% platform fee on NFT sales)

(define-constant STORAGE-CONTRACT .storage-v3)

;; PAYMENT TOKEN CONTRACTS
;; These reference our deployed mock token contracts on testnet for dual-payment system

;; Mock sBTC token contract enables Bitcoin-based tips and subscriptions users who believe in Bitcoin 
;; can pay with this (volatile but potentially appreciating)
(define-constant SBTC-CONTRACT .sbtc-token)

;; Mock USDCx token contract also enables stable dollar payments users who need price stability 
;; can pay with this ($1 USD = 1 USDCx, no volatility)
;; perfect for Nigerian creators who can't afford 30-40% currency swings
(define-constant USDCX-CONTRACT .usdcx-token)

;; This will represent which payment token the user can chose
(define-constant TOKEN-SBTC u1)      ;; sBTC 
(define-constant TOKEN-USDCX u2)     ;; USDCx (stable $1 USD)

;; each token has a different minimum tip, this serves different types of supporters
;; supporters who believe in Bitcoin can tip 0.001 sBTC (~$100) while regular fans tip 0.50 USDCx ($0.50)
;; we have this because USDCx doesn't fluctuate like sBTC, so a $5 tip stays worth $5 instead of changing value
(define-constant MIN-TIP-SBTC u100000)        ;; 0.001 sBTC minimum tip (~$100)
(define-constant MIN-TIP-USDCX u500000)       ;; 0.50 USDCx minimum tip ($0.50) 

;; sBTC subscription prices
(define-constant BASIC-SUBSCRIPTION-PRICE u2000000)    ;; 0.02 sBTC per month
(define-constant PREMIUM-SUBSCRIPTION-PRICE u5000000) ;; 0.05 sBTC per month
(define-constant VIP-SUBSCRIPTION-PRICE u6000000)     ;; 0.06 sBTC per month

;; stable dollar alternative for USDCx subscription prices 
(define-constant BASIC-SUBSCRIPTION-PRICE-USDCX u5000000)    ;; 5.00 USDCx per month ($5)
(define-constant PREMIUM-SUBSCRIPTION-PRICE-USDCX u10000000) ;; 10.00 USDCx per month ($10)
(define-constant VIP-SUBSCRIPTION-PRICE-USDCX u15000000)     ;; 15.00 USDCx per month ($15)

;; NFT Collection Creation
(define-constant COLLECTION-CREATION-FEE u5000000)     ;; 0.05 sBTC to create collection (pay one time)

;; NFT Marketplace
(define-constant MIN-LISTING-PRICE u1000000)           ;; 0.01 sBTC minimum listing price

(define-constant SUBSCRIPTION-DURATION u4320)           ;; Subscription duration in blocks (approximately 30 days)
                                                        ;; Stacks, 144 blocks/day 144 multiply by 30 = 4,320 blocks

;; Subscription tiers
(define-constant TIER-BASIC u1)                        ;; Basic subscription tier
(define-constant TIER-PREMIUM u2)                      ;; Premium subscription tier  
(define-constant TIER-VIP u3)                          ;; VIP subscription tier

;; Content categories 
;; these are types of fashion content available on the platform 
(define-constant CATEGORY-FASHION-SHOW u1)            ;; category 1 for runway parades with models in dazzling outfits
(define-constant CATEGORY-LOOKBOOK u2)                ;; category 2 for awesome photo collections, photo album with nice style snapshots
(define-constant CATEGORY-TUTORIAL u3)                ;; category 3 educational fashion videos how fashion is made, how to make dress 
(define-constant CATEGORY-BEHIND-SCENES u4)           ;; category 4 showing how the fashionists do what they do 
(define-constant CATEGORY-REVIEW u5)                  ;; category 5 talking about fashion clothes or accessories, product review

;; NFT Royalty percentage paid to original creator on every secondary sale
(define-constant ROYALTY-PERCENTAGE u8)   ;; 8% to original creator forever

;;=================================
;; Data Variables 
;;=================================

;; This counts how many people joined our fashion platform. The number goes up by one anytime someone makes a profile
;; tracking user growth
(define-data-var total-users uint u0)

;; This counts how many fashion pictures or videos people shared
;; This scoreboard starts at 0 and goes up by 1 every time someone posts something, 
;; like a photo of a cool outfit. If 5 posts are made, it is u5
(define-data-var total-content uint u0)

;; Next-content-id assigns unique IDs for posts, ensuring traceability. This starts at (u1) for the first post so the first post gets #1
;; after a post is made, it goes up to u2, then u3, and so on. 
(define-data-var next-content-id uint u1)

;; This counts how many times people sent money tips to creators
;; This scoreboard starts at 0 and goes up by 1 every time someone sends a tip (like giving a small gift of sBTC) 
;; If 20 tips are sent, it is u20
(define-data-var total-tips-sent uint u0)

;; This counts the money the app earns to keep running
;; It tracks how much sBTC the app earns from fees
(define-data-var platform-fees-earned uint u0)

;; This will track total active subscriptions across the platform
(define-data-var total-active-subscriptions uint u0)

;; This will keep track of total subscription revenue earned by platform
(define-data-var total-subscription-revenue uint u0)

;; Track total NFT listings on the marketplace
(define-data-var total-nft-listings uint u0)

;; this is to track total NFT sales completed
(define-data-var total-nft-sales uint u0)

;; it track total marketplace revenue from NFT sales
(define-data-var marketplace-revenue uint u0)

;; The storage-contract links to STORAGE.clar for secure data storage which is like a big warehouse 
;; where all the app data "profiles, posts, tips" is kept safe
(define-data-var storage-contract principal 'STPC6F6C2M7QAXPW66XW4Q0AGXX9HGAX6525RMF8.storage-v3)

;;===========================
;; Read-only Functions 
;;============================

;;===============================================
;; PLATFORM STATISTICS
;;===============================================

;; Get total users
(define-read-only (get-total-users) 
    (var-get total-users) ;; shows the number of users on the platform
)

;; Get total content
(define-read-only (get-total-content)
    (var-get total-content) 
) ;; get total content tracks fashion pictures or videos people shared in the app, if there are 5 posts, it show the 5 posts

;; Get next content ID
(define-read-only (get-next-content-id)
    (var-get next-content-id) ;; this will grab the number that the next post will get
)

;; Get total tips sent
(define-read-only (get-total-tips)
    (var-get total-tips-sent) ;; it grabs the total tips creators receieve
)

;; Get platform fees earned
(define-read-only (get-platform-fees-earned) 
    (var-get platform-fees-earned) ;; it goes into the apps bank to see how much it has earned
)

;;===============================================
;; NFT MARKETPLACE 
;;===============================================

;; Get total NFT listings
(define-read-only (get-total-nft-listings)
    (var-get total-nft-listings)
)

;; Get total NFT sales
(define-read-only (get-total-nft-sales)
    (var-get total-nft-sales)
)

;; Get marketplace revenue
(define-read-only (get-marketplace-revenue)
    (var-get marketplace-revenue)
)

;; Get NFT listing details
(define-public (get-nft-listing (token-id uint))
   (ok (contract-call? .storage-v3 get-nft-listing token-id))
)

;; Check if NFT is listed
(define-public (is-nft-listed (token-id uint))
    (ok (is-some (contract-call? .storage-v3 get-nft-listing token-id)))
)

;; Get all active listings for a seller
;; Returns: (response (list of active NFT listings) uint)
;; This function retrieves all NFTs currently listed for sale by a specific seller from the storage contract
(define-public (get-seller-listings (seller principal))
    (ok (contract-call? .storage-v3 get-seller-active-listings seller))
)

;; Get marketplace statistics
;; this function returns marketplace specific information, for a user interacting on the NFT marketplace
(define-read-only (get-marketplace-stats)
    {
        total-listings: (var-get total-nft-listings),
        total-sales: (var-get total-nft-sales),
        marketplace-revenue: (var-get marketplace-revenue),
        marketplace-fee-percentage: MARKETPLACE-FEE-PERCENTAGE,
        min-listing-price: MIN-LISTING-PRICE
    }
)

;; Get the total subscriptions on platform
(define-read-only (get-total-active-subscriptions)
    (var-get total-active-subscriptions)
)

;; Get total subscription revenue that's been earned by platform
(define-read-only (get-total-subscription-revenue)
    (var-get total-subscription-revenue)
)

;; This shows us where the app stores all our fashion stuff
(define-read-only (get-storage-contract) 
    (var-get storage-contract)
)

;; Get the total platform statistics all in one call
(define-read-only (get-platform-stats)
    {
        total-users: (var-get total-users),
        total-content: (var-get total-content),
        next-content-id: (var-get next-content-id),
        total-tips-sent: (var-get total-tips-sent),
        platform-fees-earned: (var-get platform-fees-earned),
        total-active-subscriptions: (var-get total-active-subscriptions), 
        total-subscription-revenue: (var-get total-subscription-revenue), 
        total-nft-listings: (var-get total-nft-listings),                   ;; total NFTs currently listed for sale
        total-nft-sales: (var-get total-nft-sales),                         ;; total NFTs sold on the marketplace
        marketplace-revenue: (var-get marketplace-revenue),                 ;; total sBTC earned from marketplace fees (5%)
        payment-token: "sBTC",  ;; This shows that all money on the platform is in sBTC  (Stacked Bitcoin)
        all-amounts-in-satoshis: true  ;; Tells the user all numbers are in satoshis (100,000,000 sats = 1 sBTC)
    }
)

;;===============================================
;; USER & PROFILE LOOKUPS
;;===============================================

;; Get total followers for a user
;; Returns: (response uint uint) - the follower count or an error
;; This function retrieves the follower count from a creator's profile in the storage contract
(define-public (get-total-followers (user principal))
    (match (contract-call? .storage-v3 get-creator-profile user) 
        profile (ok (get follower-count profile)) 
        (err ERR-PROFILE-NOT-FOUND))
)

;; Let's us look up a creator profile. It will fetch data from storage, this ensures modularity
;; Returns: (response (optional creator-profile) uint)
;; It asks the storage.clar contract to show a user profile like their username, bio, using their wallet address as a special ID
(define-public (get-creator-profile (user principal)) 
    (ok (contract-call? .storage-v3 get-creator-profile user))
)

;; Let's look up a public user profile
;; Returns: (response (optional public-user-profile) uint)
;; This retrieves the public profile information for any user from the storage contract
(define-public (get-public-user-profile (user principal))
    (ok (contract-call? .storage-v3 get-public-user-profile user))
)

;; Let's retrieves the owner (principal) of a username from storage
;; Returns: (response (optional principal) uint)
;; This looks up which wallet address owns a specific username
(define-public (get-username-owner (username (string-ascii 32)))
    (ok (contract-call? .storage-v3 get-username-owner username))
)

;;===============================================
;; CONTENT LOOKUPS
;;===============================================

;; Let's check out the details of a picture or video
;; Returns: (response (optional content-record) uint)
;; This asks Storage.clar for info about a post like its title, creator, or category using its ID number like #3
(define-public (get-content-details (content-id uint))
    (ok (contract-call? .storage-v3 get-content-details content-id))
)

;; Let's look at the details of a money tip someone sent for a post
;; Returns: (response (optional tip-record) uint)
;; This asks our Storage.clar for info about a tip like how much Bitcoin or stablecoin was sent, 
;; and any nice message the tipper included. We find it by matching the post ID and the tipper's wallet address
(define-public (get-tip-details (content-id uint) (tipper principal))
    (ok (contract-call? .storage-v3 get-tip-history content-id tipper))
)

;;===============================================
;; SOCIAL FOLLOWING LOOKUPS
;;===============================================

;; Let's see if one person is following the other on the platform
;; Returns (response bool uint)
;; This checks in storage if one user (by their wallet address) is following another user,
;; like checking if two people are friends or connected in the app
(define-public (is-user-following (follower principal) (following principal)) 
    (ok (contract-call? .storage-v3 is-following follower following))
)

;; This will get our follow records from storage
;; Returns: (response (optional follow-record) uint)
;; Retrieves the complete follow relationship data between two users
(define-public (get-follow-record (follower principal) (following principal))
    (ok (contract-call? .storage-v3 get-follow-record follower following))
)

;;===============================================
;; SUBSCRIPTION LOOKUPS
;;===============================================

;; Get the user's subscription details
;; we have to call the storage contract to retrieve the subscription details 
(define-public (get-user-subscription (user principal))
    (ok (contract-call? .storage-v3 get-user-subscription user))
)

;; @desc: check if "subscriber" currently has a valid (non-expired) subscription to the "specified creator"
;; Returns: (response bool uint)
;; This checks if a user has an active, non-expired subscription to a specific creator
;; @params:
;; - subscriber => principal (the user who might be subscribed)
;; - creator   => principal (the creator they might be subscribed to)
(define-public (has-active-subscription (subscriber principal) (creator principal))
    (ok (match (contract-call? .storage-v3 get-user-subscription subscriber)
        subscription-data 
            ;; Check if subscription exists, it is for this creator, and has not expired yet
            (and 
                (is-eq (get subscribed-to subscription-data) creator) ;; Check if they're subscribed to the RIGHT creator
                (is-subscription-active (get expiry-block subscription-data)) ;; Check if subscription has not expired yet
            )
        false ;; the none branch returns false when no subscription is found
    ))
)

;; Get all subscription tier prices and duration in one call
(define-read-only (get-tier-prices)
    {
        basic: BASIC-SUBSCRIPTION-PRICE,
        premium: PREMIUM-SUBSCRIPTION-PRICE,
        vip: VIP-SUBSCRIPTION-PRICE,
        duration: SUBSCRIPTION-DURATION
    }
)

;; Get the creator's subscription statistics
(define-public (get-creator-subscription-stats (creator principal))
    (ok (contract-call? .storage-v3 get-creator-subscription-stats creator))
)

;;===============================================
;; NFT & COLLECTION LOOKUPS
;;===============================================

;; @desc: This function bridges the main contract to the storage contract to fetch NFT metadata
;; We call our storage contract to fetch the NFT metadata providing it a token id
(define-public (get-nft-metadata (token-id uint))
    (ok (contract-call? .storage-v3 get-nft-metadata token-id))
)

;; Let's look up the details about a fashion collection
(define-public (get-collections-details (collection-id uint))
    (ok (contract-call? .storage-v3 get-collection-data collection-id))
) ;; this function will ask storage.clar for info about a collection like its name, 
;; creator, description using its ID number like #1, #2, #3


;; GET NFT MARKETPLACE STATISTICS
;; This function is temporarily disabled - read-only functions cannot make cross-contract calls in Clarity.
;; 
;; FIX PLAN (next iteration):
;; Convert to a public function that queries storage-v3 directly,
;; since storage-v3 already tracks total-nft-listings, total-nft-sales,
;; and marketplace-revenue. The NFT contract stats (total-nfts-minted,
;; next-collection-id) will be exposed via storage reads instead of
;; cross-contract calls.
;;
;; TODO: Rebuild as (define-public (get-nft-marketplace-stats)) in next iteration
;; GET NFT MARKETPLACE STATISTICS
;; @desc: This function shows you everything about the NFT marketplace on Glamora in one simple call
;;(define-read-only (get-nft-marketplace-stats)
   ;; {
     ;;   ;; This will check how many individual fashion NFTs exist on the platform
       ;; total-nfts: (contract-call? .glamora-nft-v2 get-total-nfts-minted),
        ;;next-collection-id: (contract-call? .glamora-nft-v2 get-next-collection-id),

        ;; AUTHORIZATION
        ;; The wallet address allowed to create new fashion collections
        ;;authorized-caller: (contract-call? .glamora-nft-v2 get-authorized-caller),
        
        ;; The wallet address of the person who owns and controls the NFT system
        ;;admin: (contract-call? .glamora-nft-v2 get-admin),

        ;; COLLECTION LIMITS
        ;; The smallest number of NFTs one can put in one collection
        ;; every fashion collection needs at least 1 item so we don't have empty collections
        ;;min-collection-size: u1,

        ;; The biggest number of NFTs allowed in one collection
        ;; max 10,000 items per collection to keep it manageable
        ;;max-collection-size: u10000,
 
        ;;collection-creation-fee: u5000000 ;; 0.05 sBTC
    ;;}
;;)
;; ==========================
;; This is what the flow looks like => user calls main, main queries storage, and storage returns the result for the user
;; ============================

;;=================================
;; Private Functions 
;;=================================

;; is-valid-category ensures valid content types
(define-private (is-valid-category (category uint))
    (and 
        (>= category CATEGORY-FASHION-SHOW) ;; has to be greater or equal to 1 (fashion-show)
        (<= category CATEGORY-REVIEW) ;; must be less than or eqaul to 5 (fashion reviews)
    )
)

;; Check if user has any type of profile (creator or public user)
;; @desc: I use this helper function to verify that someone has signed up on the platform before they can
;; perform actions like following others, tipping, or subscribing. It checks both profile types because
;; glamora has two kinds of users - creators who post content, and public users who just enjoy and support.
;; if either profile type exists, this returns true, otherwise false.
;; @params:
;; - user: The wallet address we're checking
(define-private (has-profile (user principal))
    ;; I check both the creator profile map AND the public user profile map
    ;; and if the user has either one they're considered registered
    ;; The 'or' means if EITHER check returns true, the whole function returns true
    (or (is-some (contract-call? .storage-v3 get-creator-profile user))
    (is-some (contract-call? .storage-v3 get-public-user-profile user)))
)

;; Calculates how much platform fee to take from a tip (5% of total tip amount)
(define-private (calculate-platform-fee (amount uint))
    (/ (* amount PLATFORM-TIP-PERCENTAGE) u100)
) ;; (amout x 5) divide by 100 = 5%

;; Calculate marketplace fee from sale price (5% of total)
(define-private (calculate-marketplace-fee (sale-price uint))
    (/ (* sale-price MARKETPLACE-FEE-PERCENTAGE) u100)
)

;; Validate NFT listing price meets minimum requirement
;; @desc: I use this to make sure people don't list NFTs for ridiculously low prices that might be mistakes
;; or spam. The minimum listing price is 0.01 sBTC which is 1000000 micro sBTC. This protects both sellers from
;; accidentally listing valuable NFTs too cheap, and keeps the marketplace quality high by preventing
;; spam listings for tiny amounts.
;; @params:
;; - price: The listing price in satoshis that someone wants to set for their NFT
;; @returns: true if price is at least 0.01 sBTC, false if it's less
(define-private (is-valid-listing-price (price uint))
    ;; I check if the proposed price is greater than or equal to our minimum (0.01 sBTC)
    ;; if someone tries to list for 0.005 sBTC, this returns false and prevents the listing
    (>= price MIN-LISTING-PRICE)
)

;; This function checks that tier level entered is between 1 and 3 for tier levels
(define-private (is-valid-tier (tier uint))
    (and (>= tier TIER-BASIC) (<= tier TIER-VIP))
)

;; @desc: This helper function tells us how much each subscription tier costs
;; I give it a tier number (1, 2, or 3) and it gives back the price
;; the function uses nested if statements to select the right price for each tier level
;; @param: tier - which is the subscription level the user wants (1=Basic, 2=Premium, 3=VIP)
(define-private (get-tier-price (tier uint))
    (if (is-eq tier TIER-BASIC)
        (ok BASIC-SUBSCRIPTION-PRICE)           ;; 0.02 sBTC per month
        (if (is-eq tier TIER-PREMIUM) 
            (ok PREMIUM-SUBSCRIPTION-PRICE)    ;; 0.05 sBTC per month
            (if (is-eq tier TIER-VIP)
                (ok VIP-SUBSCRIPTION-PRICE)    ;; 0.06 sBTC per month 
                ERR-INVALID-TIER                ;; if the tier is not valid then we get this error
            )
        )
    )
)

;; This is Glamora USDCx tier pricing, stable dollar alternative for fashion creator subscriptions
;; sBTC prices fluctuate with Bitcoin (expensive for most users), but USDCx stays stable at $5-$15
;; This dual-token approach lets fans choose: stability (USDCx) or Bitcoin exposure (sBTC)
;; Returns the monthly cost in USDCx based on tier (u1=Basic $5, u2=Premium $10, u3=VIP $15)
(define-private (get-tier-price-usdcx (tier uint))
    (if (is-eq tier TIER-BASIC)
        (ok BASIC-SUBSCRIPTION-PRICE-USDCX)           ;; 5.00 USDCx
        (if (is-eq tier TIER-PREMIUM) 
            (ok PREMIUM-SUBSCRIPTION-PRICE-USDCX)    ;; 10.00 USDCx
            (if (is-eq tier TIER-VIP)
                (ok VIP-SUBSCRIPTION-PRICE-USDCX)    ;; 15.00 USDCx
                ERR-INVALID-TIER
            )
        )
    )
)

;; Check if subscription is currently active (not expired)
(define-private (is-subscription-active (expiry-block uint))
    (> expiry-block stacks-block-height)
)

;; =====================================
;; PUBLIC FUNCTIONS 
;; =====================================
;; PROFILE MANAGEMENT

;; CREATE CREATOR PROFILE
;; This is like signing up on the platform  "you become a member" 
;; This function starts user journey, storing data securely via storage.clar

;; @desc 
;; - This function creates a new user profile on the platform making sure all information is correct
;; @param 
;; - username (string-ascii 32)  your unique username like "@dredgeclassics"
;; - display-name (string-utf8 32) your public name like "Timothy Terese Chimbiv"
;; - bio (string-utf8 256) tell people about yourself like "Fashion enthusiast from Abuja"
(define-public (create-creator-profile (username (string-ascii 32)) (display-name (string-utf8 32)) (bio (string-utf8 256)))
    (let
        (
            ;; Get current platform statistics so we can update them later
            (current-users (var-get total-users))
        )
        
        ;; Check the username is not already taken by another user
        (asserts! (is-none (contract-call? .storage-v3 get-username-owner username)) ERR-USERNAME-TAKEN) 

        ;; Check user doesn't already have a profile 
        (asserts! (is-none (contract-call? .storage-v3 get-creator-profile tx-sender)) ERR-PROFILE-EXISTS) 

        ;; SAVE THE DATA - by calling the storage contract
        (unwrap! (contract-call? .storage-v3 create-creator-profile tx-sender username display-name bio) ERR-STORAGE-FAILED)

        ;; UPDATE PLATFORM STATISTICS
        (var-set total-users (+ current-users u1))

        ;; INITIALIZE CREATOR VAULT
        ;; Create earnings vault for this new creator to accumulate tips and save gas fees
        ;; Vault starts with zero balance and $50 default withdrawal threshold
        (unwrap! (contract-call? .bridge-adapter initialize-vault tx-sender) ERR-VAULT-INIT-FAILED)

        ;; SUCCESS 
        (print {
            event: "profile-created",
            user: tx-sender,
            username: username,
            vault-initialized: true
        })

        (ok true)
    )
)

;; CREATE A NEW PUBLIC USER PROFILE
;; @desc
;; - Creates a profile for public users who can follow creators and send tips but don't create content
;; @param 
;; - username (string-ascii 32) your unique username like "@fashionfan"
;; - display-name (string-utf8 32) your public name like "Sarah Johnson"
;; - bio (string-utf8 256) tell people about yourself like "Fashion lover from Lagos"
(define-public (create-public-user-profile (username (string-ascii 32)) (display-name (string-utf8 32)) (bio (string-utf8 256)))
    (let
        (
            ;; Get current platform statistics so we can update them later
            (current-users (var-get total-users))
        )

        ;; Check the username is not already taken by another user
        (asserts! (is-none (contract-call? .storage-v3 get-username-owner username)) ERR-USERNAME-TAKEN) 

        ;; Check user doesn't already have a public profile
        (asserts! (is-none (contract-call? .storage-v3 get-public-user-profile tx-sender)) ERR-PROFILE-EXISTS)

        ;; Save the public user profile data by calling the storage contract
        (unwrap! (contract-call? .storage-v3 create-public-user-profile tx-sender username display-name bio) ERR-STORAGE-FAILED)

        ;; Update platform statistics - now, one more user so increment by one
        (var-set total-users (+ current-users u1))

        ;; Success - new public user has joined the platform
        (print {
            event: "public-profile-created",
            user: tx-sender,
            username: username,
            user-type: "public"
        })

        (ok true)
    )
)

;;===============================================
;; PROFILE UPDATE FUNCTIONS
;;===============================================

;; UPDATE CREATOR PROFILE
;; @desc: This function lets creators update their display name and bio
;; Username cannot be changed - it's permanent
;; @params:
;; - new-display-name: Updated display name (max 32 characters)
;; - new-bio: Updated bio text (max 256 characters)
(define-public (update-creator-profile 
    (new-display-name (string-utf8 32)) 
    (new-bio (string-utf8 256)))
    (begin
        ;; Make sure caller has a creator profile
        (asserts! (is-some (contract-call? .storage-v3 get-creator-profile tx-sender)) ERR-PROFILE-NOT-FOUND)
        
        ;; Call storage contract to update the profile
        (unwrap! (contract-call? .storage-v3 update-creator-profile 
                    tx-sender 
                    new-display-name 
                    new-bio) 
            ERR-STORAGE-FAILED)
        
        ;; Log the update event
        (print {
            event: "creator-profile-updated",
            user: tx-sender,
            display-name: new-display-name
        })
        
        (ok true)
    )
)

;; UPDATE PUBLIC USER PROFILE
;; @desc: This function lets public users update their display name and bio
;; Username cannot be changed - it's permanent
;; @params:
;; - new-display-name: Updated display name (max 32 characters)
;; - new-bio: Updated bio text (max 256 characters)
(define-public (update-public-user-profile 
    (new-display-name (string-utf8 32)) 
    (new-bio (string-utf8 256)))
    (begin
        ;; Make sure caller has a public user profile
        (asserts! (is-some (contract-call? .storage-v3 get-public-user-profile tx-sender)) ERR-PROFILE-NOT-FOUND)
        
        ;; Call storage contract to update the profile
        (unwrap! (contract-call? .storage-v3 update-public-user-profile 
                    tx-sender 
                    new-display-name 
                    new-bio) 
            ERR-STORAGE-FAILED)
        
        ;; Log the update event
        (print {
            event: "public-user-profile-updated",
            user: tx-sender,
            display-name: new-display-name
        })
        
        (ok true)
    )
)

;; =====================================
;; CONTENT PUBLISHING
;; =====================================

;; PUBLISH NEW FASHION CONTENT  
;; @desc: This function lets creators share their fashion posts on Glamora, whether it's runway shows,
;; lookbooks, tutorials, behind-the-scenes content, or product reviews. Each post gets a unique ID number
;; and is stored permanently on the blockchain.

;; IPFS INTEGRATION:
;; I've built this function to work with IPFS (InterPlanetary File System) for decentralized content storage.
;; The content-hash parameter is a unique fingerprint of the fashion photo or video, while the ipfs-hash
;; parameter stores the actual IPFS link where the file lives. This means the content isn't stored directly
;; on the blockchain (that would be expensive), but the blockchain keeps a permanent record pointing to
;; where the content is stored on IPFS. If you don't have an IPFS hash yet, you can pass 'none' and add it later.

;; @params:
;; - title: The title of your fashion post (max 64 characters)
;; - description: Tell people about your post, styling tips, inspiration, etc (max 256 characters)
;; - content-hash: A unique 32-byte fingerprint of your content file for verification
;; - ipfs-hash: The IPFS address where your actual photo/video is stored (optional, can be none)
;; - category: What type of content this is (1=Fashion Show, 2=Lookbook, 3=Tutorial, 4=Behind-the-Scenes, 5=Review)
(define-public (publish-content 
    (title (string-utf8 64)) 
    (description (string-utf8 256)) 
    (content-hash (buff 32)) 
    (ipfs-hash (optional (string-ascii 64))) 
    (category uint))
    (let
        (
            ;; I need to get the ID number that this new post will get
             ;; Posts are numbered sequentially: first post is #1, second is #2, etc.
            (content-id (var-get next-content-id))

            ;; I also need to know how many posts currently exist so I can update the counter
            (current-content-count (var-get total-content))

        )

        ;; VALIDATION CHECKS

        ;; First, I make sure the category number is valid (must be between 1 and 5)
        ;; If someone tries to use category 99, this will stop them
        (asserts! (is-valid-category category) ERR-INVALID-INPUT)

        ;; Most important: I verify this person is actually a registered creator on Glamora
        ;; Only creators can post content, public users can only view and support
        (asserts! (is-some (contract-call? .storage-v3 get-creator-profile tx-sender)) ERR-PROFILE-NOT-FOUND)
        
        ;; SAVE CONTENT TO STORAGE
        ;; I call the storage contract to permanently save all the post details
        ;; This includes the title, description, category, and both the content hash and IPFS link
        (unwrap! (contract-call? .storage-v3 create-content 
                    content-id
                    tx-sender
                    title
                    description
                    content-hash
                    ipfs-hash 
                    category
                ) 
            ERR-TRANSFER-FAILED
        )

        ;; UPDATE PLATFORM COUNTERS
  
        ;; I increment the total content counter by 1
        ;; If we had 100 posts before, now we have 101
        (var-set total-content (+ current-content-count u1))

         ;; I also increment the next content ID so the next post gets a new unique number
        ;; If this post got ID ##101 the next one will get ##102
        (var-set next-content-id (+ content-id u1))

        ;; LOG THE EVENT
        ;; I record that a new post was created so frontends and explorers can track it
        (print {
            event: "content-published",       ;; what type of event happened
            content-id: content-id,           ;; The post's unique ID number
            creator: tx-sender,               ;; Who created it
            category: category,               ;; What type of content is it
            title: title,
            ipfs: ipfs-hash     
        })

        ;; Return the new post's ID number so the creator knows what number their post got
        (ok content-id) 
    )
)

;; =====================================
;; TIPPING SYSTEM  
;; =====================================

;; SEND TIP TO CREATOR
;; @desc 
;; - This function enable fans support, tipping creators as a sign of appreciation for their content
;; Platform takes 5%, creator gets 95% of the tip
;; @params
;; - content-id uint
;; - tip amount uint
;; - message (string-utf8 128) 
(define-public (tip-creator 
    (content-id uint) 
    (tip-amount uint) 
    (message (string-utf8 128)) 
    (payment-token uint)) ;;  User chooses u1=sBTC or u2=USDCx
    (let
        (
            ;; Get the post details to find who created it and validate it exists
            (content-data (unwrap! (contract-call? .storage-v3 get-content-details content-id) ERR-CONTENT-NOT-FOUND))
            
            ;; Extract the creator's wallet address from the post data
            (creator (get creator content-data))
            
            ;; Calculate platform's 5% fee from the total tip amount
            (platform-fee (calculate-platform-fee tip-amount))
            
            ;; Calculate what the creator actually receives (95% of tip)
            (creator-amount (- tip-amount platform-fee))
        )
    
        ;; we'll do two validation checks, first
        ;; make sure payment token is valid (u1=sBTC or u2=USDCx)
        ;; this is our security to allow only valid tokens
        (asserts! (or (is-eq payment-token TOKEN-SBTC) 
                      (is-eq payment-token TOKEN-USDCX)) 
                  ERR-INVALID-INPUT)
        
        ;; secondly, Check minimum tip based on chosen token
        ;; sBTC minimum = 0.001 sBTC (~$100), USDCx minimum = 0.50 USDCx ($0.50)
        ;; if the tip amount is not up to the required amount it fails immediatly
        (asserts! (if (is-eq payment-token TOKEN-SBTC)
                      (>= tip-amount MIN-TIP-SBTC)
                      (>= tip-amount MIN-TIP-USDCX))
                  ERR-INVALID-AMOUNT)
        
        ;; Prevent users from tipping themselves
        (asserts! (not (is-eq tx-sender creator)) ERR-INVALID-INPUT)

        ;; PAYMENT PROCESSING
        ;; STEP 1: TRANSFER CREATOR'S 95% SHARE
        ;; Fan pays creator directly with their chosen token (sBTC or USDCx)
        ;; The creator gets 95% of the tip amount immediately
        ;; We check payment-token to know which token contract to call
        (if (is-eq payment-token TOKEN-SBTC)
            (try! (contract-call? .sbtc-token transfer 
                creator-amount 
                tx-sender
                creator 
                none))
            (try! (contract-call? .usdcx-token transfer 
                creator-amount 
                tx-sender
                creator 
                none))
        )
        
        ;; STEP 2: TRANSFER PLATFORM'S 5% FEE
        ;; Glamora platform keeps 5% to sustain operations
        ;; Fee goes to CONTRACT-ADDRESS where platform can withdraw later
        ;; Again using the same token type the fan chose to pay with
        (if (is-eq payment-token TOKEN-SBTC)
            (try! (contract-call? .sbtc-token transfer 
                platform-fee 
                tx-sender
                CONTRACT-ADDRESS 
                none))
            (try! (contract-call? .usdcx-token transfer 
                platform-fee 
                tx-sender
                CONTRACT-ADDRESS 
                none))
        )

        ;; STEP 3: DEPOSIT TO CREATOR VAULT (for USDCx only)
        ;; For USDCx tips, deposit to vault instead of direct transfer to save gas fees
        ;; sBTC tips go direct because Bitcoin holders prefer immediate access
        (if (is-eq payment-token TOKEN-USDCX)
            (unwrap! (contract-call? .bridge-adapter deposit-to-vault creator creator-amount) ERR-TRANSFER-FAILED)
            true  ;; For sBTC, skip vault deposit (already transferred directly)
        )

        ;; STEP 4: RECORD PAYMENT SOURCE
        ;; Track whether this payment came from bridge or native wallet
        ;; For now, we assume native (SOURCE-NATIVE = u2) since bridging isn't live yet
        ;; When xReserve launches, we'll detect bridge deposits automatically
        (unwrap! (contract-call? .bridge-adapter record-payment-source 
                    tx-sender 
                    tip-amount 
                    SOURCE-NATIVE) 
            ERR-TRANSFER-FAILED)

        ;; DATA RECORDING
        ;; Save tip details permanently in storage contract
        (unwrap! (contract-call? .storage-v3 record-tip 
                    content-id      ;; Which post was tipped
                    tx-sender       ;; Who sent the tip
                    creator         ;; Who received the tip
                    tip-amount      ;; Total amount tipped
                    message         ;; Message from tipper
                    payment-token   ;; Which token was used (u1=sBTC, u2=USDCx)
                ) 
            ERR-TRANSFER-FAILED
        )

        ;; PLATFORM STATISTICS UPDATE
        ;; Increment total tips counter by 1
        (var-set total-tips-sent (+ (var-get total-tips-sent) u1))
        
        ;; Add platform fee to total earnings
        (var-set platform-fees-earned (+ (var-get platform-fees-earned) platform-fee))

        ;; SUCCESS EVENT LOGGING
        ;; Record successful tip transaction for tracking
        (print {
            event: "tip-sent",                  ;; Event type identifier
            content-id: content-id,             ;; Which post was tipped
            tipper: tx-sender,                  ;; Who sent the tip
            creator: creator,                   ;; Who received the tip
            amount: tip-amount,                 ;; Total tip amount
            platform-fee: platform-fee,         ;; Platform's cut
            creator-received: creator-amount,    ;; Creator's actual payout
            payment-token: (if (is-eq payment-token TOKEN-SBTC) "sBTC" "USDCx") ;; this "if" statement here is a translator that translate specifies which token was used
        })

        (ok true)  ;; Return success status
    )
)

;; =====================================
;; SOCIAL FOLLOWING SYSTEM
;; =====================================

;; FOLLOW ANOTHER CONTENT CREATOR 
;; @desc 
;; - follow-user builds social connections
;; - following is completely FREE, just building friendships, global access
;; @params
;; - user-to-follow principal
(define-public (follow-user (user-to-follow principal))
    (begin
        ;; Make sure caller has a profile (either creator or public user)
        (asserts! (has-profile tx-sender) ERR-PROFILE-NOT-FOUND)

        ;; Make sure you're not trying to follow yourself
        (asserts! (not (is-eq tx-sender user-to-follow)) ERR-CANNOT-FOLLOW-SELF)

        ;; Ensure the person to follow exists
        (asserts! (has-profile user-to-follow) ERR-PROFILE-NOT-FOUND)

        ;; Make sure you're not already following this person
        (asserts! (not (contract-call? .storage-v3 is-following tx-sender user-to-follow)) ERR-ALREADY-FOLLOWING)

        ;; Create follow relationship
        (unwrap! (contract-call? .storage-v3 create-follow tx-sender user-to-follow) ERR-FOLLOW-FAILED)

        (print {
            event: "user-followed",
            follower: tx-sender,
            following: user-to-follow
        })

        (ok true)
    )
)

;; UNFOLLOW A USER  
;; @desc 
;; Unfollow-user removes social connections
;; @params
;; - user-to-unfollow
(define-public (unfollow-user (user-to-unfollow principal)) 
    (begin
        ;; Make sure you're actually following this person first
        (asserts! (contract-call? .storage-v3 is-following tx-sender user-to-unfollow) ERR-NOT-FOLLOWING)

        ;; If check passed and you're indeed following them we can proceed to remove the follow relationship
        (unwrap! (contract-call? .storage-v3 remove-follow tx-sender user-to-unfollow) ERR-UNFOLLOW-FAILED)

        (print {
            event: "user-unfollowed",
            follower: tx-sender,
            unfollowed: user-to-unfollow
        })

        (ok true) ;; return success to the user
    )
)

;; Susbscribe to creator
;; @desc
;; - This function lets fans subscribe to their favorite creators using sBTC
;; - Subscribers pay monthly fees and get premium benefits
;; - Platform takes 5% fee, creator gets 95% of subscription revenue
;; @params
;; - creator: The creator's wallet address to subscribe to
;; - tier: Subscription tier (1=Basic, 2=Premium, 3=VIP)
(define-public (subscribe-to-creator (creator principal) (tier uint) (payment-token uint))
    (let
        (
            ;; let's the subscription price based on tier and token choice
            (subscription-price (if (is-eq payment-token TOKEN-SBTC)
                                    (unwrap! (get-tier-price tier) ERR-INVALID-TIER)
                                    (unwrap! (get-tier-price-usdcx tier) ERR-INVALID-TIER)))
            
            ;; Calculate the platform fee (5% of subscription)
            (platform-fee (/ (* subscription-price u5) u100))
            
            ;; Calculate creator's share (95% of subscription)
            (creator-amount (- subscription-price platform-fee))
            
            ;; Calculate when subscription expires (current block + 30 days)
            (expiry-block (+ stacks-block-height SUBSCRIPTION-DURATION))
        )
        
        ;; Make sure subscriber has a profile (creator or public user)
        (asserts! (has-profile tx-sender) ERR-PROFILE-NOT-FOUND)
        
        ;; ensure the payment token is valid (u1=sBTC or u2=USDCx)
        (asserts! (or (is-eq payment-token TOKEN-SBTC) 
                      (is-eq payment-token TOKEN-USDCX)) 
                  ERR-INVALID-INPUT)

        ;; Make that the sure creator exists and has a creator profile
        (asserts! (is-some (contract-call? .storage-v3 get-creator-profile creator)) ERR-PROFILE-NOT-FOUND)
        
        ;; Prevent users from subscribing to themselves
        (asserts! (not (is-eq tx-sender creator)) ERR-INVALID-INPUT)
        
       ;; Check the user does not already have active subscription to this creator
        (asserts! (not (unwrap! (has-active-subscription tx-sender creator) ERR-SUBSCRIPTION-CHECK-FAILED)) ERR-SUBSCRIPTION-ACTIVE)    
        ;; PAYMENT PROCESSING
        ;; STEP 1: TRANSFER CREATOR'S 95% SHARE OF SUBSCRIPTION
        (if (is-eq payment-token TOKEN-SBTC)
            (try! (contract-call? .sbtc-token transfer 
                creator-amount 
                tx-sender
                creator
                none))
            (try! (contract-call? .usdcx-token transfer 
                creator-amount 
                tx-sender
                creator
                none))
        )
        
        ;; STEP 2: TRANSFER PLATFORM'S 5% SUBSCRIPTION FEE
        (if (is-eq payment-token TOKEN-SBTC)
            (try! (contract-call? .sbtc-token transfer 
                platform-fee 
                tx-sender
                CONTRACT-ADDRESS
                none))
            (try! (contract-call? .usdcx-token transfer 
                platform-fee 
                tx-sender
                CONTRACT-ADDRESS
                none))
        )

        ;; STEP 3: DEPOSIT TO CREATOR VAULT (for USDCx only)
        ;; For USDCx subscriptions, deposit to vault to save gas fees
        (if (is-eq payment-token TOKEN-USDCX)
            (unwrap! (contract-call? .bridge-adapter deposit-to-vault creator creator-amount) ERR-STORAGE-FAILED)
            true  ;; sBTC goes direct
        )

        ;; STEP 4: RECORD PAYMENT SOURCE
        ;; Track subscription payment source for analytics
        (unwrap! (contract-call? .bridge-adapter record-payment-source 
                    tx-sender 
                    subscription-price 
                    SOURCE-NATIVE) 
            ERR-STORAGE-FAILED)
        
        ;; Call the storage contract save subscription details 
        (unwrap! (contract-call? .storage-v3 create-subscription
                    tx-sender           ;; Who is subscribing
                    creator             ;; Who they're subscribing to
                    tier                ;; What tier they selected
                    subscription-price  ;; How much they paid
                    expiry-block        ;; When subscription expires
                    TIER-BASIC
                    TIER-PREMIUM
                    TIER-VIP
                ) 
            ERR-STORAGE-FAILED
        )
        
        ;; Increment total active subscriptions count
        (var-set total-active-subscriptions (+ (var-get total-active-subscriptions) u1))
        
        ;; Add subscription revenue to platform earnings
        (var-set total-subscription-revenue (+ (var-get total-subscription-revenue) subscription-price))
        
        ;; Record successful subscription creation for tracking
        (print {
            event: "subscription-created",
            subscriber: tx-sender,
            creator: creator,
            tier: tier,
            price: subscription-price,
            creator-received: creator-amount,
            platform-fee: platform-fee,
            expiry-block: expiry-block,
            payment-token: (if (is-eq payment-token TOKEN-SBTC) "sBTC" "USDCx")
        })
        
        (ok true)
    )
)

;; Cancel subscription
;; @desc
;; - This function lets users cancel their subscription to a creator
;; - there is absolutely no refund provided, but the subscription remains active until expiry date
;; @params: creator
(define-public (cancel-subscription (creator principal))
    (let
        (
            ;; Get current subscription details
            (subscription-data (unwrap! (contract-call? .storage-v3 get-user-subscription tx-sender) ERR-NO-SUBSCRIPTION))
        )
        
        ;; Make sure subscription is for the specified creator
        (asserts! (is-eq (get subscribed-to subscription-data) creator) ERR-NO-SUBSCRIPTION)
        
        ;; Ensure subscription is still active
        (asserts! (is-subscription-active (get expiry-block subscription-data)) ERR-SUBSCRIPTION-EXPIRED)
        
        ;; Remove the subscription from storage
        (unwrap! (contract-call? .storage-v3 cancel-subscription 
                    tx-sender
                    TIER-BASIC
                    TIER-PREMIUM
                    TIER-VIP
                ) 
            ERR-STORAGE-FAILED
        )
        
        ;; Decrease the total active subscriptions count by 1 to reflect the cancellation,
        ;; so to enable our platform's subscription statistics stay accurate
        (var-set total-active-subscriptions (- (var-get total-active-subscriptions) u1))
        
        ;; Record subscription cancellation for tracking
        (print {
            event: "subscription-cancelled",
            subscriber: tx-sender,
            creator: creator,
            cancelled-at: stacks-block-height
        })
        
        (ok true)
    )
)

;;===============================================
;; BRIDGE & VAULT FUNCTIONS
;;===============================================

;; Get creator's vault balance and earnings report
;; Shows total earned, available balance, and Nigerian Naira equivalent
(define-public (get-creator-vault-info (creator principal))
    (contract-call? .bridge-adapter get-earnings-stability-report creator)
)

;; Get payment source statistics for a user
;; Shows how much they've bridged vs used from native wallet
(define-public (get-user-payment-sources (user principal))
    (contract-call? .bridge-adapter get-payment-source-stats user)
)

;; Let creator update their vault withdrawal threshold
;; Default is $50, but high-earners might prefer $100 or $200
(define-public (set-vault-threshold (new-threshold uint))
    (contract-call? .bridge-adapter update-withdrawal-threshold tx-sender new-threshold)
)

;; Withdraw from creator vault to Ethereum
;; This would integrate with xReserve bridge when it launches
;; For now, this is a placeholder for the actual bridge integration
(define-public (withdraw-from-vault (withdrawal-amount uint))
    (begin
        ;; TODO: Integrate with xReserve bridge to transfer USDCx to Ethereum
        (unwrap! (contract-call? .bridge-adapter complete-vault-withdrawal 
                    tx-sender 
                    withdrawal-amount) 
            ERR-TRANSFER-FAILED)
        
        (print {
            event: "vault-withdrawal-initiated",
            creator: tx-sender,
            amount: withdrawal-amount,
            message: "Withdrawal completed - integrate xReserve bridge in production"
        })
        
        (ok true)
    )
)

;; CREATE NFT FASHION COLLECTION
;; @desc: This function lets fashion creators start their own digital fashion collection on glamora
;; Pay a 0.05 sBTC fee to create the collection
;; @params:
;; - collection-name: the name of your fashion collection
;; - description: tell people what your collection is about 
;; - max-editions: maximum number of NFTs this collection can have (minimum 1, maximum 10,000)
(define-public (create-nft-collection 
    (collection-name (string-utf8 32)) 
    (description (string-utf8 256)) 
    (max-editions uint)) 
    (begin
        ;; Make sure the person trying to create this collection is actually a registered creator
        (asserts! (is-some (contract-call? .storage-v3 get-creator-profile tx-sender)) ERR-PROFILE-NOT-FOUND)

        ;; Collect the 0.05 sBTC creation fee from the creator using sBTC token
        (unwrap! (contract-call? .sbtc-token transfer 
            COLLECTION-CREATION-FEE 
            tx-sender 
            CONTRACT-ADDRESS 
            none) 
            ERR-TRANSFER-FAILED)

        ;; Create the collection by calling the glamora-nft contract
        (unwrap! (contract-call? .glamora-nft-v2 create-fashion-collection 
            collection-name 
            description 
            max-editions) 
            ERR-STORAGE-FAILED)

        ;; Log the event
        (print {
            event: "collection-created",
            creator: tx-sender,
            collection-name: collection-name,
            fee-paid: COLLECTION-CREATION-FEE,
            payment-token: "sBTC"
        })

        (ok true)
    )
)

;;===============================================
;; NFT MARKETPLACE
;;===============================================

;; LIST NFT FOR SALE
;; @desc: This function puts an NFT up for sale on the Glamora marketplace.
;; The seller sets their price and the NFT becomes available for anyone to buy.
;; @params:
;; - token-id: The unique ID of the NFT you want to sell
;; - price: How much sBTC you want for it (minimum 0.01 sBTC)
(define-public (list-nft-for-sale (token-id uint) (price uint))
    (begin
        ;; Make sure the person listing owns this NFT
        (asserts! (is-eq (some tx-sender) 
            (unwrap! (contract-call? .glamora-nft-v2 get-owner token-id) ERR-TRANSFER-FAILED)) 
            ERR-UNAUTHORIZED)

        ;; Price must meet the minimum listing requirement (0.01 sBTC)
        (asserts! (is-valid-listing-price price) ERR-INVALID-AMOUNT)

        ;; Save the listing in storage
        (unwrap! (contract-call? .storage-v3 create-nft-listing 
            token-id 
            tx-sender 
            price) 
            ERR-STORAGE-FAILED)

        ;; Update total listings counter
        (var-set total-nft-listings (+ (var-get total-nft-listings) u1))

        (print {
            event: "nft-listed",
            token-id: token-id,
            seller: tx-sender,
            price: price
        })

        (ok true)
    )
)

;; CANCEL NFT LISTING
;; @desc: This function removes an NFT from the marketplace.
;; Only the seller who listed it can cancel the listing.
;; @params:
;; - token-id: The unique ID of the NFT to delist
(define-public (cancel-nft-listing (token-id uint))
    (let
        (
            ;; Get the listing details to verify ownership
            (listing-data (unwrap! 
                (contract-call? .storage-v3 get-nft-listing token-id) 
                ERR-CONTENT-NOT-FOUND))
        )

        ;; Only the person who listed it can cancel it
        (asserts! (is-eq tx-sender (get seller listing-data)) ERR-UNAUTHORIZED)

        ;; Remove the listing from storage
        (unwrap! (contract-call? .storage-v3 cancel-nft-listing token-id) ERR-STORAGE-FAILED)

        ;; Decrease total listings counter
        (var-set total-nft-listings (- (var-get total-nft-listings) u1))

        (print {
            event: "nft-listing-cancelled",
            token-id: token-id,
            seller: tx-sender
        })

        (ok true)
    )
)

;; BUY NFT
;; @desc: This is the core marketplace purchase function.
;; When someone buys an NFT, the payment splits three ways automatically:
;; - Original creator gets 8% royalty (forever, on every resale)
;; - Seller gets 87% of the sale price
;; - Platform keeps 5% to sustain operations
;; @params:
;; - token-id: The unique ID of the NFT to purchase
(define-public (buy-nft (token-id uint))
    (let
        (
            ;; Get listing details price and who is selling
            (listing-data (unwrap! 
                (contract-call? .storage-v3 get-nft-listing token-id) 
                ERR-CONTENT-NOT-FOUND))

            ;; Get royalty info who is the original creator
            (royalty-data (unwrap! 
                (contract-call? .storage-v3 get-nft-royalty token-id) 
                ERR-CONTENT-NOT-FOUND))

            ;; Extract key values
            (seller (get seller listing-data))
            (sale-price (get price listing-data))
            (original-creator (get creator royalty-data))

            ;; PAYMENT CALCULATIONS
            ;; Every sale splits three ways: creator royalty, seller share, platform fee
            (royalty-amount (/ (* sale-price ROYALTY-PERCENTAGE) u100))      ;; 8% to original creator
            (platform-fee (/ (* sale-price MARKETPLACE-FEE-PERCENTAGE) u100)) ;; 5% to platform
            (seller-amount (- sale-price (+ royalty-amount platform-fee)))    ;; 87% to seller
        )

        ;; Buyer cannot be the seller
        (asserts! (not (is-eq tx-sender seller)) ERR-INVALID-INPUT)

        ;; Listing must be active
        (asserts! (get active listing-data) ERR-INVALID-INPUT)

        ;; PAYMENT STEP 1: Pay original creator their 8% royalty
        ;; This is the magic of the royalty system creator earns forever
        (unwrap! (contract-call? .sbtc-token transfer
            royalty-amount
            tx-sender
            original-creator
            none)
            ERR-TRANSFER-FAILED)

        ;; PAYMENT STEP 2: Pay seller their 87% share
        (unwrap! (contract-call? .sbtc-token transfer
            seller-amount
            tx-sender
            seller
            none)
            ERR-TRANSFER-FAILED)

        ;; PAYMENT STEP 3: Pay platform its 5% fee
        (unwrap! (contract-call? .sbtc-token transfer
            platform-fee
            tx-sender
            CONTRACT-ADDRESS
            none)
            ERR-TRANSFER-FAILED)

        ;; TRANSFER THE NFT to the buyer
        (unwrap! (contract-call? .glamora-nft-v2 transfer
            token-id
            seller
            tx-sender)
            ERR-TRANSFER-FAILED)

        ;; Update royalty earnings record in storage
        (unwrap! (contract-call? .storage-v3 update-royalty-earnings
            token-id
            royalty-amount)
            ERR-STORAGE-FAILED)

        ;; Record the completed sale in storage
        (unwrap! (contract-call? .storage-v3 complete-nft-sale
            token-id
            tx-sender
            sale-price)
            ERR-STORAGE-FAILED)

        ;; Update platform statistics
        (var-set total-nft-sales (+ (var-get total-nft-sales) u1))
        (var-set total-nft-listings (- (var-get total-nft-listings) u1))
        (var-set marketplace-revenue (+ (var-get marketplace-revenue) platform-fee))
        (var-set platform-fees-earned (+ (var-get platform-fees-earned) platform-fee))

        (print {
            event: "nft-sold",
            token-id: token-id,
            seller: seller,
            buyer: tx-sender,
            sale-price: sale-price,
            royalty-paid: royalty-amount,
            royalty-recipient: original-creator,
            seller-received: seller-amount,
            platform-fee: platform-fee
        })

        (ok true)
    )
)