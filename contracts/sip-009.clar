;;=======================================
;; title: sip-009

;; summary: This is the SIP-009 NFT Standard Trait Definition for Glamora Fashion Platform

;; description: This contract defines the standard SIP-009 NFT trait
;; interface to work with traits properly with NFT market places, crypto wallets and
;; and any platform that displays NFTs,
;; without following this standard, it won't be recognized or tradeable.

;; author: "Timothy Terese Chimbiv"

;;=======================================
;; SIP-009 NFT TRAIT DEFINITION
;;=======================================

(define-trait nft-trait
    (
        ;; Get the last token ID that was minted
        (get-last-token-id () (response uint uint))
        
        ;; Get the metadata URI for a specific token
        (get-token-uri (uint) (response (optional (string-ascii 256)) uint))
        
        ;; Get the owner of a specific token
        (get-owner (uint) (response (optional principal) uint))
        
        ;; Transfer a token from sender to recipient
        (transfer (uint principal principal) (response bool uint))
    )
)
