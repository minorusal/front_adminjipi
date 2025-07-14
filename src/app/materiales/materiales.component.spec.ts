import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialesComponent } from './materiales.component';

describe('MaterialesComponent', () => {
  let component: MaterialesComponent;
  let fixture: ComponentFixture<MaterialesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MaterialesComponent]
    });
    fixture = TestBed.createComponent(MaterialesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
