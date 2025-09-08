;;=============================================
;; title: storage module, our data whare house contract

;; summary: This module stores ALL the information for the fashion platform 
;; It keeps creator and public user profiles, content posts, tips, and follow relationships safe 

;; description: this contract is like a super-safe bank vault for data, it stores creator and public user profiles, 
;; keeps all fashion posts and their details, it remembers who follows whotracks all tip transactions 
;; between fans and creators and only the "main contract" can write new data here

;; Version 3.0

;; author: "Timothy Terese Chimbiv"
;;=======================================================

;;====================================
;; CONSTANTS 
;;===================================

;; ERROR CODES 
(define-constant ERR-NOT-AUTHORIZED (err u100))  ;; ensures only main writes
(define-constant ERR-USER-NOT-FOUND (err u101))  ;; the user's profile can't be found anywhere
(define-constant ERR-USERNAME-TAKEN (err u102))  ;; Someone has already picked that username 
(define-constant ERR-PROFILE-EXISTS (err u103))  ;; User already created their profile before
(define-constant ERR-INVALID-DATA (err u104))    ;; The information inputted is wrong

;;================================
;; Variables 
;;==================================

;; This holds the address of the main contract allowed to store data in our storage system
(define-data-var authorized-contract principal tx-sender)

;; This holds the address of the admin who can update settings (e.g., updating which contract is authorized)
;; in our storage system
(define-data-var contract-admin principal tx-sender)

;;===============================
;; Data Maps 
;;===============================

;; This stores information about each creator profiles
(define-map creator-profiles principal {
    creator-username: (string-ascii 32),
    display-name: (string-utf8 32),
    bio: (string-utf8 256),
    creation-date: uint,
    follower-count: uint,
    following-count: uint,
    total-content: uint,
    total-tips-received: uint,
    total-tips-sent: uint
})

;; Let's create a map for public user profiles
(define-map public-user-profiles principal {
    public-username: (string-ascii 32),
    display-name: (string-utf8 32),
    bio: (string-utf8 256),
    creation-date: uint,
    following-count: uint,
    total-tips-sent: uint,
    user-type: (string-ascii 10)  
})

;;=================================
;; NEW SUBSCRIPTION DATA MAPS 
;;====================================

;; Store subscription details for each user
;; This map will track individual subscription records, using the subscriber's principal as the key
(define-map user-subscriptions principal {
    subscribed-to: principal,   ;; the principal address of the creator the user is subscribed to,
                                ;; it links the subscription to a specific creator profile
    tier: uint,
    subscription-price: uint,   ;; this cost is based on selected tier
    start-block: uint,          ;; the timestamp to track the start of the subscription period
    expiry-block: uint,
    active: bool
})

;; This map rack creator's subscription statistics  
;; It keeps count of how many fans pay monthly to follow them and how much money they make,
;; each creator (identified by their wallet addresses) gets their own set of numbers
(define-map creator-subscription-stats principal {
    total-subscribers: uint,
    total-subscription-revenue: uint,
    basic-subscribers: uint,
    premium-subscribers: uint,
    vip-subscribers: uint
})

;; This connects each username to the user address for easy lookup
(define-map usernames (string-ascii 32) principal)

;; This stores details about each fashion content post
(define-map content-registry uint {
    creator: principal,
    title: (string-utf8 64),
    description: (string-utf8 256),
    content-hash: (buff 32),
    category: uint,
    creation-date: uint,
    tip-count: uint,
    total-tips-received: uint
})

;; keeps records of every tip sent to a fashion post, including details like how much was tipped, who sent it, 
;; and any message
(define-map tip-history {content-id: uint, tipper: principal} {
    creator: principal,
    tip-amount: uint,
    tip-date: uint,
    message: (string-utf8 128)
})

;; This stores information about who follows whom in the platform
(define-map user-follows {follower: principal, following: principal} {
    follow-date: uint,
    active: bool
})

