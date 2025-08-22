;;==================================
;; title: main contract module

;; summary: glamora is a decentralized fashion social platform where creators share content and fashion 
;; enthusiasts discover trends, with direct cryptocurrency tipping and secure data storage in storage.clar

;; description: glamora is a vibrant fashion community where creativity meets direct support 
;; whether you're a fashion creator or fashion lover, this platform connects you with the global fashion world
;; 
;; For Fashion Creators: They join by creating a creator profile, then showcase their fashion expertise 
;; by posting photos and videos across 5 categories - Fashion Shows, Lookbooks, Tutorials, Behind-the-Scenes content,
;; and Reviews. You can share your amazing outfits, styling tips, design processes, or fashion insights 
;; You can also build your follower community and earn direct STX cryptocurrency tips from fans who love your work 
;; (you keep 95%, platform takes only 5%)
;;
;; For Fashion Enthusiasts: They can sign up as a public user to dive into the fashion world without creating content,
;; they can follow their favorite creators, discover emerging fashion trends, explore amazing outfits 
;; from shoes to accessories, and directly support creators they love by sending STX tips with personal messages
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
(define-constant ERR-TRANSFER-FAILED (err u6))        ;; STX payment didn't work
(define-constant ERR-ALREADY-FOLLOWING (err u7))      ;; Already following this person
(define-constant ERR-CANNOT-FOLLOW-SELF (err u8))     ;; Can't follow yourself, it is not allowed
(define-constant ERR-NOT-FOLLOWING (err u9))          ;; error if trying to unfollow someone you're not following
(define-constant ERR-UNFOLLOW-FAILED (err u10))       ;; When unfollow operation fails
(define-constant ERR-FOLLOW-FAILED (err u11))         ;; When follow operation fails
(define-constant ERR-STORAGE-FAILED (err u12))        ;; Storage contract failed to process the request
(define-constant ERR-UNAUTHORIZED (err u13))          ;; caller is not authorized to call a function

;; Platform fees
(define-constant PLATFORM-TIP-PERCENTAGE u5)          ;; platform keeps 5% of tips received from creators
(define-constant MIN-TIP-AMOUNT u100000)              ;; Minimum tip amount 1 stx 

;; CONTENT CATEGORIES - these are types of fashion content available on the platform 
(define-constant CATEGORY-FASHION-SHOW u1)            ;; category 1 for runway parades with models in dazzling outfits
(define-constant CATEGORY-LOOKBOOK u2)                ;; category 2 for awesome photo collections, photo album with nice style snapshots
(define-constant CATEGORY-TUTORIAL u3)                ;; category 3 educational fashion videos how fashion is made, how to make dress 
(define-constant CATEGORY-BEHIND-SCENES u4)           ;; category 4 showing how the fashionists do what they do 
(define-constant CATEGORY-REVIEW u5)                  ;; category 5 talking about fashion clothes or accessories, product review

;;=================================
;; Data Variables 
;;=================================

;; DATA VARIABLES
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
;; This scoreboard starts at 0 and goes up by 1 every time someone sends a tip (like giving a small gift of STX) 
;; If 20 tips are sent, it is u20
(define-data-var total-tips-sent uint u0)

;; This counts the money the app earns to keep running
;; It tracks how much STX (in microstacks) the app earns from fees
(define-data-var platform-fees-earned uint u0)

;; the storage-contract links to STORAGE.clar for secure data storage which is like a big warehouse 
;; where all the app data "profiles, posts, tips" is kept safe
(define-data-var storage-contract principal .storage)

;;===========================
;; Read-only Functions 
;;============================

;; get total users
(define-read-only (get-total-users) 
    (var-get total-users) ;; shows the number of users on the platform
)

;; get total followers
;; This function returns a user's follower count from storage.clar
;; it's a function that takes a principal (user's wallet address) and returns the number of followers for that user
(define-read-only (get-total-followers (user principal))
    (match (contract-call? .storage get-creator-profile user) 
    profile (ok (get follower-count profile)) 
    ERR-PROFILE-NOT-FOUND)
)


;; get total content
(define-read-only (get-total-content)
    (var-get total-content) 
) ;; get total content tracks fashion pictures or videos people shared in the app, if there are 5 posts, it show the 5 posts

;; get next content ID
(define-read-only (get-next-content-id)
    (var-get next-content-id) ;; this will grab the number that the next post will get
)

;; get total tips sent
(define-read-only (get-total-tips)
    (var-get total-tips-sent) ;; grabs the total tips creators receieve
)

;; get platform fees earned
(define-read-only (get-platform-fees-earned) 
    (var-get platform-fees-earned) ;; it goes into the apps piggy bank to see how much it has earned
)

;; this shows us where the app stores all our fashion stuff
(define-read-only (get-storage-contract) 
    (var-get storage-contract)
)

;; Let's get the total platform statics that can get everything in one call. This is like a statement of account
(define-read-only (get-platform-stats)
    {
        total-users: (var-get total-users),
        total-content: (var-get total-content),
        next-content-id: (var-get next-content-id),
        total-tips-sent: (var-get total-tips-sent),
        platform-fees-earned: (var-get platform-fees-earned)
    }
)

;; Let's us look up a creator profile. It will fetches data from storage, this ensures modularity
(define-read-only (get-creator-profile (user principal)) 
    (contract-call? .storage get-creator-profile user)
) ;; it will asks storage.clar contract to show a user profile like their username, bio, using their wallet address a special ID

