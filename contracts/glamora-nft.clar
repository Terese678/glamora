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

;;========================================
;; PLATFORM STATE VARIABLES
;;========================================

;; this function will keep track of the total NFTs that's been minted, 
;; initially starts at 0 and increases with each new mint
(define-data-var total-nfts-minted uint u0)  

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

;;=======================================
;; READ-ONLY FUNCTIONS
;;=======================================

;; GET TOTAL NFTS MINTED
;; @desc: this function will show how many NFTs that's been minted so far on the platform
(define-read-only (get-total-nfts-minted)
    (var-get total-nfts-minted)
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