;;================================
;;; Private helper functions 
;;=====================================

;; This checks if the main contract is allowed to make changes to our storage system
(define-private (is-authorized)
    (is-eq contract-caller (var-get authorized-contract))
)

;; checks if the admin is allowed to update settings in our storage system
(define-private (is-admin)
    (is-eq tx-sender (var-get contract-admin))
)

;;================================
;; NEW PRIVATE TIER FUNCTIONS
;;=====================================

;; @desc: this helper function will add 1 to tier counter only if the subscription matches the target tier
;; for example, if a user subscribes to Premium which is (tier u2), only premium counter increases
;; @params:
;; - current-count      =>uint
;; - subscription-tier  =>uint
;; - target-tier uint   =>uint
(define-private (increment-tier-count (current-count uint) (subscribe-tier uint) (target-tier uint))
    (+ current-count (if (is-eq subscribe-tier target-tier) u1 u0))
)

;; @desc: this helper function will Subtract 1 from tier counter if the cancelled subscription matches the target tier  
;; for example if the user cancels Premium (tier u2), only premium counter decreases
(define-private (decrement-tier-count (current-count uint) (subscription-tier uint) (target-tier uint))
    (- current-count (if (is-eq subscription-tier target-tier) u1 u0))
)

;;=================================
;; Read-only Functions 
;;=========================================

;; READ-ONLY FUNCTIONS FOR DATA VARIABLES

;; This function shows the address of the "main contract" allowed to store data in our storage system,
;; it goes and fetch it
(define-read-only (get-authorized-contract) 
    (var-get authorized-contract)
)

;; this will grab the address of the admin who can update settings in our storage system
(define-read-only (get-contract-admin)
    (var-get contract-admin)
)

;; READ-ONLY FUNCTIONS FOR DATA MAPS

;; This shows creator profile details, like their name and bio, from the storage system
;; @param 
;; - user: The wallet address of the creator whose profile is being viewed. it provides profile data to main contract
(define-read-only (get-creator-profile (user principal))
    (map-get? creator-profiles user)
)

;; get the public user profile deatails
;; @ param 
;; - user principal
(define-read-only (get-public-user-profile (user principal))
    (map-get? public-user-profiles user)
)

;;============================================
;; NEW SUBSCRIPTION READ-ONLY FUNCTIONS
;;==================================================

;; get the user's subscription details
(define-read-only (get-user-subscription (user principal))
    (map-get? user-subscriptions user)
)

;; get the creator's subscription statistics
(define-read-only (get-creator-subscription-stats (creator principal))
    (map-get? creator-subscription-stats creator)
)

;; This shows the wallet address of the public user who owns a specific username
;; @param 
;; - username: The username to look up in the storage system
(define-read-only (get-username-owner (username (string-ascii 32)))
    (map-get? usernames username)
)

;; This shows details about a fashion content post, like its title and description
;; @param content-id: The ID number of the content post to look up
(define-read-only (get-content-details (content-id uint)) 
    (map-get? content-registry content-id)
)

;; This shows the record of a tip sent for a specific fashion content post
;; @param 
;; - content-id: The ID number of the content post
;; - tipper: The wallet address of the user who sent the tip
(define-read-only (get-tip-history (content-id uint) (tipper principal))
    (map-get? tip-history {content-id: content-id, tipper: tipper})
)

;;===============================
;; NEW READ-ONLY FUNCTION 
;;===============================

;; this will fetch the follow record, follow date and active status
;; @param 
;; - follower:
;; - following:
(define-read-only (get-follow-record (follower principal) (following principal))
    (map-get? user-follows {follower: follower, following: following})
)

;; @desc this function will check if follow record exists and return its active status, or false if no record found
;; @params
;; - follower principal
;; - following principal
(define-read-only (is-following (follower principal) (following principal))
    (let
        (
            ;; try to find the follow relationship record in our database
            (follow-data (map-get? user-follows {follower: follower, following: following}))
        )

        ;; Two possible outcomes to handle here. If something is found or nothing at all
        (match follow-data data (get active data) false) ;; the none branch return false if we have no data
    )
)

