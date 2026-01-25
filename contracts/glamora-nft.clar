;;=======================================
;; title: glamora-nft

;; summary:Glamora Fashion Platform NFT Contract that complies with SIP-009 

;; description: This is the main NFT contract for the Glamora fashion platform that handles minting,
;; trading, and managing fashion-related NFTs. It Implements the SIP-009 standard to ensure
;; compatibility with NFT marketplaces and wallets. 

;; version: 3.0

;; author: "Timothy Terese Chimbiv"

;; Let's implement the trait we defined
(impl-trait .sip-009.nft-trait)

;;========================================
;; CONSTANTS
;;========================================

(define-constant ERR-NOT-NFT-OWNER (err u501)) ;; The caller is not the owner of this NFT
(define-constant ERR-TRANSFER-FAILED (err u502)) ;; When sBTC or NFT transfer operation fails

(define-constant ERR-NOT-AUTHORIZED (err u503)) ;; The caller is not authorized, 
;; the error triggers if the caller is not the .main contract

(define-constant ERR-INVALID-COLLECTION-NAME (err u504)) ;; when an invalid collection name is provided, 
;; either the collection name is empty or too short
 
(define-constant ERR-INVALID-INPUT (err u505)) ;; its for general invalid inputs like empty description or max-editions out of range (0 or >10,000)

(define-constant ERR-STORAGE-FAILED (err u506)) ;; When saving data to storage contract fails

(define-constant COLLECTION-CREATION-FEE u5000000) ;; Collection creation fee 0.05 sBTC

;; COLLECTION SIZE LIMITS
;; @desc: These set the rules for how big or small a fashion collection can be
;; MIN-COLLECTION-SIZE: The smallest number of NFTs allowed in one collection
;; I set this to 1 because a collection needs at least 1 item to count
;; MAX-COLLECTION-SIZE: The largest number of NFTs allowed in one collection 
;; set this to 10,000 to prevent spam attacks and keep collections manageable
(define-constant MIN-COLLECTION-SIZE u1)      ;; every collection must have at least 1 NFT
(define-constant MAX-COLLECTION-SIZE u10000)  ;; no collection can have more than 10,000 NFTs

;;========================================
;; PLATFORM STATE VARIABLES
;;========================================

(define-data-var total-nfts-minted uint u0) ;; this function will keep track of the total NFTs that's been minted,
;; initially starts at 0 and increases with each new mint

(define-data-var next-collection-id uint u1) ;; next-collection-id tracks the ID for the next fashion collection 
;; it starts at 1 and increases with each new collection assigning unique IDs

(define-data-var authorized-caller principal tx-sender) ;; This will set the initial authorized caller to the deployer principal 
;; giving room for flexibility to update via set-authorized-caller to a contract like .main
;; avoiding tight coupling and enabling upgrades without redeployment

(define-data-var admin principal tx-sender) ;; This function will save the person who deployed the contract (tx-sender)
;; it will identify the person who has admin or the permission to call this contract

;;=======================================
;; READ-ONLY FUNCTIONS FOR PLATFORM DATA
;;=======================================

;; GET TOTAL NFTS MINTED
;; @desc: this function will show how many NFTs that's been minted so far on the platform
(define-read-only (get-total-nfts-minted)
    (var-get total-nfts-minted) ;; it will return the current count of all minted NFTs
)

;; GET NEXT COLLECTION ID
;; @desc: this function will tell us what number the next collection will get
(define-read-only (get-next-collection-id)
    (var-get next-collection-id) ;; it will return the ID that will be used for the next collection
)

;; GET AUTHORIZED CALLER
;; @desc: this function shows who is allowed to create collections and do important operations on the platform
(define-read-only (get-authorized-caller)
    (var-get authorized-caller) ;; it will return the address of whoever can call special functions
)

;; GET ADMIN
;; @desc: this function shows who the owner of this contract is
(define-read-only (get-admin)
    (var-get admin) ;; it will return the address of the contract admin/owner
)

;; CHECK IF SOMEONE IS THE ADMIN
;; @desc: this function checks if a particular person calling this function is the admin
(define-read-only (is-admin (caller principal))
    ;; we'll compare the given address with the stored admin address
    (is-eq caller (var-get admin)) 
) ;; it will return true if they match and false if they don't

;; CHECK IF SOMEONE IS AUTHORIZED
;; @desc: this function checks if a specific person can create collections
;; here we are checking if this person have permission to add new collections, is the person authorized 
(define-read-only (is-caller-authorized (caller principal))
    ;; we'll compare the given address with the authorized caller address
    (is-eq caller (var-get authorized-caller)) 
) ;; it will return true if they match and false if they don't

