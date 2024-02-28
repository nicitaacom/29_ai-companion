describe("Test UI", () => {
  beforeEach(() => {
    cy.visit("/") // TODO - change it to getURL() to test how it work in production as well
  })
  it("Check UI on / route", () => {
    cy.wait(20000)
    cy.get("[data-test='cypress-navbar']").should("exist")
    cy.get("[data-test='sidebar']").should("exist")
    cy.get("[data-test='search-input']").should("exist")
    cy.get("[data-test='categories-tabs']").should("exist")
    cy.get("[data-test='companions']").should("exist")
  })
})