;;===================================================
;; Public Functions 
;; => only authorized contract can use
;;====================================================

;; Admin function to change authorized contract
(define-public (set-authorized-contract (new-contract principal)) 
    (begin
        ;; Only admin can change the authorized contract
        (asserts! (is-admin) ERR-NOT-AUTHORIZED)

        ;; update the authorized contract address to the new one
        ;; this changes which contract is allowed to write data to our storage
        (var-set authorized-contract new-contract)

        (ok true)
    )
)

;; CREATE A NEW CREATOR PROFILE
;; @desc
;; Ensures only "main" saves profiles
;; two things we have to consider before creating the new acount
;; => we have to make sure the person username is not already taken or exists
;; => and, if the person already has an account
;; @params
;; - user principal (the person's wallet address)
;; - username (string-ascii 32)
;; - display-name (string-utf8 32)
;; - bio (string-utf8 256)
(define-public (create-creator-profile 
    (user principal) 
    (username (string-ascii 32)) 
    (display-name (string-utf8 32)) 
    (bio (string-utf8 256)))
    (let
        (
            ;; check if someone already has this username
            (username-exists (map-get? usernames username))

            ;; check if this person already has an account 
            (profile-exits (map-get? creator-profiles user))
        )

        ;; Now, we have to do some safety checks to make sure everything is okay before saving 

        ;; Check if only the "main contract" is calling us. This is our security guard at the door
        ;; this will ensure that only the authorized contract .main can call it
        (asserts! (is-authorized) ERR-NOT-AUTHORIZED)

        ;; Make sure nobody else already took this username
        (asserts! (is-none username-exists) ERR-USERNAME-TAKEN)

        ;; Make sure this person does not already have an account 
        (asserts! (is-none profile-exits) ERR-PROFILE-EXISTS)

        ;; Save the user profile info
        (map-set creator-profiles user {
            creator-username: username,                
            display-name: display-name,       
            bio: bio,                         
            creation-date: stacks-block-height, 
            follower-count: u0,               
            following-count: u0,              
            total-content: u0,                
            total-tips-received: u0,          
            total-tips-sent: u0               
        })

        ;; Save username so we can find user's wallet easily
        (map-set usernames username user)

        ;; Everything worked, profile created

        (ok true)
    )
)

;; CREATE PUBLIC USER PROFILE
;; @desc
;; - this function creates a profile for users who want to follow creators and send tips 
;; but don't create fashion content themselves
;; @params
;; - user: The wallet address of the person creating the public profile
;; - username: user's name
;; - display-name: Public display name shown to other users 
;; - bio: User's personal description or introduction 
(define-public (create-public-user-profile 
    (user principal) 
    (username (string-ascii 32)) 
    (display-name (string-utf8 32)) 
    (bio (string-utf8 256)))
    (let
        (
            ;; Check if someone already has this username
            (username-exists (map-get? usernames username))
            
            ;; Check if this user already has a public profile
            (profile-exists (map-get? public-user-profiles user))
        )
        
        ;; Only the main contract can create profiles
        (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
        
        ;; Make sure nobody else already took this username
        (asserts! (is-none username-exists) ERR-USERNAME-TAKEN)
        
        ;; Make sure this user does not already have a public profile
        (asserts! (is-none profile-exists) ERR-PROFILE-EXISTS)
        
        ;; Save the public user profile with initial values
        (map-set public-user-profiles user {
            public-username: username,
            display-name: display-name,
            bio: bio,
            creation-date: stacks-block-height,
            following-count: u0,
            total-tips-sent: u0,
            user-type: "public"
        })
        
        ;; Reserve the username so no one else can use it
        (map-set usernames username user)
        
        (ok true)
    )
)

;; CREATE NEW CONTENT
;; @desc 
;; it lets the creator save a new piece of content, such as a fashion photo or video, 
;; along with details like a title, description, and category
;; The function checks that the informaton is correct, makes sure the creator has a profile, 
;; and then stores the content details for main.clar
;; It also updates the creator's profile to show they have made one more post
;; Only the main contract can call this function to keep things secure
;; @params
;; - content-id uint
;; - creator principal
;; - (title (string-utf8 64))              
;; - (description (string-utf8 256))       
;; - (content-hash (buff 32))              
;; - (category uint)
(define-public (create-content 
    (content-id uint) 
    (creator principal) 
    (title (string-utf8 64)) 
    (description (string-utf8 256)) 
    (content-hash (buff 32)) 
    (category uint)) 
    (let
        (
            ;; Get the creator's profile so to update their post count
            (creator-profile (unwrap! (map-get? creator-profiles creator) ERR-USER-NOT-FOUND))

            ;; Add 1 to the creator's current post count
            (new-content-count (+ (get total-content creator-profile) u1))
        )

        ;; Make sure only the main glamora contract can save the creator's post
        (asserts! (is-authorized) ERR-NOT-AUTHORIZED)

        ;; Save the post details with zero tips as initial start (u0)
        (map-set content-registry  content-id {
            creator: creator,
            title: title,                     
            description: description,         
            content-hash: content-hash,       
            category: category,               
            creation-date: stacks-block-height, 
            tip-count: u0,                    
            total-tips-received: u0
        })

        ;; Update the creator's profile with their new post count
        (map-set creator-profiles creator 
            (merge creator-profile {total-content: new-content-count})
        )

        ;; post saved successfully

        (ok true)
    )
)

;; RECORD TIP TRANSACTION
;; @desc 
;; - This function saves a tip sent to a creator for a post. It updates the post, creator, and tipper's info.
;; @param
;; - content-id uint                    
;; - tipper principal                   
;; - creator principal                  
;; - tip-amount uint                    
;; - message (string-utf8 128))         
(define-public (record-tip (content-id uint) (tipper principal) (creator principal) (tip-amount uint) (message (string-utf8 128))) 
    (let
        (
            ;; Get current post data to update tip statistics
            (content-data (unwrap! (map-get? content-registry content-id) ERR-USER-NOT-FOUND))
            
            ;; Get creator's profile to update their total tips received
            (creator-profile (unwrap! (map-get? creator-profiles creator) ERR-USER-NOT-FOUND))
            
            ;; Get tipper's profile to update their total tips sent
            (tipper-profile (unwrap! (map-get? creator-profiles tipper) ERR-USER-NOT-FOUND))
        )

        ;; AUTHORIZATION CHECK
        ;; Ensure only the main contract can record tips
        (asserts! (is-authorized) ERR-NOT-AUTHORIZED)

        ;; TIP RECORD CREATION
        ;; Save permanent record of this tip transaction
        (map-set tip-history {content-id: content-id, tipper: tipper} {
            creator: creator,                   ;; Who received the tip
            tip-amount: tip-amount,             ;; How much was tipped
            tip-date: stacks-block-height,      ;; When tip was sent
            message: message                    ;; Tipper's message
        })

        ;; CONTENT STATISTICS UPDATE
        ;; Update post with new tip count and total tips received
        (map-set content-registry content-id 
            (merge content-data {
                ;; Increment tip count by 1
                tip-count: (+ (get tip-count content-data) u1),
                ;; Add tip amount to post's total tips
                total-tips-received: (+ (get total-tips-received content-data) tip-amount)
            }))

        ;; CREATOR PROFILE UPDATE
        ;; Update creator's total tips received across all their content
        (map-set creator-profiles creator 
            (merge creator-profile {
                ;; Add this tip to creator's lifetime tip earnings
                total-tips-received: (+ (get total-tips-received creator-profile) tip-amount)
            }))

        ;; TIPPER PROFILE UPDATE
        ;; Update tipper's total tips sent across all their activity
        (map-set creator-profiles tipper 
            (merge tipper-profile {
                ;; Add this tip to tipper's lifetime tip spending
                total-tips-sent: (+ (get total-tips-sent tipper-profile) tip-amount)
            }))

        (ok true)  ;; Return success status
    )
)

;; CREATE FOLLOW RELATIONSHIP
;; @desc
;; - this function lets one user follow another
;; it saves the connection and updates their profiles
;; @param
;; - follower principal
;; - following principal
(define-public (create-follow (follower principal) (following principal))
    (let
        (
            ;; get the follower's profile to update their following count
            (follower-profile (unwrap! (map-get? creator-profiles follower) ERR-USER-NOT-FOUND))

            ;; get the profile of the person being followed to update their follower count
            (following-profile (unwrap! (map-get? creator-profiles following) ERR-USER-NOT-FOUND))

            ;; add 1 to the follower's current following count 
            (new-following-count (+ (get following-count follower-profile) u1))

            ;; add 1 to the person's current follower count
            (new-follower-count (+ (get follower-count following-profile) u1))
        )

        ;; make sure that only the main glamora contract can save this follow
        (asserts! (is-authorized) ERR-NOT-AUTHORIZED)

        ;; check that a user can not follow themselves
        (asserts! (not (is-eq follower following)) ERR-INVALID-DATA)

        ;; SAVE the follow connection
        (map-set user-follows {follower: follower, following: following} {
            follow-date: stacks-block-height,   ;; when the follow happened
            active: true                        ;; mark the follow as active
        })

        ;; UPDATE the follower's profile with their new following count
        (map-set creator-profiles follower 
            (merge follower-profile {following-count: new-following-count})
        )

        ;; UPDATE the followed person's profile with their new follower count
        (map-set creator-profiles following 
            (merge following-profile {follower-count: new-follower-count})
        )

        ;; follow saved successfully

        (ok true)
    )
)

;; REMOVE FOLLOW CONNECTION
;; @desc
;; - this function lets a user stop following another user, it deletes the connection and updates their profiles
;; @param
;; - follower principal
;; - following principal
(define-public (remove-follow (follower principal) (following principal)) 
    (let
        (
            ;; get the follower's profile to update their following count
            (follower-profile (unwrap! (map-get? creator-profiles follower) ERR-USER-NOT-FOUND))

            ;; get the profile of the person being unfollowed to update their follower count
            (following-profile (unwrap! (map-get? creator-profiles following) ERR-USER-NOT-FOUND))

            ;; subtract 1 from the follower's current following count
            (new-following-count (- (get following-count follower-profile) u1))

            ;; subtract 1 from the person's current follower count
            (new-follower-count (- (get follower-count following-profile) u1))
        )

        ;; make sure only the main glamora contract can delete this follow
        (asserts! (is-authorized) ERR-NOT-AUTHORIZED)

        ;; delete the follow connection
        (map-delete user-follows {follower: follower, following: following})

        ;; we can now update the follower's profile with their new following count
        (map-set creator-profiles follower 
            (merge follower-profile {following-count: new-following-count})
        )

        ;; update the unfollowed person's profile with their new follower count
        (map-set creator-profiles following 
            (merge following-profile {follower-count: new-follower-count})
        )

        ;; follow connection deleted successfully

        (ok true)
    )
)

;;======================================
;; NEW SUBSCRIPTION STORAGE FUNCTIONS
;;=========================================

;; Create new subscription 
;; @desc - This function saves a new subscription when someone pays to follow a creator through main.clar
;; @params:
;; - subscriber (principal)
;; - creator (principal)
;; - tier (uint)
;; - price (uint)
;; - expiry (uint)
;; - tier-basic (uint)
;; - tier-premium (uint)
;; - tier-vip (uint)
(define-public (create-subscription 
    (subscriber principal) 
    (creator principal) 
    (tier uint) 
    (price uint) 
    (expiry uint) 
    (tier-basic uint) 
    (tier-premium uint) 
    (tier-vip uint))
    (let
        (
            ;; Get creator's current stats (start with zeros if new creator)
            ;; get the creator's subscription stats; use default zeros if its new (no stats yet),
            ;; this ensures it works smoothly for first-time subscribers 
            (creator-stats (default-to 
                {total-subscribers: u0, total-subscription-revenue: u0, basic-subscribers: u0, 
                premium-subscribers: u0, vip-subscribers: u0}
                (map-get? creator-subscription-stats creator))
            )
        )

        ;; Only main contract can save subscriptions
        (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
        
        ;; Save the subscription details
        (map-set user-subscriptions subscriber {
            subscribed-to: creator,
            tier: tier,
            subscription-price: price,
            start-block: stacks-block-height,
            expiry-block: expiry,
            active: true
        })
        
        ;; Update creator stats based on tier type
        (map-set creator-subscription-stats creator
            (merge creator-stats {
                total-subscribers: (+ (get total-subscribers creator-stats) u1),
                total-subscription-revenue: (+ (get total-subscription-revenue creator-stats) price),
        
                ;; we'll use the increment helper funtin for all tiers
                ;; if the incremented subscription was basic-subscription u1, then only basic-subscription will increase by 1
                basic-subscribers: (increment-tier-count (get basic-subscribers creator-stats) tier tier-basic),

                premium-subscribers: (increment-tier-count (get premium-subscribers creator-stats) tier tier-premium),
                vip-subscribers: (increment-tier-count (get vip-subscribers creator-stats) tier tier-vip)
            })
        )
        
        (ok true)
    )
)

;; Cancel subscription
;; @desc - this function will removes someone's subscription when they want to stop paying 
;; @param - 
;; - suscriber (principal)
;; - tier-basic (uint)
;; - tier-premium (uint)
;; - tier-vip (uint) 
(define-public (cancel-subscription (subscriber principal) (tier-basic uint) (tier-premium uint) (tier-vip uint))
    (let
        (
            ;; Retrieve the subscriber's current subscription record from our storage
            (subscription-data (unwrap! (map-get? user-subscriptions subscriber) ERR-USER-NOT-FOUND))

            ;; Extract the creator's wallet address from the subscription data
            ;; so it will tells us which creator will lose this subscriber
            (creator (get subscribed-to subscription-data))

            ;; Get the subscription tier (1=Basic, 2=Premium, 3=VIP) from the subscription data
            ;; so we can know which tier counter to decrease in the creator's stats
            (tier (get tier subscription-data))

            ;; Get the creator's current subscription statistics from storage
            (creator-stats (unwrap! (map-get? creator-subscription-stats creator) ERR-USER-NOT-FOUND))
        )
        
        ;; Only main contract can cancel subscriptions
        (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
        
        ;; Remove the subscription, after this the subscriber will no longer have any active subscription
        (map-delete user-subscriptions subscriber)
        
        ;; Update creator stats by subtracting the cancelled subscription
        (map-set creator-subscription-stats creator
            (merge creator-stats {
                total-subscribers: (- (get total-subscribers creator-stats) u1),
        
                ;; Use decrement helper for all tiers
                ;; if the cancelled subscription was Basic (u1), only basic-subscribers will be decreased by 1
                basic-subscribers: (decrement-tier-count (get basic-subscribers creator-stats) tier tier-basic),

                premium-subscribers: (decrement-tier-count (get premium-subscribers creator-stats) tier tier-premium), 
                vip-subscribers: (decrement-tier-count (get vip-subscribers creator-stats) tier tier-vip)
            })
        )
        
        (ok true)
    )
)


