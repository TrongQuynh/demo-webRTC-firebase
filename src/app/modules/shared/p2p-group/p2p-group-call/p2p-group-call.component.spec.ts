import { ComponentFixture, TestBed } from '@angular/core/testing';

import { P2pGroupCallComponent } from './p2p-group-call.component';

describe('P2pGroupCallComponent', () => {
  let component: P2pGroupCallComponent;
  let fixture: ComponentFixture<P2pGroupCallComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [P2pGroupCallComponent]
    });
    fixture = TestBed.createComponent(P2pGroupCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
