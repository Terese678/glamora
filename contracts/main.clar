;;==================================
;; title: main contract module

;; summary: glamora is a decentralized fashion social platform where creators share content and fashion 
;; lovers discover trends, with direct cryptocurrency tipping and secure data storage in storage.clar

;; description: glamora is a vibrant fashion community where creativity meets direct support 
;; whether you're a fashion creator or fashion lover, this platform connects you with the global fashion world
;; 
;; For Fashion Creators: They join by creating a creator profile, then showcase their fashion expertise 
;; by posting photos and videos across 5 categories - Fashion Shows, Lookbooks, Tutorials, Behind-the-Scenes content,
;; and Reviews. They can share their amazing outfits, styling tips, design processes, or fashion insights.
;; They can also build their follower community and earn direct sBTC tips from fans who like their work 
;; (you keep 95%, platform takes only 5%)
;;
;; For Fashion Enthusiasts: They can sign up as a public user without creating content
;; they can follow their favorite creators, discover emerging fashion trends, explore amazing outfits 
;; from shoes to accessories, and directly support creators they've picked interests in by sending sBTC tips with personal messages
;; staying connected with the latest fashion styles and designs

;; Version 3.0

;; Author: "Timothy Terese Chimbiv"
;;====================================

;;===============================
;; Constants
;;===============================

;; ERROR CODES - these contants will tell us when soemthing goes wrong with any input information

(define-constant ERR-INVALID-INPUT (err u1))          ;; happens when user gave us bad or wrong information
(define-constant ERR-USERNAME-TAKEN (err u2))         ;; Someone already has taken that username  
(define-constant ERR-PROFILE-EXISTS (err u3))         ;; this User has already created a profile
(define-constant ERR-PROFILE-NOT-FOUND (err u4))      ;; user's profile can't be found
(define-constant ERR-CONTENT-NOT-FOUND (err u5))      ;; content post can't be found
(define-constant ERR-TRANSFER-FAILED (err u6))        ;; sBTC payment didn't work
(define-constant ERR-ALREADY-FOLLOWING (err u7))      ;; Already following this person
(define-constant ERR-CANNOT-FOLLOW-SELF (err u8))     ;; Can't follow yourself, it is not allowed
(define-constant ERR-NOT-FOLLOWING (err u9))          ;; error if trying to unfollow someone you're not following
(define-constant ERR-UNFOLLOW-FAILED (err u10))       ;; When unfollow operation fails
(define-constant ERR-FOLLOW-FAILED (err u11))         ;; When follow operation fails
(define-constant ERR-STORAGE-FAILED (err u12))        ;; Storage contract failed to process the request
(define-constant ERR-UNAUTHORIZED (err u13))          ;; caller is not authorized to call a function
(define-constant ERR-NFT-NOT-LISTED (err u18))        ;; if the NFT is not listed for sale 
(define-constant ERR-NFT-ALREADY-LISTED (err u19))    ;; if the NFT is already listed
(define-constant ERR-INVALID-PRICE (err u20))         ;; price must be greater than 0
(define-constant ERR-BUYER-IS-SELLER (err u21))       ;; you cannot buy your own NFT
(define-constant ERR-INSUFFICIENT-FUNDS (err u22))    ;; when buyer does not have enough sBTC
(define-constant ERR-SBTC-TRANSFER-FAILED (err u23))  ;; triggers when sBTC transfer fails
(define-constant ERR-NFT-TRANSFER-FAILED (err u24))   ;; when NFT transfer fails during purchase
(define-constant ERR-NOT-NFT-OWNER (err u25))         ;; if the caller is not the owner of this NFT

;; CONTRACT IDENTITY CONSTANT FOR TRANSFERS
(define-constant CONTRACT-ADDRESS (as-contract tx-sender))

(define-constant ERR-INVALID-TIER (err u14))           ;; This happens when a user selects an invalid tier subscription 
(define-constant ERR-SUBSCRIPTION-ACTIVE (err u15))    ;; When user already has active subscription
(define-constant ERR-NO-SUBSCRIPTION (err u16))        ;; If the user has no active subscription  
(define-constant ERR-SUBSCRIPTION-EXPIRED (err u17))   ;; When user's subscription has expired

