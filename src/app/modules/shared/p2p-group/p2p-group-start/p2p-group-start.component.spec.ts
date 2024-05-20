import { ComponentFixture, TestBed } from '@angular/core/testing';

import { P2pGroupStartComponent } from './p2p-group-start.component';

describe('P2pGroupStartComponent', () => {
  let component: P2pGroupStartComponent;
  let fixture: ComponentFixture<P2pGroupStartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [P2pGroupStartComponent]
    });
    fixture = TestBed.createComponent(P2pGroupStartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
