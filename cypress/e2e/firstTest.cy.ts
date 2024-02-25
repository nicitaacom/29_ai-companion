describe("template spec", () => {
  it("visit website and make sure that navbar exist", () => {
    cy.visit("http://localhost:3029") // TODO - change it to getURL() to test how it work in production as well

    cy.get("[data-testid='cypress-navbar']").should("exist")
  })
})
