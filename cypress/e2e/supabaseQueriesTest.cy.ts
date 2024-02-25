describe("Supabase Queries", () => {
  it("Should fetch companion details successfully", () => {
    // Simulate a scenario where the companion details are fetched successfully
    cy.intercept("GET", "/api/companion/ae6a470a-a7bd-40d7-a2bc-2a63235d6448", { fixture: "companionDetails.json" }).as(
      "fetchCompanion",
    )

    // Navigate to the page where the companion details are fetched
    cy.visit("/chat/ae6a470a-a7bd-40d7-a2bc-2a63235d6448")

    // Wait for the request to complete and check if the data is displayed correctly
    cy.wait("@fetchCompanion").then(interception => {
      const response = interception.response
      expect(response?.statusCode).to.equal(200) // Assert that the status code is 200
      // Add assertions to verify that the companion details are displayed correctly on the page
    })
  })

  it("Should fetch messages successfully", () => {
    // Simulate a scenario where the messages are fetched successfully
    cy.intercept("GET", "/api/messages/ae6a470a-a7bd-40d7-a2bc-2a63235d6448", { fixture: "messages.json" }).as(
      "fetchMessages",
    )

    // Navigate to the page where the messages are fetched
    cy.visit("/chat/ae6a470a-a7bd-40d7-a2bc-2a63235d6448")

    // Wait for the request to complete and check if the data is displayed correctly
    cy.wait("@fetchMessages").then(interception => {
      const response = interception.response
      expect(response?.statusCode).to.equal(200) // Assert that the status code is 200
      // Add assertions to verify that the messages are displayed correctly on the page
    })
  })
})
