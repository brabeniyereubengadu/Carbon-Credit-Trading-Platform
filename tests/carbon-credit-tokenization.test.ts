import { describe, it, expect, beforeEach } from "vitest"

// Mock storage for credit metadata
const creditMetadata = new Map()
let nextCreditId = 1

// Mock functions to simulate contract behavior
function mintCarbonCredits(owner: string, amount: number, projectId: number, expiration: number) {
  const creditId = nextCreditId++
  creditMetadata.set(creditId, { owner, amount, projectId, expiration })
  return creditId
}

function transferCredits(creditId: number, sender: string, recipient: string, amount: number) {
  const credit = creditMetadata.get(creditId)
  if (!credit) throw new Error("Credit not found")
  if (credit.owner !== sender) throw new Error("Unauthorized")
  if (credit.amount < amount) throw new Error("Invalid amount")
  if (credit.expiration <= Date.now()) throw new Error("Expired")
  
  credit.amount -= amount
  if (credit.amount === 0) {
    creditMetadata.delete(creditId)
  } else {
    creditMetadata.set(creditId, credit)
  }
  
  // In a real scenario, we would update the recipient's balance here
  return true
}

function getCreditInfo(creditId: number) {
  return creditMetadata.get(creditId)
}

describe("Carbon Credit Tokenization Contract", () => {
  beforeEach(() => {
    creditMetadata.clear()
    nextCreditId = 1
  })
  
  it("should mint carbon credits", () => {
    const creditId = mintCarbonCredits("owner1", 100, 1, Date.now() + 86400000)
    expect(creditId).toBe(1)
    const credit = getCreditInfo(creditId)
    expect(credit).toBeDefined()
    expect(credit.amount).toBe(100)
    expect(credit.owner).toBe("owner1")
  })
  
  it("should transfer credits", () => {
    const creditId = mintCarbonCredits("owner1", 100, 1, Date.now() + 86400000)
    const result = transferCredits(creditId, "owner1", "recipient1", 50)
    expect(result).toBe(true)
    const updatedCredit = getCreditInfo(creditId)
    expect(updatedCredit.amount).toBe(50)
  })
  
  it("should not allow unauthorized transfers", () => {
    const creditId = mintCarbonCredits("owner1", 100, 1, Date.now() + 86400000)
    expect(() => transferCredits(creditId, "unauthorized", "recipient1", 50)).toThrow("Unauthorized")
  })
  
  it("should not allow transfers of expired credits", () => {
    const creditId = mintCarbonCredits("owner1", 100, 1, Date.now() - 1000)
    expect(() => transferCredits(creditId, "owner1", "recipient1", 50)).toThrow("Expired")
  })
  
  it("should delete credit metadata when fully transferred", () => {
    const creditId = mintCarbonCredits("owner1", 100, 1, Date.now() + 86400000)
    transferCredits(creditId, "owner1", "recipient1", 100)
    expect(getCreditInfo(creditId)).toBeUndefined()
  })
})

