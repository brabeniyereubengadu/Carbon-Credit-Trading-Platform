;; Verification Contract

;; Define data structures
(define-map verified-projects
  { project-id: uint }
  {
    owner: principal,
    description: (string-utf8 256),
    verified: bool,
    verifier: (optional principal)
  }
)

(define-map verifiers
  { address: principal }
  { active: bool }
)

(define-data-var next-project-id uint u1)

;; Error codes
(define-constant err-unauthorized (err u100))
(define-constant err-project-not-found (err u101))
(define-constant err-already-verified (err u102))

;; Functions
(define-public (register-project (description (string-utf8 256)))
  (let
    ((project-id (var-get next-project-id)))
    (map-set verified-projects
      { project-id: project-id }
      {
        owner: tx-sender,
        description: description,
        verified: false,
        verifier: none
      }
    )
    (var-set next-project-id (+ project-id u1))
    (ok project-id)
  )
)

(define-public (verify-project (project-id uint))
  (let
    ((project (unwrap! (map-get? verified-projects { project-id: project-id }) err-project-not-found)))
    (asserts! (is-verifier tx-sender) err-unauthorized)
    (asserts! (not (get verified project)) err-already-verified)
    (ok (map-set verified-projects
      { project-id: project-id }
      (merge project {
        verified: true,
        verifier: (some tx-sender)
      })
    ))
  )
)

(define-public (add-verifier (address principal))
  (ok (map-set verifiers { address: address } { active: true }))
)

(define-public (remove-verifier (address principal))
  (ok (map-delete verifiers { address: address }))
)

(define-read-only (get-project-info (project-id uint))
  (map-get? verified-projects { project-id: project-id })
)

(define-read-only (is-verifier (address principal))
  (default-to false (get active (map-get? verifiers { address: address })))
)

