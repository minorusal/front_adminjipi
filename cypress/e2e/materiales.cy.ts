describe('Materiales Form', () => {
  beforeEach(() => {
    // Navigate to the materials page before each test
    // Assuming the materials list is at a route like '/materiales/listado'
    // This might need adjustment based on the actual app routing.
    cy.visit('/materiales/listado-materiales');
  });

  it('should display dynamic fields correctly for each material type', () => {
    // 1. Open the "Add Material" modal
    cy.get('button[title="Agregar Material"]').click();
    cy.get('.add-modal').should('be.visible');

    // 2. Test "Area" type (ID 2)
    cy.get('select#mat-type').select('2');
    cy.get('div[formgroupname="attributes"]').within(() => {
      cy.get('label').should('contain', 'Gauge');
      cy.get('label').should('contain', 'Width');
      cy.get('label').should('contain', 'Length');
      cy.get('label').should('not.contain', 'Volume');
    });

    // 3. Test "Pieza" type (ID 1)
    cy.get('select#mat-type').select('1');
    cy.get('div[formgroupname="attributes"]').within(() => {
      cy.get('label').should('contain', 'Length');
      cy.get('label').should('contain', 'Gauge');
      cy.get('label').should('not.contain', 'Width');
      cy.get('label').should('not.contain', 'Volume');
    });

    // 4. Test "Volumen" type (ID 3)
    // We need to add 'Volumen' to the mock data in the spec file for this to work in tests
    // For a real E2E test, we assume it exists in the DB.
    cy.get('select#mat-type').select('3');
    cy.get('div[formgroupname="attributes"]').within(() => {
      cy.get('label').should('contain', 'Volume');
      cy.get('label').should('not.contain', 'Length');
      cy.get('label').should('not.contain', 'Gauge');
    });

    // 5. Close the modal
    cy.get('.add-modal .close-icon').click();
    cy.get('.add-modal').should('not.exist');
  });

  it('should create a new material of type "Pieza"', () => {
    const materialName = `Test Pieza ${Date.now()}`;

    // 1. Open the modal
    cy.get('button[title="Agregar Material"]').click();

    // 2. Fill the form
    cy.get('input#mat-name').type(materialName);
    cy.get('textarea#mat-desc').type('Descripción de prueba para pieza.');
    cy.get('input#mat-price').type('150');
    cy.get('select#mat-type').select('1'); // Pieza

    // Fill dynamic attributes for "Pieza"
    cy.get('div[formgroupname="attributes"] div[formgroupname="length"] input').type('10');
    cy.get('div[formgroupname="attributes"] div[formgroupname="gauge"] input').type('5');
    
    // 3. Submit the form
    cy.get('form').submit();

    // 4. Verify the material is in the list
    cy.get('.add-modal').should('not.exist');
    cy.contains('td', materialName).should('be.visible');
  });
}); 