;; Platform fees
(define-constant PLATFORM-TIP-PERCENTAGE u5)          ;; platform keeps 5% of tips received from creators
(define-constant MARKETPLACE-FEE-PERCENTAGE u5)       ;; Marketplace fee percentage (5% platform fee on NFT sales)

;; sBTC token contract, local mock for testing
(define-constant SBTC-CONTRACT .sbtc-token) 

;;===============================================
;; PAYMENT AMOUNTS (in micro-sBTC, 1 sBTC = 100,000,000 micro-sBTC)
;;===============================================

(define-constant MIN-TIP-AMOUNT u100000)              ;; 0.001 sBTC 

(define-constant BASIC-SUBSCRIPTION-PRICE u2000000)    ;; 0.02 sBTC per month
(define-constant PREMIUM-SUBSCRIPTION-PRICE u5000000) ;; 0.05 sBTC per month
(define-constant VIP-SUBSCRIPTION-PRICE u6000000)     ;; 0.06 sBTC per month

;; NFT Collection Creation
(define-constant COLLECTION-CREATION-FEE u5000000)     ;; 0.05 sBTC to create collection, pay once and keep creating

;; NFT Marketplace
(define-constant MIN-LISTING-PRICE u1000000)           ;; 0.01 sBTC minimum listing price

(define-constant SUBSCRIPTION-DURATION u4320)           ;; Subscription duration in blocks (approximately 30 days)
                                                        ;; Stacks, 144 blocks/day 144 multiplied by 30 = 4,320 blocks

;; Subscription tiers
(define-constant TIER-BASIC u1)                        ;; Basic subscription tier
(define-constant TIER-PREMIUM u2)                      ;; Premium subscription tier  
(define-constant TIER-VIP u3)                          ;; VIP subscription tier

;; Content categories 
;; these are types of fashion content available on the platform 
(define-constant CATEGORY-FASHION-SHOW u1)            ;; category 1 for runway parades with models wearing captivating outfits
(define-constant CATEGORY-LOOKBOOK u2)                ;; category 2 for unique photo collections, photo album with nice style snapshots
(define-constant CATEGORY-TUTORIAL u3)                ;; category 3 educational fashion videos showing how fashion is made, how to make dress etc 
(define-constant CATEGORY-BEHIND-SCENES u4)           ;; category 4 showing how the fashionists do what they do 
(define-constant CATEGORY-REVIEW u5)                  ;; category 5 talking about fashion clothes or accessories, product review

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

;; Track total NFT sales completed
(define-data-var total-nft-sales uint u0)

;; Track total marketplace revenue from NFT sales
(define-data-var marketplace-revenue uint u0)

;; The storage-contract links to STORAGE.clar for secure data storage which is like a big warehouse 
;; where all the app data "profiles, posts, tips" is kept safe
(define-data-var storage-contract principal .storage)

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
(define-read-only (get-nft-listing (token-id uint))
    (contract-call? .storage get-nft-listing token-id)
)

;; Check if NFT is listed
(define-read-only (is-nft-listed (token-id uint))
    (is-some (contract-call? .storage get-nft-listing token-id))
)

