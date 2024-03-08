describe("Test UI", () => {
  beforeEach(() => {
    cy.visit("/") // TODO - change it to getURL() to test how it work in production as well
  })
  it("Check UI on / route for FHD screens", () => {
    cy.get("[data-test='cypress-navbar']").should("exist")
    cy.get("[data-test='sidebar']").should("exist")
    cy.get("[data-test='search-input']").should("exist")
    cy.get("[data-test='categories-tabs']").should("exist")
    // issue here because some fetching problem on production - https://i.imgur.com/9PV8luD.png
    cy.get("[data-test='companions-data-0']").should("not.exist")
    cy.get("[data-test='companions']").should("exist")
  })
  it("Check UI on / route for HD screens", () => {
    // TODO - test UI for HD screens
    // cy.get("[data-test='cypress-navbar']").should("exist")
    // cy.get("[data-test='sidebar']").should("exist")
    // cy.get("[data-test='search-input']").should("exist")
    // cy.get("[data-test='categories-tabs']").should("exist")
    // // issue here because some fetching problem on production - https://i.imgur.com/9PV8luD.png
    // cy.get("[data-test='companions-data-0']").should("not.exist")
    // cy.get("[data-test='companions']").should("exist")
  })
})
