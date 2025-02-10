;; Carbon Credit Tokenization Contract

;; Define the fungible token
(define-fungible-token carbon-credit-token)

;; Define data structures
(define-map credit-metadata
  { credit-id: uint }
  {
    owner: principal,
    amount: uint,
    project-id: uint,
    expiration: uint
  }
)

(define-data-var next-credit-id uint u1)

;; Error codes
(define-constant err-unauthorized (err u100))
(define-constant err-invalid-amount (err u101))
(define-constant err-credit-not-found (err u102))
(define-constant err-expired (err u103))

;; Functions
(define-public (mint-carbon-credits (amount uint) (project-id uint) (expiration uint))
  (let
    ((credit-id (var-get next-credit-id)))
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (> expiration block-height) err-expired)
    (try! (ft-mint? carbon-credit-token amount tx-sender))
    (map-set credit-metadata
      { credit-id: credit-id }
      {
        owner: tx-sender,
        amount: amount,
        project-id: project-id,
        expiration: expiration
      }
    )
    (var-set next-credit-id (+ credit-id u1))
    (ok credit-id)
  )
)

(define-public (transfer-credits (credit-id uint) (recipient principal) (amount uint))
  (let
    ((credit (unwrap! (map-get? credit-metadata { credit-id: credit-id }) err-credit-not-found)))
    (asserts! (is-eq (get owner credit) tx-sender) err-unauthorized)
    (asserts! (<= amount (get amount credit)) err-invalid-amount)
    (asserts! (> (get expiration credit) block-height) err-expired)
    (try! (ft-transfer? carbon-credit-token amount tx-sender recipient))
    (if (< amount (get amount credit))
      (map-set credit-metadata
        { credit-id: credit-id }
        (merge credit { amount: (- (get amount credit) amount) })
      )
      (map-delete credit-metadata { credit-id: credit-id })
    )
    (ok true)
  )
)

(define-read-only (get-credit-info (credit-id uint))
  (map-get? credit-metadata { credit-id: credit-id })
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance carbon-credit-token account))
)

