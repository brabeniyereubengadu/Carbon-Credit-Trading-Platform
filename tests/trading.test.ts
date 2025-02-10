import { describe, it, expect, beforeEach } from "vitest"

// Mock storage for orders and balances
const orders = new Map()
const balances = new Map()
let nextOrderId = 1

// Mock functions to simulate contract behavior
function createSellOrder(seller: string, amount: number, price: number, expiration: number) {
  const sellerBalance = balances.get(seller) || 0
  if (sellerBalance < amount) throw new Error("Insufficient balance")
  if (amount <= 0) throw new Error("Invalid amount")
  if (expiration <= Date.now()) throw new Error("Invalid expiration")
  
  const orderId = nextOrderId++
  orders.set(orderId, { seller, amount, price, expiration })
  balances.set(seller, sellerBalance - amount)
  return orderId
}

function cancelSellOrder(orderId: number, sender: string) {
  const order = orders.get(orderId)
  if (!order) throw new Error("Order not found")
  if (order.seller !== sender) throw new Error("Unauthorized")
  
  const sellerBalance = balances.get(sender) || 0
  balances.set(sender, sellerBalance + order.amount)
  orders.delete(orderId)
  return true
}

function buyCredits(orderId: number, buyer: string) {
  const order = orders.get(orderId)
  if (!order) throw new Error("Order not found")
  if (order.expiration <= Date.now()) throw new Error("Order expired")
  
  const buyerBalance = balances.get(buyer) || 0
  const sellerBalance = balances.get(order.seller) || 0
  
  balances.set(buyer, buyerBalance + order.amount)
  balances.set(order.seller, sellerBalance + order.price)
  orders.delete(orderId)
  return true
}

function getOrder(orderId: number) {
  return orders.get(orderId)
}

function getBalance(owner: string) {
  return balances.get(owner) || 0
}

describe("Trading Contract", () => {
  beforeEach(() => {
    orders.clear()
    balances.clear()
    nextOrderId = 1
  })
  
  it("should create a sell order", () => {
    balances.set("seller1", 1000)
    const orderId = createSellOrder("seller1", 100, 1000, Date.now() + 86400000)
    expect(orderId).toBe(1)
    const order = getOrder(orderId)
    expect(order).toBeDefined()
    expect(order.seller).toBe("seller1")
    expect(order.amount).toBe(100)
    expect(order.price).toBe(1000)
    expect(getBalance("seller1")).toBe(900)
  })
  
  it("should not create a sell order with insufficient balance", () => {
    balances.set("seller1", 50)
    expect(() => createSellOrder("seller1", 100, 1000, Date.now() + 86400000)).toThrow("Insufficient balance")
  })
  
  it("should cancel a sell order", () => {
    balances.set("seller1", 1000)
    const orderId = createSellOrder("seller1", 100, 1000, Date.now() + 86400000)
    const result = cancelSellOrder(orderId, "seller1")
    expect(result).toBe(true)
    expect(getOrder(orderId)).toBeUndefined()
    expect(getBalance("seller1")).toBe(1000)
  })
  
  it("should not allow unauthorized cancellation", () => {
    balances.set("seller1", 1000)
    const orderId = createSellOrder("seller1", 100, 1000, Date.now() + 86400000)
    expect(() => cancelSellOrder(orderId, "unauthorized")).toThrow("Unauthorized")
  })
})