;;=======================================
;; HELPER FUNCTIONS - READ-ONLY
;;=======================================

;; @desc: this function will enable external contract check who is authorized to call
;; Since no changes will be made just a check hence I used a read-only for the helper function
(define-read-only (is-authorized-caller)
    ;; check that the caller is admin
    (is-eq tx-sender (var-get admin))
)

;; @desc: this function will enable external contracts to check if a collection name is valid
;; Since no changes will be made just a validation check hence I used a read-only for the helper function
(define-read-only (is-valid-collection-name (name (string-utf8 32)))
    ;; check that the collection name is not empty
    (> (len name) u0)
)

;;=======================================
;; ADMIN FUNCTIONS
;;=======================================
;; SET AUTHORIZED CALLER
;; @desc: this function allows the admin to change who is authorized to create collections
;; only the admin (person who deployed the contract) can do this
;; @param: new-caller - the wallet address of the new person/contract to authorize
(define-public (set-authorized-caller (new-caller principal))
    (let
        (
            ;; let's save the current authorized caller before we change it
            ;; this is just for the event log so we can see who had permission before
            (old-caller (var-get authorized-caller))
        )
        (begin
            ;; check only the admin can change who is authorized
            ;; if you're not the admin, this will stop and return and error
            (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)

            ;; update the new authorized caller
            (var-set authorized-caller new-caller)

            ;; record the change so everyone can see what happened
            (print {
                event: "authorized-caller-updated",
                old-caller: old-caller,           ;; who had permissions before
                new-caller: new-caller,           ;; who have permissions now
                updated-by: tx-sender             ;; Who made this change (the admin)
            })

            ;; Success: return true
            (ok true)
        )
    )
)

;;=======================================
;; NFT TOKEN DEFINITION
;;=======================================

;; This will create "glamora-nft" tokens, each one is unique and gets its own ID number
(define-non-fungible-token glamora-nft uint)

;;=======================================
;; SIP-009 TRAIT IMPLEMENTATION
;;=======================================

;; GET LAST TOKEN ID
;; @desc: This will tell us how many NFTs minted by giving the first NFT minted #1 
;; and the next after that one #2, then #3, #4, and so on
;; So if we've minted 5 NFTs, this returns 5 (which is also the last token ID)
(define-read-only (get-last-token-id)
    (ok (var-get total-nfts-minted))
)
;; get-last-token-id will return total-nfts-minted which is perfect because 
;; it tells us the highest NFT ID that exists

;; GET TOKEN URI
;; @desc: This function will get the web link where NFT details are stored like getting a website URL
;; If the NFT exists by the number that was inputted (token-id) 
;; then it returns IPFS hash and the wallets can show the picture
(define-public (get-token-uri (token-id uint))
    (ok (match (contract-call? .storage-v3 get-nft-metadata token-id) 
        nft-data (some (concat "ipfs://" (get image-ipfs-hash nft-data)))
        none))
)

;; GET OWNER
;; @desc: This function tells us who owns a specific NFT by giving it an NFT ID number like #1, #2, #3
;; It will check our NFT ownership records and returns the wallet address of whoever owns that NFT
;; and eturns none if the NFT doesn't exist
(define-read-only (get-owner (token-id uint))
    (ok (nft-get-owner? glamora-nft token-id))
)

;; TRANSFER
;;  @desc: This functions ensures the moving of an NFT from one wallet to another
;; and only the current owner of the NFT can initiate this transfer.
;; @param:
;; - token id 
;; - sender 
;; - recipient
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
    (begin
        ;; Check that the person transfering (must be the tx-sender) is the owner of the
        ;; NFT so people don't transfer NFT they don't own
        (asserts! (is-eq tx-sender sender) ERR-NOT-NFT-OWNER)

        ;;Transfer NFT to recipient and unwrap! stops the function's execution 
        ;; and returns an error if transfer fails
        (unwrap! (nft-transfer? glamora-nft token-id sender recipient) ERR-TRANSFER-FAILED)

        ;; transfer event log, so everyone can see what happened
        (print {
            event: "nft-transferred",
            token-id: token-id,
            sender: sender,
            recipient: recipient
        })
        
        (ok true)
    )
)

;;=======================================
;; PUBLIC FUNCTIONS
;;=======================================

