describe("test redirection on /companion/new route", () => {
  it("redirect user to / route if not logged in (not authenticated)", () => {
    cy.visit("/companion/new")
    // url should be changed to /
    cy.url().should("eq", Cypress.config().baseUrl + "/")
  })

  // Test when the user is authenticated
  it("redirects authenticated user to /companion/new route", () => {
    // Log in the user using curl command
    // cy.request({
    //   method: "POST",
    //   url: "https://<your_supabase_url>/auth/v1/token",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: {
    //     email: "<your_email>",
    //     password: "<your_password>",
    //     provider: "email",
    //   },
    // }).then(response => {
    //   // Check if the response is successful
    //   expect(response.status).to.eq(200)
    //   // Use the response body for further assertions or actions
    //   const token = response.body.access_token
    //   // Visit the companion/new route with the authenticated token
    //   cy.visit("/companion/new", {
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //     },
    //   })
    //   // URL should be changed to /companion/new
    //   cy.url().should("eq", Cypress.config().baseUrl + "/companion/new")
    // })
  })
})
