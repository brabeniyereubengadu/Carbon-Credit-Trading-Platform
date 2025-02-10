import { describe, it, expect, beforeEach } from "vitest"

// Mock storage for verified projects and verifiers
const verifiedProjects = new Map()
const verifiers = new Map()
let nextProjectId = 1

// Mock functions to simulate contract behavior
function registerProject(owner: string, description: string) {
  const projectId = nextProjectId++
  verifiedProjects.set(projectId, { owner, description, verified: false, verifier: null })
  return projectId
}

function verifyProject(projectId: number, verifier: string) {
  const project = verifiedProjects.get(projectId)
  if (!project) throw new Error("Project not found")
  if (!isVerifier(verifier)) throw new Error("Unauthorized")
  if (project.verified) throw new Error("Already verified")
  project.verified = true
  project.verifier = verifier
  verifiedProjects.set(projectId, project)
  return true
}

function addVerifier(address: string) {
  verifiers.set(address, true)
  return true
}

function removeVerifier(address: string) {
  verifiers.delete(address)
  return true
}

function getProjectInfo(projectId: number) {
  return verifiedProjects.get(projectId)
}

function isVerifier(address: string) {
  return verifiers.get(address) || false
}

describe("Verification Contract", () => {
  beforeEach(() => {
    verifiedProjects.clear()
    verifiers.clear()
    nextProjectId = 1
  })
  
  it("should register a project", () => {
    const projectId = registerProject("owner1", "Carbon sequestration project")
    expect(projectId).toBe(1)
    const project = getProjectInfo(projectId)
    expect(project).toBeDefined()
    expect(project.owner).toBe("owner1")
    expect(project.verified).toBe(false)
  })
  
  it("should verify a project", () => {
    const projectId = registerProject("owner1", "Carbon sequestration project")
    addVerifier("verifier1")
    const result = verifyProject(projectId, "verifier1")
    expect(result).toBe(true)
    const verifiedProject = getProjectInfo(projectId)
    expect(verifiedProject.verified).toBe(true)
    expect(verifiedProject.verifier).toBe("verifier1")
  })
  
  it("should not allow unauthorized verification", () => {
    const projectId = registerProject("owner1", "Carbon sequestration project")
    expect(() => verifyProject(projectId, "unauthorized")).toThrow("Unauthorized")
  })
  
  it("should not verify already verified projects", () => {
    const projectId = registerProject("owner1", "Carbon sequestration project")
    addVerifier("verifier1")
    verifyProject(projectId, "verifier1")
    expect(() => verifyProject(projectId, "verifier1")).toThrow("Already verified")
  })
  
  it("should add and remove verifiers", () => {
    addVerifier("verifier1")
    expect(isVerifier("verifier1")).toBe(true)
    removeVerifier("verifier1")
    expect(isVerifier("verifier1")).toBe(false)
  })
})

