;; Trading Contract

;; Define data structures
(define-map orders
  { order-id: uint }
  {
    seller: principal,
    amount: uint,
    price: uint,
    expiration: uint
  }
)

(define-map balances
  { owner: principal }
  { amount: uint }
)

(define-data-var next-order-id uint u1)

;; Error codes
(define-constant err-unauthorized (err u100))
(define-constant err-invalid-amount (err u101))
(define-constant err-order-not-found (err u102))
(define-constant err-order-expired (err u103))
(define-constant err-insufficient-balance (err u104))

;; Functions
(define-public (create-sell-order (amount uint) (price uint) (expiration uint))
  (let
    ((order-id (var-get next-order-id))
     (seller-balance (default-to u0 (get amount (map-get? balances { owner: tx-sender })))))
    (asserts! (>= seller-balance amount) err-insufficient-balance)
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (> expiration block-height) err-order-expired)
    (map-set orders
      { order-id: order-id }
      {
        seller: tx-sender,
        amount: amount,
        price: price,
        expiration: expiration
      }
    )
    (map-set balances
      { owner: tx-sender }
      { amount: (- seller-balance amount) }
    )
    (var-set next-order-id (+ order-id u1))
    (ok order-id)
  )
)

(define-public (cancel-sell-order (order-id uint))
  (let
    ((order (unwrap! (map-get? orders { order-id: order-id }) err-order-not-found))
     (seller-balance (default-to u0 (get amount (map-get? balances { owner: tx-sender })))))
    (asserts! (is-eq (get seller order) tx-sender) err-unauthorized)
    (map-set balances
      { owner: tx-sender }
      { amount: (+ seller-balance (get amount order)) }
    )
    (map-delete orders { order-id: order-id })
    (ok true)
  )
)

(define-public (buy-credits (order-id uint))
  (let
    ((order (unwrap! (map-get? orders { order-id: order-id }) err-order-not-found))
     (buyer-balance (default-to u0 (get amount (map-get? balances { owner: tx-sender }))))
     (seller-balance (default-to u0 (get amount (map-get? balances { owner: (get seller order) })))))
    (asserts! (<= block-height (get expiration order)) err-order-expired)
    (try! (stx-transfer? (get price order) tx-sender (get seller order)))
    (map-set balances
      { owner: tx-sender }
      { amount: (+ buyer-balance (get amount order)) }
    )
    (map-set balances
      { owner: (get seller order) }
      { amount: (+ seller-balance (get price order)) }
    )
    (map-delete orders { order-id: order-id })
    (ok true)
  )
)

(define-read-only (get-order (order-id uint))
  (map-get? orders { order-id: order-id })
)

(define-read-only (get-balance (owner principal))
  (default-to u0 (get amount (map-get? balances { owner: owner })))
)

