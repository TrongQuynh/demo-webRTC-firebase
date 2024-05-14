import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallingCardComponent } from './calling-card.component';

describe('CallingCardComponent', () => {
  let component: CallingCardComponent;
  let fixture: ComponentFixture<CallingCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CallingCardComponent]
    });
    fixture = TestBed.createComponent(CallingCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
