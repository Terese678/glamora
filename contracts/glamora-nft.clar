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
;; ERROR CODES
;;========================================

(define-constant ERR-NOT-NFT-OWNER (err u200)) ;; The caller is not the owner of this NFT
(define-constant ERR-TRANSFER-FAILED (err u201)) ;; When STX or NFT transfer operation fails

;; New error codes for collection management 
(define-constant ERR-NOT-AUTHORIZED (err u202)) ;; The caller is not authorized, 
;; the error triggers if the caller is not the .main contract

(define-constant ERR-INVALID-COLLECTION-NAME (err u203)) ;; when an invalid collection name is provided, 
;; either the collection name is empty or too short

;; Invalid input parameters, 
;; its for general invalid inputs like empty description or max-editions out of range (0 or >10,000)
(define-constant ERR-INVALID-INPUT (err u204)) 

;; ADDITIONAL ERROR CODES
(define-constant ERR-STORAGE-FAILED (err u205)) ;; When saving data to storage contract fails

;;========================================
;; CONSTANTS
;;========================================
;; This sets a 5 STX fee (in microSTX) for creating a new fashion collection on the platform
(define-constant COLLECTION-CREATION-FEE u5000000) 

;; COLLECTION SIZE LIMITS
;; @desc: These set the rules for how big or small a fashion collection can be
;; MIN-COLLECTION-SIZE: The smallest number of NFTs allowed in one collection
;;                      We set this to 1 because a collection needs at least 1 item to make sense
;; MAX-COLLECTION-SIZE: The largest number of NFTs allowed in one collection  
;;                      We set this to 10,000 to prevent spam attacks and keep collections manageable
(define-constant MIN-COLLECTION-SIZE u1)      ;; every collection must have at least 1 NFT
(define-constant MAX-COLLECTION-SIZE u10000)  ;; no collection can have more than 10,000 NFTs

;;========================================
;; PLATFORM STATE VARIABLES
;;========================================

(define-data-var total-nfts-minted uint u0) ;; this function will keep track of the total NFTs that's been minted,
;; initially starts at 0 and increases with each new mint

;; New Platform Variables 
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

;; HELPER FUNCTIONS - read-only 

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
(define-read-only (get-token-uri (token-id uint))
    (match (contract-call? .storage get-nft-metadata token-id) 
        nft-data (ok (some (concat "ipfs://" (get image-ipfs-hash nft-data)))) 
    (ok none))
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

        ;; Make sure only authorized people can create collections
        (asserts! (is-authorized-caller) ERR-NOT-AUTHORIZED)

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
        (unwrap! (contract-call? .storage store-collection-data 
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