;; let's look up a public user profile
(define-read-only (get-public-user-profile (user principal))
    (contract-call? .storage get-public-user-profile user)
)

;; Let's check out the details of a picture or video
(define-read-only (get-content-details (content-id uint))
    (contract-call? .storage get-content-details content-id)
) ;; this asks Storage.clar for info about a posts like its title, creator, or category using its ID number like #3

;; let's see if one person is following the other on the platform
(define-read-only (is-user-following (follower principal) (following principal)) 
    (contract-call? .storage is-following follower following)
) ;; it will go to the storage check if one user by their wallet address is following another, 
;; like checking if two people are buddies in the app

;; let's look at the details of a money tip someone sent for a post
(define-read-only (get-tip-details (content-id uint) (tipper principal))
    (contract-call? .storage get-tip-history content-id tipper)
) ;; it will ask our Storage.clar for info about a tip like how much was sent or the message
;; for a specific post and tipper by wallet address

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

;; Helper function to check if user has any type of profile
(define-private (has-profile (user principal))
    (or (is-some (contract-call? .storage get-creator-profile user))
        (is-some (contract-call? .storage get-public-user-profile user))))

;; Calculates how much platform fee to take from a tip (5% of total tip amount)
(define-private (calculate-platform-fee (amount uint))
    (/ (* amount PLATFORM-TIP-PERCENTAGE) u100)
) ;; (amout x 5) divide by 100 = 5%

;; ====================================================================================================
;; PUBLIC FUNCTIONS 
;; =====================================
;; PROFILE MANAGEMENT

;; CREATE CREATOR PROFILE
;; This is like signing up on the platform  "you become a member" 
;; This function starts user journey, storing data securely via storage.clar

;; @desc 
;; - this function creates a new user profile on the platform making sure all information 
;; is correct
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

        ;; Update platform statistics - we now have one more user so we increment by one
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
;; @desc
;; - this function lets creators share fashion posts 

;; NOTE:
;; content-hash is a mock hash for testing, a placeholder for fashion photos or videos. It will let us test the contract logic 
;; (e.g., posting, tipping) so no full off-chain storage system is required for now
;; Later, glamora will use IPFS to store content and point content-hash to those files on the decentralized storage

;; @param
;; - title (string-utf8 64)
;; - description (string-utf8 256)
;; - content-hash (buff 32)
;; - category uint
(define-public (publish-content (title (string-utf8 64)) (description (string-utf8 256)) (content-hash (buff 32)) (category uint))
    (let
        (
            ;; we need to get the ID number that the next post will get
            (content-id (var-get next-content-id))

            ;; we need to also get the current posts existing on the platform
            (current-content-count (var-get total-content))

        )

        ;; Let's Validate to make sure everything is okay

        ;; Category must be a valid number (1, 2, 3, 4, or 5)
        (asserts! (is-valid-category category) ERR-INVALID-INPUT)

        ;; Most important: we have to make sure this person is actually a member of our platform first
        (asserts! (is-some (contract-call? .storage get-creator-profile tx-sender)) ERR-PROFILE-NOT-FOUND)
        
        ;; SAVE CONTENT - we call over to the storage contract to save this new post
        (unwrap! (contract-call? .storage create-content 
                    content-id
                    tx-sender
                    title
                    description
                    content-hash
                    category
                ) 
                ERR-TRANSFER-FAILED
        )

        ;; Add to our counters  
        ;; Now we can update our "total posts" counter 
        (var-set total-content (+ current-content-count u1))

        ;;We have to update the next available ID number
        (var-set next-content-id (+ content-id u1))

        ;; we now have a new content
        (print {
            event: "content-published",       ;; what type of event happened
            content-id: content-id,           ;; The post's unique ID number
            creator: tx-sender,               ;; Who created it
            category: category,               ;; What type of content is it
            title: title     
        })

        (ok content-id) ;; return the content ID to the user
    )
)

;; =====================================
;; TIPPING SYSTEM  
;; =====================================

;; SEND TIP TO CREATOR
;; @desc 
;; - this function enable fans support, tipping creators as a sign of appreciation for their content
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

        ;; PAYMENT PROCESSING

        ;; Transfer 95% of tip to the content creator
        (unwrap! (stx-transfer? creator-amount tx-sender creator) ERR-TRANSFER-FAILED)
        
        ;; Transfer 5% platform fee to the contract
        (unwrap! (stx-transfer? platform-fee tx-sender (as-contract tx-sender)) ERR-TRANSFER-FAILED)

        ;; DATA RECORDING
        ;; Save tip details permanently in storage contract
        (unwrap! (contract-call? .storage record-tip 
                    content-id      ;; Which post was tipped
                    tx-sender       ;; Who sent the tip
                    creator         ;; Who received the tip
                    tip-amount      ;; Total amount tipped
                    message         ;; Message from tipper
                ) ERR-TRANSFER-FAILED)


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
            creator-received: creator-amount    ;; Creator's actual payout
        })

        (ok true)  ;; Return success status
    )
)

;; =====================================
;; SOCIAL FOLLOWING SYSTEM
;; =====================================

;; FOLLOW ANOTHER CONTENT CREATOR 
;; @desc 
;;   follow-user builds social connections
;;   following is completely FREE, just building friendships, global access
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
;; unfollow-user removes social connections
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