;; CREATE FASHION COLLECTION
;; @desc: this function let's people create a new collection of fashion NFTs
;; Only authorized users (like the main platform) can create these collections
;; @param:
;; - collection-name: name of the collection 
;; - description: what the collection is all about 
;; - max-editions: the maximum number of NFTs that can be in this collection 
(define-public (create-fashion-collection (collection-name (string-utf8 32)) (description (string-utf8 256)) (max-editions uint))
    (let
        (
            ;; get the available collection number to know what we have currently
            (collection-id (var-get next-collection-id))
        )

        ;; Ensure only authorized contract can create collections
        (asserts! (is-eq contract-caller (var-get authorized-caller)) ERR-NOT-AUTHORIZED)

        ;; Make sure the collection name is valid
        (asserts! (is-valid-collection-name collection-name) ERR-INVALID-COLLECTION-NAME)

        ;; Make sure something is written in the description
        ;; no empty descriptions, so check that description length is more than 0 characters
        (asserts! (> (len description) u0) ERR-INVALID-INPUT)

        ;; you can't have a collection with 0 items
        ;; max-editions >= MIN-COLLECTION-SIZE (must be at least 1 NFT - no empty collections)
        ;; max-editions <= MAX-COLLECTION-SIZE (can't be more than 10,000 - prevents spam)
        ;; so, MAKE sure collection is within the limit of u1 to u10000
        (asserts! (and (>= max-editions MIN-COLLECTION-SIZE) 
                        (<= max-editions MAX-COLLECTION-SIZE)) ERR-INVALID-INPUT)

        ;; NOW Store all the collection information 
        ;; We'll call the storage contract to save - ID, name, creator, description, and max items
        (unwrap! (contract-call? .storage-v3  store-collection-data 
            collection-id 
            collection-name 
            tx-sender 
            description 
            max-editions) ERR-STORAGE-FAILED
        )

        ;; update collection counter by adding 1 to the current collection ID so the next collection gets a new number
        (var-set next-collection-id (+ collection-id u1))

        ;; log the event of what happened
        (print {
            event: "collection-created",
            collection-id: collection-id,       ;; Which collection number
            creator: tx-sender,                 ;; Who created it
            name: collection-name,              
            max-editions: max-editions          ;; How many items it can hold
        })

        ;; Return the collection ID number so they know their collection's number
        (ok collection-id)
    )
)

;;=======================================
;; MINT FASHION NFT
;;=======================================
;; @desc: Mint a new NFT in an existing fashion collection
;; Only the collection creator can mint NFTs in their collection
;; @params:
;; - collection-id: Which collection this NFT belongs to
;; - recipient: Who will receive this NFT
;; - name: NFT name/title
;; - description: NFT description
;; - image-ipfs-hash: IPFS hash for the NFT image
;; - animation-ipfs-hash: Optional IPFS hash for animation
;; - external-url: Optional external link
;; - attributes-ipfs-hash: Optional IPFS hash for attributes
(define-public (mint-fashion-nft
    (collection-id uint)
    (recipient principal)
    (name (string-utf8 64))
    (description (string-utf8 256))
    (image-ipfs-hash (string-ascii 64))
    (animation-ipfs-hash (optional (string-ascii 64)))
    (external-url (optional (string-ascii 128)))
    (attributes-ipfs-hash (optional (string-ascii 64))))
    (let
        (
            ;; get collection data to verify it exists and check limits
            (collection-data (unwrap! (contract-call? .storage-v3 get-collection-data collection-id) ERR-INVALID-INPUT))
            
            ;; get next NFT ID to assign to this new NFT
            (token-id (+ (var-get total-nfts-minted) u1))
            
            ;; check current and max editions
            (current-editions (get current-editions collection-data))
            (max-editions (get max-editions collection-data))
            (creator (get creator collection-data))
        )
        
        ;; only collection creator can mint NFTs
        (asserts! (is-eq tx-sender creator) ERR-NOT-AUTHORIZED)
        
        ;; collection must be active
        (asserts! (get active collection-data) ERR-INVALID-INPUT)
        
        ;; verify the current editions is less than max editions (e.g. 5 minted < 100 max = can mint more)
        (asserts! (< current-editions max-editions) ERR-INVALID-INPUT)
        
        ;; mint the NFT to recipient
        (unwrap! (nft-mint? glamora-nft token-id recipient) ERR-TRANSFER-FAILED)
        
        ;; store NFT metadata
        (unwrap! (contract-call? .storage-v3 store-nft-metadata
            token-id
            name
            description
            image-ipfs-hash
            animation-ipfs-hash
            external-url
            attributes-ipfs-hash) ERR-STORAGE-FAILED)
        
        ;; update collection edition count
        (unwrap! (contract-call? .storage-v3 update-collection-editions collection-id) ERR-STORAGE-FAILED)
        
        ;; increment total NFTs minted on platform
        (var-set total-nfts-minted token-id)
        
        ;; log the mint event
        (print {
            event: "nft-minted",
            token-id: token-id,
            collection-id: collection-id,
            recipient: recipient,
            minted-by: tx-sender
        })
        
        ;; return the new NFT ID
        (ok token-id)
    )
)