;; Get all active listings for a seller
(define-read-only (get-seller-listings (seller principal))
    (contract-call? .storage get-seller-active-listings seller)
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

;; Get the total platform statistics 
;; this is the platform's dashboard, one function that shows all the data
(define-read-only (get-platform-stats)
    {
        total-users: (var-get total-users),                                ;; this is how many people have signed up, creators & fans
        total-content: (var-get total-content),                            ;; here is every runway video, lookbook, tutorial, total posts 
        next-content-id: (var-get next-content-id),                        ;; the ID that the next post will get. it starts at u1 and never repeats
        total-tips-sent: (var-get total-tips-sent),                        ;; total number of sBTC tips sent
        platform-fees-earned: (var-get platform-fees-earned),              ;; the 5% cut from tips & NFT sales
        total-active-subscriptions: (var-get total-active-subscriptions),  ;; this is how many fans are paying monthly right now
        total-subscription-revenue: (var-get total-subscription-revenue),  ;; total sBTC earned from Basic, Premium, VIP subscriptions
        total-nft-listings: (var-get total-nft-listings),                  ;; total NFTs currently listed for sale
        total-nft-sales: (var-get total-nft-sales),                        ;; total NFTs sold on the marketplace
        marketplace-revenue: (var-get marketplace-revenue),                ;; total sBTC earned from marketplace fees (5%)
        payment-token: "sBTC",  ;; This shows that all money on the platform is in sBTC  (Stacked Bitcoin)
        all-amounts-in-satoshis: true  ;; Tells the user all numbers are in satoshis (100,000,000 sats = 1 sBTC)
    }
)

;;===============================================
;; USER & PROFILE LOOKUPS
;;===============================================

;; Get total followers
;; the old version only checked for creator profiles which won't work for public users
;; but this version checks both creator and public users which is safe for everyone
;; I had to iterate because fans (public users) exist too, but they do not have followers
;; creators see real count, fans see 0, strangers will get an error 
(define-read-only (get-total-followers (user principal))
    (let
        (
            ;; let's try to find a creator profile
            (creator-profile (contract-call? .storage get-creator-profile user))
            
            ;; and if no creator profile, try public user
            (public-profile (contract-call? .storage get-public-user-profile user))
        )
        
        ;; if it's a creator return their real follower count
        (match creator-profile
            profile (ok (get follower-count profile))
            
            ;; If not a creator, then check if it's a public user they have 0 followers
            (match public-profile
                profile (ok u0)
                
                ;; if no profile at all, return error
                ERR-PROFILE-NOT-FOUND
            )
        )
    )
)

;; Let's us look up a creator profile. It will fetch data from storage
(define-read-only (get-creator-profile (user principal)) 
    (contract-call? .storage get-creator-profile user)
) ;; it will asks storage.clar contract to show a user profile like their username, bio, using their wallet address a special ID

;; Let's look up a public user profile
(define-read-only (get-public-user-profile (user principal))
    (contract-call? .storage get-public-user-profile user)
)

;; Let's retrieves the owner (principal) of a username from storage
(define-read-only (get-username-owner (username (string-ascii 32)))
    (contract-call? .storage get-username-owner username)
)

;;===============================================
;; CONTENT LOOKUPS
;;===============================================

;; Let's check out the details of a picture or video
(define-read-only (get-content-details (content-id uint))
    (contract-call? .storage get-content-details content-id)
) ;; this asks Storage.clar for info about a posts like its title, creator, or category using its ID number like #3

;; Let's look at the details of a money tip someone sent for a post
(define-read-only (get-tip-details (content-id uint) (tipper principal))
    (contract-call? .storage get-tip-history content-id tipper)
) ;; it will ask our Storage.clar for info about a tip like how much was sent or the message
;; for a specific post and tipper by wallet address

;;===============================================
;; SOCIAL FOLLOWING LOOKUPS
;;===============================================

;; Let's see if one person is following the other on the platform
(define-read-only (is-user-following (follower principal) (following principal)) 
    (contract-call? .storage is-following follower following)
) ;; it will go to the storage and check if one user by their wallet address is following another, 
;; like checking if two people are buddies in the app

;; This will get our follow records from storage
(define-read-only (get-follow-record (follower principal) (following principal))
    (contract-call? .storage get-follow-record follower following)
)

;;===============================================
;; SUBSCRIPTION LOOKUPS
;;===============================================

;; Get the user's subscription details
;; we have to call the storage contract to retrieve the subscription details 
(define-read-only (get-user-subscription (user principal))
    (contract-call? .storage get-user-subscription user)
)

;; @des: check if "subscriber" currently has a valid (non-expired) subscription to the "specified creator"
;; @params:
;; - subscriber => principal
;; - creator   => principal
(define-read-only (has-active-subscription (subscriber principal) (creator principal))
    (match (contract-call? .storage get-user-subscription subscriber)
        subscription-data 
            ;; Check if subscription exists, it is for this creator, and has not expired yet
            (and 
                (is-eq (get subscribed-to subscription-data) creator) ;; Check if they're subscribed to the RIGHT creator
                (is-subscription-active (get expiry-block subscription-data)) ;; Check if subscription has not expired yet
            )
        false ;; the none branch returns false when no subscription is found
    )
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
(define-read-only (get-creator-subscription-stats (creator principal))
    (contract-call? .storage get-creator-subscription-stats creator)
)

;;===============================================
;; NFT & COLLECTION LOOKUPS
;;===============================================

;; @desc: This function bridges the main contract to the storage contract to fetch NFT metadata
;; We call our storage contract to fetch the NFT metadata providing it a token id
(define-read-only (get-nft-metadata (token-id uint))
    (contract-call? .storage get-nft-metadata token-id)
)

;; Let's look up the details about a fashion collection
(define-read-only (get-collections-details (collection-id uint))
    (contract-call? .storage get-collection-data collection-id)
) ;; this function will ask storage.clar for info about a collection like its name, 
;; creator, description using its ID number like #1, #2, #3

;; GET NFT MARKETPLACE STATISTICS
;; @desc: This function shows you everything about the NFT marketplace on Glamora in one simple call
(define-read-only (get-nft-marketplace-stats)
    {
        ;; This will check how many individual fashion NFTs exist on the platform
        total-nfts: (contract-call? .glamora-nft get-total-nfts-minted),
        next-collection-id: (contract-call? .glamora-nft get-next-collection-id),

        ;; AUTHORIZATION
        ;; The wallet address allowed to create new fashion collections
        authorized-caller: (contract-call? .glamora-nft get-authorized-caller),
        
        ;; The wallet address of the person who owns and controls the NFT system
        admin: (contract-call? .glamora-nft get-admin),

        ;; COLLECTION LIMITS
        ;; The smallest number of NFTs one can put in one collection
        ;; every fashion collection needs at least 1 item so we don't have empty collections
        min-collection-size: u1,

        ;; The biggest number of NFTs allowed in one collection
        ;; max 10,000 items per collection to keep it manageable
        max-collection-size: u10000,
 
        collection-creation-fee: u5000000 ;; 0.05 sBTC
    }
)
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
    (or (is-some (contract-call? .storage get-creator-profile user))
    (is-some (contract-call? .storage get-public-user-profile user)))
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
        (asserts! (is-none (contract-call? .storage get-username-owner username)) ERR-USERNAME-TAKEN) 

        ;; Check user doesn't already have a profile 
        (asserts! (is-none (contract-call? .storage get-creator-profile tx-sender)) ERR-PROFILE-EXISTS) 

        ;; SAVE THE DATA - by calling the storage contract
        (unwrap! (contract-call? .storage create-creator-profile tx-sender username display-name bio) ERR-STORAGE-FAILED)

        ;; UPDATE PLATFORM STATISTICS
        (var-set total-users (+ current-users u1))

        ;; SUCCESS 
        (print {
            event: "profile-created",
            user: tx-sender,
            username: username
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
        (asserts! (is-none (contract-call? .storage get-username-owner username)) ERR-USERNAME-TAKEN) 

        ;; Check user doesn't already have a public profile
        (asserts! (is-none (contract-call? .storage get-public-user-profile tx-sender)) ERR-PROFILE-EXISTS)

        ;; Save the public user profile data by calling the storage contract
        (unwrap! (contract-call? .storage create-public-user-profile tx-sender username display-name bio) ERR-STORAGE-FAILED)

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
(define-public (publish-content (title (string-utf8 64)) (description (string-utf8 256)) (content-hash (buff 32)) (ipfs-hash (optional (string-ascii 64))) (category uint))
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
        (asserts! (is-some (contract-call? .storage get-creator-profile tx-sender)) ERR-PROFILE-NOT-FOUND)
        
        ;; SAVE CONTENT TO STORAGE
        ;; I call the storage contract to permanently save all the post details
        ;; This includes the title, description, category, and both the content hash and IPFS link
        (unwrap! (contract-call? .storage create-content 
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
(define-public (tip-creator (content-id uint) (tip-amount uint) (message (string-utf8 128)))
    (let
        (
            ;; Get the post details to find who created it and validate it exists
            (content-data (unwrap! (contract-call? .storage get-content-details content-id) ERR-CONTENT-NOT-FOUND))
            
            ;; Extract the creator's wallet address from the post data
            (creator (get creator content-data))
            
            ;; Calculate platform's 5% fee from the total tip amount
            (platform-fee (calculate-platform-fee tip-amount))
            
            ;; Calculate what the creator actually receives (95% of tip)
            (creator-amount (- tip-amount platform-fee))
        )
        
        ;; VALIDATION CHECKS

        ;; Ensure the tip meets minimum amount requirement (1 STX)
        (asserts! (>= tip-amount MIN-TIP-AMOUNT) ERR-INVALID-INPUT)
        
        ;; Prevent users from tipping themselves
        (asserts! (not (is-eq tx-sender creator)) ERR-INVALID-INPUT)

        ;; ;; SBTC PAYMENT PROCESSING

        ;; Transfer 95% of tip to the content creator using sBTC
        (unwrap! (contract-call? SBTC-CONTRACT transfer 
            creator-amount 
            tx-sender 
            creator 
            none)                    ;; the none parameter is for memo which is optional so (we pass none)
            ERR-TRANSFER-FAILED
        )
        
        ;; Transfer 5% platform fee to the contract using sBTC
        (unwrap! (contract-call? SBTC-CONTRACT transfer 
            platform-fee 
            tx-sender 
            CONTRACT-ADDRESS 
            none) 
            ERR-TRANSFER-FAILED
        )

        ;; DATA RECORDING
        ;; Save tip details permanently in storage contract
        (unwrap! (contract-call? .storage record-tip 
                    content-id      ;; Which post was tipped
                    tx-sender       ;; Who sent the tip
                    creator         ;; Who received the tip
                    tip-amount      ;; Total amount tipped
                    message         ;; Message from tipper
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
            payment-token: "sBTC"
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
        (asserts! (not (contract-call? .storage is-following tx-sender user-to-follow)) ERR-ALREADY-FOLLOWING)

        ;; Create follow relationship
        (unwrap! (contract-call? .storage create-follow tx-sender user-to-follow) ERR-FOLLOW-FAILED)

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
        (asserts! (contract-call? .storage is-following tx-sender user-to-unfollow) ERR-NOT-FOLLOWING)

        ;; If check passed and you're indeed following them we can proceed to remove the follow relationship
        (unwrap! (contract-call? .storage remove-follow tx-sender user-to-unfollow) ERR-UNFOLLOW-FAILED)

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
(define-public (subscribe-to-creator (creator principal) (tier uint))
    (let
        (
            ;; Get the subscription price for selected tier
            (subscription-price (unwrap! (get-tier-price tier) ERR-INVALID-TIER))
            
            ;; Calculate the platform fee (5% of subscription)
            (platform-fee (/ (* subscription-price u5) u100))
            
            ;; Calculate creator's share (95% of subscription)
            (creator-amount (- subscription-price platform-fee))
            
            ;; Calculate when subscription expires (current block + 30 days)
            (expiry-block (+ stacks-block-height SUBSCRIPTION-DURATION))
        )
        
        ;; Make sure subscriber has a profile (creator or public user)
        (asserts! (has-profile tx-sender) ERR-PROFILE-NOT-FOUND)
        
        ;; Make that the sure creator exists and has a creator profile
        (asserts! (is-some (contract-call? .storage get-creator-profile creator)) ERR-PROFILE-NOT-FOUND)
        
        ;; Prevent users from subscribing to themselves
        (asserts! (not (is-eq tx-sender creator)) ERR-INVALID-INPUT)
        
        ;; Check the user does not already have active subscription to this creator
        (asserts! (not (has-active-subscription tx-sender creator)) ERR-SUBSCRIPTION-ACTIVE)
        
        ;; Transfer 95% of subscription fee to creator using sBTC
        (unwrap! (contract-call? SBTC-CONTRACT transfer 
            creator-amount 
            tx-sender 
            creator 
            none) 
            ERR-TRANSFER-FAILED
        )
        
        ;; Transfer 5% platform fee to contract using sBTC
        (unwrap! (contract-call? SBTC-CONTRACT transfer 
            platform-fee 
            tx-sender 
            CONTRACT-ADDRESS 
            none) 
            ERR-TRANSFER-FAILED
        )
        
        ;; Call the storage contract save subscription details 
        (unwrap! (contract-call? .storage create-subscription
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
            payment-token: "sBTC"
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
            (subscription-data (unwrap! (contract-call? .storage get-user-subscription tx-sender) ERR-NO-SUBSCRIPTION))
        )
        
        ;; Make sure subscription is for the specified creator
        (asserts! (is-eq (get subscribed-to subscription-data) creator) ERR-NO-SUBSCRIPTION)
        
        ;; Ensure subscription is still active
        (asserts! (is-subscription-active (get expiry-block subscription-data)) ERR-SUBSCRIPTION-EXPIRED)
        
        ;; Remove the subscription from storage
        (unwrap! (contract-call? .storage cancel-subscription 
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
        (asserts! (is-some (contract-call? .storage get-creator-profile tx-sender)) ERR-PROFILE-NOT-FOUND)

        ;; Collect the 0.05 sBTC creation fee from the creator using sBTC token
        (unwrap! (contract-call? SBTC-CONTRACT transfer 
            COLLECTION-CREATION-FEE 
            tx-sender 
            CONTRACT-ADDRESS 
            none) 
            ERR-TRANSFER-FAILED)

        ;; Create the collection by calling the glamora-nft contract
        (unwrap! (contract-call? .glamora-nft create-fashion-collection 
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
;; NFT MARKETPLACE PUBLIC FUNCTIONS
;;===============================================

;; LIST FASHION NFT FOR SALE
;; @desc: this function let's a user List an NFT for sale on the marketplace using sBTC
;; and only the NFT owner is authorized to list their NFT
;; @params:
;; - token-id: the NFT ID to list
;; - price: the sale price in sBTC 
(define-public (list-fashion-nft (token-id uint) (price uint))
    (let
        (
            ;; get current NFT owner to verify ownership
            ;; here, we unwrap twice because get-owner returns data wrapped in two layers,
            ;; the first layer checks if the function call worked ok or err
            ;; the second layer checks if the NFT actually has an owner some or none
            ;; look at it like opening a box that has another box in it so you have open the 
            ;; outside layer to see what's in
            (nft-owner (unwrap! (unwrap! (contract-call? .glamora-nft get-owner token-id) 
                ERR-TRANSFER-FAILED) ERR-NOT-NFT-OWNER))
        )
        
        ;; VALIDATION CHECKS
        
        ;; ensure caller is the NFT owner
        (asserts! (is-eq tx-sender nft-owner) ERR-NOT-NFT-OWNER)
        
        ;; ensure NFT is not already listed
        (asserts! (not (is-nft-listed token-id)) ERR-NFT-ALREADY-LISTED)
        
        ;; ensure that the price meets minimum requirement
        (asserts! (is-valid-listing-price price) ERR-INVALID-PRICE)
        
        ;; CREATE LISTING IN STORAGE
        (unwrap! (contract-call? .storage create-nft-listing 
            token-id 
            tx-sender 
            price) 
            ERR-STORAGE-FAILED)
        
        ;; UPDATE PLATFORM STATISTICS
        (var-set total-nft-listings (+ (var-get total-nft-listings) u1))
        
        ;; LOG EVENT
        (print {
            event: "nft-listed",
            token-id: token-id,
            seller: tx-sender,
            price: price,
            listed-at: stacks-block-height
        })
        
        (ok true)
    )
)

;; PURCHASE FASHION NFT
;; @desc: this function let's you buy a listed NFT using sBTC
;; the platform takes only 5% fee, the seller receives 95%
;; @params:
;; - token-id: the NFT ID to purchase
(define-public (purchase-fashion-nft (token-id uint))
    (let
        (
            ;; get listing details
            (listing-data (unwrap! (contract-call? .storage get-nft-listing token-id) 
                ERR-NFT-NOT-LISTED))
            
            ;; extract listing information
            (seller (get seller listing-data))
            (sale-price (get price listing-data))
            
            ;; calculate fees and payouts
            (marketplace-fee (calculate-marketplace-fee sale-price))
            (seller-payout (- sale-price marketplace-fee))
        )
        
        ;; VALIDATION CHECKS
        
        ;; prevent buying your own NFT
        (asserts! (not (is-eq tx-sender seller)) ERR-BUYER-IS-SELLER)
        
        ;; ensure listing is still active
        (asserts! (get active listing-data) ERR-NFT-NOT-LISTED)
        
        ;; PROCESS SBTC PAYMENTS
        
        ;; transfer 95% to seller
        (unwrap! (contract-call? SBTC-CONTRACT transfer 
            seller-payout 
            tx-sender 
            seller 
            none) 
            ERR-SBTC-TRANSFER-FAILED)
        
        ;; transfer 5% marketplace fee to contract
        (unwrap! (contract-call? SBTC-CONTRACT transfer 
            marketplace-fee 
            tx-sender 
            CONTRACT-ADDRESS 
            none) 
            ERR-SBTC-TRANSFER-FAILED)
        
        ;; tRANSFER NFT TO BUYER
        (unwrap! (contract-call? .glamora-nft transfer 
            token-id 
            seller 
            tx-sender) 
            ERR-NFT-TRANSFER-FAILED)
        
        ;; COMPLETE SALE IN STORAGE
        (unwrap! (contract-call? .storage complete-nft-sale 
            token-id 
            tx-sender 
            sale-price) 
            ERR-STORAGE-FAILED)
        
        ;; UPDATE PLATFORM STATISTICS
        (var-set total-nft-sales (+ (var-get total-nft-sales) u1))
        (var-set marketplace-revenue (+ (var-get marketplace-revenue) marketplace-fee))
        (var-set total-nft-listings (- (var-get total-nft-listings) u1))
        
        ;; LOG EVENT
        (print {
            event: "nft-purchased",
            token-id: token-id,
            seller: seller,
            buyer: tx-sender,
            sale-price: sale-price,
            marketplace-fee: marketplace-fee,
            seller-received: seller-payout,
            purchased-at: stacks-block-height
        })
        
        (ok true)
    )
)

;; UNLIST FASHION NFT
;; @desc: this function will remove NFT from marketplace listing
;; only the seller can unlist their NFT
;; @params:
;; - token-id: The NFT ID to unlist
(define-public (unlist-fashion-nft (token-id uint))
    (let
        (
            ;; get listing details
            (listing-data (unwrap! (contract-call? .storage get-nft-listing token-id) 
                ERR-NFT-NOT-LISTED))
            
            ;; extract seller address
            (seller (get seller listing-data))
        )
        
        ;; VALIDATION CHECKS
        
        ;; ensure caller is the seller
        (asserts! (is-eq tx-sender seller) ERR-UNAUTHORIZED)
        
        ;; ensure listing is active
        (asserts! (get active listing-data) ERR-NFT-NOT-LISTED)
        
        ;; REMOVE LISTING FROM STORAGE
        (unwrap! (contract-call? .storage cancel-nft-listing token-id) 
            ERR-STORAGE-FAILED)
        
        ;; UPDATE PLATFORM STATISTICS
        (var-set total-nft-listings (- (var-get total-nft-listings) u1))
        
        ;; LOG EVENT
        (print {
            event: "nft-unlisted",
            token-id: token-id,
            seller: tx-sender,
            unlisted-at: stacks-block-height
        })
        
        (ok true)
    )
)
